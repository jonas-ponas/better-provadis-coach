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

	"github.com/golang-jwt/jwt/v5"
)

var httpClient = &http.Client{}

type AdminToken struct {
	token   string
	expires time.Time
}

func GetAdminToken() (*AdminToken, error) {
	jsonBody := fmt.Sprintf("{\"identity\":\"%s\",\"password\":\"%s\"}", POCKETBASE_USER, POCKETBASE_PASSWORD)
	requestUrl := POCKETBASE_HOST + "/api/admins/auth-with-password"

	debug(fmt.Sprintf("%s %s %s", "POST", requestUrl, jsonBody))
	request, err := http.NewRequest("POST", requestUrl, bytes.NewBuffer([]byte(jsonBody)))
	request.Header.Add("Content-Type", "application/json")
	if err != nil {
		return nil, errors.Join(errors.New("getAdminToken failed: failed to create request"), err)
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, errors.Join(errors.New("getAdminToken failed: http request failed"), err)
	}

	if response.StatusCode != http.StatusOK {
		if DEBUG {
			defer response.Body.Close()
			body, _ := io.ReadAll(response.Body)
			debug(string(body))
		}
		return nil, fmt.Errorf("getAdminToken failed: got statuscode %d, expected %d", response.StatusCode, http.StatusOK)
	}

	var jsonResponse map[string]any
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(&jsonResponse); err != nil {
		return nil, errors.Join(errors.New("getAdminToken failed: failed to parse json"), err)
	}
	if tokenStr, ok := jsonResponse["token"]; ok {
		parser := jwt.NewParser(jwt.WithExpirationRequired())
		token, _, err := parser.ParseUnverified(tokenStr.(string), jwt.MapClaims{})
		if err != nil {
			return nil, errors.Join(errors.New("getAdminToken failed: failed to parse jwt"), err)
		}
		expiration, _ := token.Claims.GetExpirationTime()
		return &AdminToken{
			tokenStr.(string),
			expiration.Time,
		}, nil
	}
	return nil, fmt.Errorf("getAdminToken failed: failed to parse response")
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
	requestUrl := POCKETBASE_HOST + "/api/collections/icals/records/" + recordId
	debug(fmt.Sprintf("%s %s", "GET", requestUrl))
	request, err := http.NewRequest("GET", requestUrl, nil)
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("Authorization", "Bearer "+token)
	if err != nil {
		return nil, errors.Join(errors.New("getIcalRecord failed: could not create request"), err)
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, errors.Join(errors.New("getIcalRecord failed: http request failed"), err)
	}

	if response.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	if response.StatusCode != http.StatusOK {
		if DEBUG {
			defer response.Body.Close()
			body, _ := io.ReadAll(response.Body)
			debug(string(body))
		}
		return nil, fmt.Errorf("getIcalRecord failed: got status code %d, expected %d", response.StatusCode, http.StatusOK)
	}

	var icalRecord IcalRecord
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(&icalRecord); err != nil {
		return nil, errors.Join(errors.New("getIcalRecord failed: could not parse response json"), err)

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

	requestUrl, err := url.Parse(POCKETBASE_HOST + "/api/collections/file/records?filter=" + url.QueryEscape(filter))
	if err != nil {
		return nil, errors.Join(errors.New("getFileList failed: could not create url"), err)
	}
	debug(fmt.Sprintf("%s %s", "GET", requestUrl))
	request, err := http.NewRequest("GET", requestUrl.String(), nil)
	request.Header.Add("Content-Type", "application/json")
	request.Header.Add("Authorization", "Bearer "+token)
	if err != nil {
		return nil, errors.Join(errors.New("getFileList failed: could not create request"), err)
	}

	response, err := httpClient.Do(request)
	if err != nil {
		return nil, errors.Join(errors.New("getFileList failed: http request failed"), err)
	}

	if response.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	if response.StatusCode != http.StatusOK {
		if DEBUG {
			defer response.Body.Close()
			body, _ := io.ReadAll(response.Body)
			debug(string(body))
		}
		return nil, fmt.Errorf("getFileList failed: got status code %d, expected %d", response.StatusCode, http.StatusOK)

	}

	var result struct {
		Files []FileRecord `json:"items"`
	}
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return nil, errors.Join(errors.New("getFileList failed: could not parse response json"), err)
	}
	return result.Files, nil
}

// Taken From https://medium.com/@dhanushgopinath/concurrent-http-downloads-using-go-32fecfa1ed27
func downloadFile(URL string) ([]byte, error) {
	debug(fmt.Sprintf("GET %s", URL))
	response, err := http.Get(URL)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		if DEBUG {
			defer response.Body.Close()
			body, _ := io.ReadAll(response.Body)
			debug(string(body))
		}
		return nil, fmt.Errorf("getFileList failed: got status code %d, expected %d", response.StatusCode, http.StatusOK)
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
