FROM alpine:latest

ARG PB_VERSION=0.16.6
ARG INITIAL_PASSWORD
ARG INITIAL_USER=dev@dev.local

RUN apk add --no-cache \
    unzip \
    curl \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/
# copy init script
COPY ./init_script.sh /pb/init_script.sh
COPY ./schema.json /pb/schema.json
RUN chmod +x /pb/init_script.sh

# init collections
RUN /pb/init_script.sh

EXPOSE 8080

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]

