package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	ics "github.com/arran4/golang-ical"
)

var PORT = os.Getenv("PORT")
var POCKETBASE_HOST = os.Getenv("PB_HOST")
var POCKETBASE_USER = os.Getenv("PB_USER")
var POCKETBASE_PASSWORD = os.Getenv("PB_PASSWORD")
var BASENAME = os.Getenv("BASENAME")

const CONTENT_TYPE_ICS = "text/calendar"

type CacheEntry struct {
	key        string
	expires    time.Time
	recordHash string
	value      *ics.Calendar
}

var Cache map[string]CacheEntry = make(map[string]CacheEntry)

var adminToken *AdminToken

func main() {
	http.HandleFunc(BASENAME+"/", func(w http.ResponseWriter, req *http.Request) {
		if !strings.HasPrefix(req.URL.Path, BASENAME+"/") {
			http.Error(w, "404 not found.", http.StatusNotFound)
			log.Printf("path not found: %s", req.URL.Path)
			return
		}

		if req.Method != "GET" {
			http.Error(w, "405 method is not supported.", http.StatusMethodNotAllowed)
			log.Printf("method not supported: %s", req.Method)
			return
		}

		icalId := strings.TrimPrefix(req.URL.Path, BASENAME+"/")
		icalId = strings.TrimSuffix(icalId, ".ics") // Remove ".ics" if there

		// Check adminToken
		if adminToken == nil || adminToken.expires.Before(time.Now()) {
			token, err := GetAdminToken()
			adminToken = token
			if r := handleInternalError(err, w); r {
				return
			}
		}

		// check and get ical record
		icalRecord, err := GetIcalRecord(icalId, adminToken.token)
		if r := handleInternalError(err, w); r {
			return
		}
		if icalRecord == nil || (icalRecord != nil && len(icalRecord.FileList) == 0) {
			http.Error(w, "404 not found.", http.StatusNotFound)
			log.Printf("icalRecord not found: %s", icalId)
			return
		}

		// Check Cache
		cachedCal := getCache(icalRecord)
		if cachedCal != nil {
			log.Printf("found calendar in cache: %s", icalRecord.Id)
			w.Header().Add("Content-Type", CONTENT_TYPE_ICS)
			fmt.Fprint(w, cachedCal.Serialize())
			return
		}

		// build filter and get file list
		fileList, err := getFileList(buildFilter(icalRecord.FileList), adminToken.token)
		if r := handleInternalError(err, w); r {
			return
		}

		// get file urls and download
		urls := buildUrls(fileList)
		files, err := downloadMultipleFiles(urls)
		if r := handleInternalError(err, w); r {
			return
		}

		// Parse
		cal, err := ParseMultipleHtml(files)
		if r := handleInternalError(err, w); r {
			return
		}

		insertCache(icalRecord, cal)

		log.Printf("parsed calendar: %s", icalRecord.Id)
		w.Header().Add("Content-Type", CONTENT_TYPE_ICS)
		fmt.Fprint(w, cal.Serialize())
	})

	log.Printf("Starting server at port %v\n\tPB_HOST: %s\n\tPB_USER: %s\n\tBASENAME: %s", PORT, POCKETBASE_HOST, POCKETBASE_USER, BASENAME)

	if err := http.ListenAndServe(fmt.Sprintf(":%v", PORT), nil); err != nil {
		log.Fatal(err)
	}

}

func insertCache(icalRecord *IcalRecord, calendar *ics.Calendar) {
	content, _ := json.Marshal(icalRecord)
	hash := hash(string(content))

	Cache[icalRecord.Id] = CacheEntry{
		key:        icalRecord.Id,
		expires:    time.Now().Add(2 * time.Hour),
		recordHash: hash,
		value:      calendar,
	}
}

func getCache(icalRecord *IcalRecord) *ics.Calendar {
	content, _ := json.Marshal(icalRecord)
	hash := hash(string(content))

	cacheEntry, ok := Cache[icalRecord.Id]
	if !ok {
		return nil
	}

	if cacheEntry.recordHash != hash {
		delete(Cache, icalRecord.Id)
		return nil
	}

	if cacheEntry.expires.Before(time.Now()) {
		delete(Cache, icalRecord.Id)
		return nil
	}

	return cacheEntry.value
}
