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

type CacheEntry struct {
	key        string
	expires    time.Time
	recordHash string
	value      *ics.Calendar
}

var Cache map[string]CacheEntry = make(map[string]CacheEntry)

var adminToken struct {
	token   string
	expires time.Time
}

func main() {
	http.HandleFunc(BASENAME+"/", func(w http.ResponseWriter, req *http.Request) {
		log.Println(req.URL.Path)
		if !strings.HasPrefix(req.URL.Path, BASENAME+"/") {
			http.Error(w, "404 not found.", http.StatusNotFound)
			return
		}

		if req.Method != "GET" {
			http.Error(w, "405 method is not supported.", http.StatusMethodNotAllowed)
			return
		}

		icalId := strings.TrimPrefix(req.URL.Path, BASENAME+"/")
		icalId = strings.TrimSuffix(icalId, ".ics") // Remove ".ics" if there

		// Check adminToken
		if adminToken.expires.Before(time.Now()) {
			token, err := GetAdminToken()
			adminToken = *token
			if err != nil {
				http.Error(w, "500 internal server error.", http.StatusInternalServerError)
				return
			}

		}

		// check and get ical record
		icalRecord, err := GetIcalRecord(icalId, adminToken.token)
		if err != nil {
			http.Error(w, "500 internal server error.", http.StatusInternalServerError)
			return
		}
		if icalRecord == nil || (icalRecord != nil && len(icalRecord.FileList) == 0) {
			http.Error(w, "404 not found.", http.StatusNotFound)
			return
		}

		// Check Cache
		cachedCal := getCache(icalRecord)
		if cachedCal != nil {
			fmt.Println("Cache Hit")
			w.Header().Add("Content-Type", "text/calendar")
			fmt.Fprint(w, cachedCal.Serialize())
			return
		}

		// build filter and get file list
		fileList, err := getFileList(buildFilter(icalRecord.FileList), adminToken.token)
		if err != nil {
			http.Error(w, "500 internal server error.", http.StatusInternalServerError)
			log.Fatal(err)
			return
		}

		// get file urls and download
		urls := buildUrls(fileList)
		files, err := downloadMultipleFiles(urls)
		if err != nil {
			http.Error(w, "500 internal server error.", http.StatusInternalServerError)
			log.Fatal(err)
			return
		}

		// Parse Html to Ical Files
		done := make(chan []*ics.VEvent, len(files))
		for _, file := range files {
			go func(file []byte) {
				events := ParseHtmlToEvents(strings.NewReader(string(file)))
				done <- events
			}(file)
		}
		events := make([]*ics.VEvent, 0)
		for i := 0; i < len(urls); i++ {
			events = append(events, (<-done)...)
		}
		cal := CalendarFromEvents(events)

		insertCache(icalRecord, cal)

		w.Header().Add("Content-Type", "text/calendar")
		fmt.Fprint(w, cal.Serialize())
	})

	log.Printf("Starting server at port %v\n", PORT)

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
