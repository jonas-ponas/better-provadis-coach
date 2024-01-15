FROM golang:1.21

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /ical-service

ENV PORT=8080
ENV BASENAME="/ical"
EXPOSE 8080

CMD [ "./ical-service" ]
