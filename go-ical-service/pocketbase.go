package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

var httpClient = &http.Client{}

func GetAdminToken() (*struct {
	token   string
	expires time.Time
}, error) {
	// /api/admins/auth-with-password

	jsonBody := fmt.Sprintf("{\"identity\":\"%s\",\"password\":\"%s\"}", POCKETBASE_USER, POCKETBASE_PASSWORD)

	request, err := http.NewRequest("POST", POCKETBASE_HOST+"/api/admins/auth-with-password", bytes.NewBuffer([]byte(jsonBody)))
	request.Header.Add("Content-Type", "application/json")
	if err != nil {
		return nil, err
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("got code %d", response.StatusCode)
	}

	var jsonResponse map[string]any
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(&jsonResponse); err != nil {
		return nil, err
	}
	if token, ok := jsonResponse["token"]; ok {
		return &struct {
			token   string
			expires time.Time
		}{
			token.(string),
			time.Now().Add(1 * time.Hour),
		}, nil
	}
	return nil, fmt.Errorf("could not parse response")
}

type IcalRecord struct {
	Id             string   `json:"id"`
	CollectionId   string   `json:"collectionId"`
	CollectionName string   `json:"collectionName"`
	Created        string   `json:"created"`
	Updated        string   `json:"updated"`
	User           string   `json:"user"`
	FileList       []string `json:"fileList"`
}

func GetIcalRecord(recordId string, token string) (*IcalRecord, error) {

	request, err := http.NewRequest("GET", POCKETBASE_HOST+"/api/collections/icals/records/"+recordId, nil)
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("Authorization", "Bearer "+token)
	if err != nil {
		return nil, err
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if response.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("got code %d", response.StatusCode)
	}

	var icalRecord IcalRecord
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(&icalRecord); err != nil {
		return nil, err
	}
	return &icalRecord, nil
}

type FileRecord struct {
	Id             string   `json:"id"`
	CollectionId   string   `json:"collectionId"`
	CollectionName string   `json:"collectionName"`
	Created        string   `json:"created"`
	Updated        string   `json:"updated"`
	Name           string   `json:"name"`
	Size           int      `json:"size"`
	Timestamp      string   `json:"timestamp"`
	CoachId        int      `json:"coachId"`
	Parent         string   `json:"parent"`
	CachedFile     string   `json:"cachedFile"`
	AllowedUser    []string `json:"allowedUser"`
	FileList       []string `json:"fileList"`
}

func getFileList(filter string, token string) ([]FileRecord, error) {

	endpoint, err := url.Parse(POCKETBASE_HOST + "/api/collections/file/records?filter=" + url.QueryEscape(filter))
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequest("GET", endpoint.String(), nil)
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("Authorization", "Bearer "+token)
	if err != nil {
		return nil, err
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, err
	}

	if response.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("got code %d", response.StatusCode)
	}

	var result struct {
		Files []FileRecord `json:"items"`
	}
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result.Files, nil
}

// Taken From https://medium.com/@dhanushgopinath/concurrent-http-downloads-using-go-32fecfa1ed27
func downloadFile(URL string) ([]byte, error) {
	response, err := http.Get(URL)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, errors.New(response.Status)
	}
	var data bytes.Buffer
	_, err = io.Copy(&data, response.Body)
	if err != nil {
		return nil, err
	}
	return data.Bytes(), nil
}

// Taken From https://medium.com/@dhanushgopinath/concurrent-http-downloads-using-go-32fecfa1ed27
func downloadMultipleFiles(urls []string) ([][]byte, error) {
	done := make(chan []byte, len(urls))
	errch := make(chan error, len(urls))
	for _, URL := range urls {
		go func(URL string) {
			b, err := downloadFile(URL)
			if err != nil {
				errch <- err
				done <- nil
				return
			}
			done <- b
			errch <- nil
		}(URL)
	}
	bytesArray := make([][]byte, 0)
	var errStr string
	for i := 0; i < len(urls); i++ {
		bytesArray = append(bytesArray, <-done)
		if err := <-errch; err != nil {
			errStr = errStr + " " + err.Error()
		}
	}
	var err error
	if errStr != "" {
		err = errors.New(errStr)
	}
	return bytesArray, err
}
