FROM golang:1.21-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o ./ical-service
# RUN ls -l
# RUN chmod +x ./ical-service

FROM alpine:edge

WORKDIR /app

COPY --from=build /app/ical-service .
RUN apk --no-cache add ca-certificates tzdata


ENV PORT=8080
ENV BASENAME="/ical"

ENTRYPOINT ["/app/ical-service"]