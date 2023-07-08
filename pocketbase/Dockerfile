FROM alpine:latest

ARG PB_VERSION=0.16.6

RUN apk add --no-cache \
    unzip \
    curl \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# copy scripts
COPY ./init.sh /pb/init.sh
COPY ./start.sh /pb/start.sh
COPY ./schema.json /pb/schema.json

RUN chmod +x /pb/init.sh && chmod +x /pb/start.sh && chmod 755 /pb/schema.json

# init 
# RUN cd pb && ./init.sh
RUN /pb/init.sh
EXPOSE 8090

# start PocketBase
CMD ["/pb/start.sh"]

