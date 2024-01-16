package main

import (
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	ics "github.com/arran4/golang-ical"
	"golang.org/x/net/html"
)

func ParseMultipleHtml(files [][]byte) (*ics.Calendar, error) {
	// Parse Html to Ical Files
	done := make(chan []*ics.VEvent, len(files))
	errch := make(chan error, len(files))
	for _, file := range files {
		go func(file []byte) {
			events, err := ParseHtmlToEvents(strings.NewReader(string(file)))
			if err != nil {
				errch <- err
				done <- []*ics.VEvent{}
				return
			}
			errch <- nil
			done <- events
		}(file)
	}
	events := make([]*ics.VEvent, 0)
	var errs error = nil
	for i := 0; i < len(files); i++ {
		if err := <-errch; err != nil {
			errs = errors.Join(errs, err)
		}
		events = append(events, <-done...)
	}
	return CalendarFromEvents(events), errs
}

func ParseHtmlToEvents(reader io.Reader) ([]*ics.VEvent, error) {
	htmlDoc, err := html.Parse(reader)
	if err != nil {
		return nil, err
	}
	events := make([]*ics.VEvent, 0)
	tables := findTables(htmlDoc)
	for _, table := range tables {
		for _, event := range parseEventsFromTable(table) {
			vEvent, err := event.toIcalEvent()
			if err != nil {
				fmt.Println(err.Error())
				break
			}
			events = append(events, vEvent)
		}
	}

	return events, nil
}

func ParseHtmlToIcal(reader io.Reader) (*ics.Calendar, error) {
	cal := ics.NewCalendarFor("Better Provadis Coach")
	cal.SetTimezoneId("Europe/Berlin")
	events, err := ParseHtmlToEvents(reader)
	if err != nil {
		return nil, err
	}
	for _, event := range events {
		cal.AddVEvent(event)
	}
	return cal, nil
}

func CalendarFromEvents(events []*ics.VEvent) *ics.Calendar {
	cal := ics.NewCalendarFor("Better Provadis Coach")
	cal.SetTimezoneId("Europe/Berlin")
	for _, event := range events {
		cal.AddVEvent(event)
	}
	return cal
}

/* Internal stuff below */

func findTables(node *html.Node) []*html.Node {
	if node.Type == html.ElementNode && node.Data == "table" {
		return []*html.Node{node}
	}
	tables := make([]*html.Node, 0)
	for c := node.FirstChild; c != nil; c = c.NextSibling {
		children := findTables(c)
		tables = append(tables, children...)
	}
	return tables
}

func parseEventsFromTable(node *html.Node) []*EventData {
	events := make([]*EventData, 0)
	var tbody *html.Node

	// Find tbody
	for el := node.FirstChild; el != nil; el = el.NextSibling {
		if el.Data == "tbody" {
			tbody = el
			break
		}
	}

	for row := tbody.FirstChild; row != nil; row = row.NextSibling {
		if row.Data != "tr" { // is not row
			continue
		}

		for cell := row.FirstChild; cell != nil; cell = cell.NextSibling {
			if cell.Data != "td" { // is not cell
				continue
			}
			for _, attr := range cell.Attr {
				if attr.Key == "class" && attr.Val == "v" {
					events = append(events, parseCellToEventData(cell))
				}
			}
		}
	}
	return events
}

func parseCellToEventData(cell *html.Node) *EventData {
	var event = &EventData{}

	// Parse Attributes
	for _, attr := range cell.Attr {
		if attr.Key == "id" {
			event.Id = attr.Val
			break // id is the only value we need from attributes
		}
	}

	// Parse Children
	i := 0
	multipleOrganizers := false
	for token := cell.FirstChild; token != nil; token = token.NextSibling {
		switch token.Type {
		case html.TextNode:
			if i == 0 {
				event.Date = token.Data
			} else if i == 2 {
				event.Time = token.Data
			} else if i == 4 {
				event.Name = token.Data
			} else if i == 6 {
				event.Type = token.Data
			} else if i == 9 && (token.Data == "," || token.Data == ", ") {
				multipleOrganizers = true
			}
		case html.ElementNode:
			if token.Data == "a" && i == 4 { // Anomality!
				linkText := token.FirstChild.Data
				event.Name = linkText
			}
			if (token.Data == "a" && i == 8) || (multipleOrganizers && token.Data == "a" && i > 9) {
				var linkHref string
				linkText := token.FirstChild.Data
				for _, linkAttr := range token.Attr {
					if linkAttr.Key == "href" {
						linkHref = linkAttr.Val
					}
				}
				event.Teacher = append(event.Teacher, linkText)
				event.Url = append(event.Url, linkHref)
			}

		}
		i++
	}
	return event
}

func toUtf8(iso8859_1_buf []byte) string {
	buf := make([]rune, len(iso8859_1_buf))
	for i, b := range iso8859_1_buf {
		buf[i] = rune(b)
	}
	return string(buf)
}

type EventData struct {
	Id      string
	Name    string
	Date    string
	Time    string
	Type    string // "Vorlesung" or "E-Learning"
	Teacher []string
	Url     []string
}

func (ed *EventData) toIcalEvent() (*ics.VEvent, error) {
	addTimeStringToDate := func(date time.Time, timeString string, loc *time.Location) (time.Time, error) {
		if splits := strings.Split(timeString, ":"); len(splits) == 2 {
			hour, err := strconv.Atoi(splits[0])
			if err != nil {
				return time.Now(), errors.Join(fmt.Errorf("error while parsing time: \"%s\"", ed.Time), err)
			}
			minute, err := strconv.Atoi(splits[1])
			if err != nil {
				return time.Now(), errors.Join(fmt.Errorf("error while parsing time: \"%s\"", ed.Time), err)
			}
			return time.Date(date.Year(), date.Month(), date.Day(), hour, minute, 0, 0, loc), nil
		} else {
			return time.Now(), fmt.Errorf("error while parsing time: \"%s\"", ed.Time)
		}
	}
	vEvent := ics.NewEvent(ed.Id)
	location, _ := time.LoadLocation("Europe/Berlin")

	// src-format "Mo, 08.04.24"
	var startTime time.Time
	var endTime time.Time
	if splits := strings.Split(ed.Date, ","); len(splits) >= 2 {
		format := " 02.01.06" // ref time Mon Jan 2 15:04:05 MST 2006
		parsedTime, err := time.ParseInLocation(format, splits[1], location)
		if err != nil {
			return nil, errors.Join(fmt.Errorf("error while parsing event date: \"%s\"", splits[1]), err)
		}
		endTime = parsedTime
		startTime = parsedTime
	} else {
		return nil, fmt.Errorf("error while parsing event date: \"%s\"", ed.Date)
	}

	// src-format "9:45 - 13:00 Uhr (4:00 UE)"
	if fields := strings.Fields(ed.Time); len(fields) >= 3 {
		startTime, err := addTimeStringToDate(startTime, fields[0], location)
		if err != nil {
			return nil, err
		}
		endTime, err := addTimeStringToDate(endTime, fields[2], location)
		if err != nil {
			return nil, err
		}
		vEvent.SetStartAt(startTime)
		vEvent.SetEndAt(endTime)
		vEvent.SetDtStampTime(startTime)
	} else {
		return nil, fmt.Errorf("error while parsing event end time: \"%s\"", ed.Time)
	}

	vEvent.SetSummary(toUtf8([]byte(ed.Name)), ics.WithEncoding("UTF-8"))

	if len(ed.Teacher) == 0 {
		return vEvent, nil
	}

	teacherHash := hash(ed.Teacher[0])
	vEvent.SetOrganizer(fmt.Sprintf("mailto:%s@coach.j0nas.xyz", teacherHash), ics.WithCN(toUtf8([]byte(ed.Teacher[0]))), ics.WithEncoding("UTF-8"))
	vEvent.SetURL(ed.Url[0], ics.WithCN("Zoom"))
	vEvent.SetLocation(ed.Url[0], ics.WithCN("Zoom"))

	description := ""
	for i, teacher := range ed.Teacher {
		description += teacher + ": " + ed.Url[i] + "\n"
	}
	vEvent.SetDescription(description)

	return vEvent, nil
}
