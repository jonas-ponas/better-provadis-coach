package main

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/spaolacci/murmur3"
)

func hash(s string) string {
	hasher := murmur3.New32()
	hasher.Write([]byte(s))
	return fmt.Sprintf("%x", hasher.Sum32())
}

func buildFilter(files []string) string {
	fileNameFilter := make([]string, 0)
	for _, fileName := range files {
		fileNameFilter = append(fileNameFilter, fmt.Sprintf("name ~ '%s'", fileName))
	}
	return "(" + strings.Join(fileNameFilter, " || ") + ")" + " && name ~ '.html'" // && allowedUser.id ?= '" + icalRecord.User + "'
}

func buildUrls(files []FileRecord) []string {
	sort.SliceStable(files, func(i, j int) bool {
		it, err := time.Parse(files[i].Timestamp, time.RFC3339)
		if err != nil {
			return true
		}
		jt, err := time.Parse(files[j].Timestamp, time.RFC3339)
		if err != nil {
			return false
		}
		return it.UnixMilli() < jt.UnixMilli()
	})
	urlList := make(map[string]string)
	for _, file := range files {
		_, ok := urlList[file.Name]
		if !ok {
			urlList[file.Name] = POCKETBASE_HOST + "/api/files/" + file.CollectionId + "/" + file.Id + "/" + file.CachedFile
		}
	}
	urls := make([]string, 0)
	for _, value := range urlList {
		urls = append(urls, value)
	}
	return urls
}

func handleInternalError(err error, w http.ResponseWriter) bool {
	if err != nil {
		http.Error(w, "500 Internal server error.", http.StatusInternalServerError)
		log.Fatal(fmt.Errorf("internal server error!\n%w", err))
		return true
	}
	return false
}
