ARG PB_VERSION
FROM node:19 as build
COPY . . 
RUN npm ci
RUN npm run build

FROM ghcr.io/muchobien/pocketbase:${PB_VERSION}

ARG UI_VERSION
ARG PB_VERSION

EXPOSE 8090
COPY --from=build ./dist ./dist
RUN echo "[\"${UI_VERSION}\", \"${PB_VERSION}\"]" >> ./dist/version.json
ENTRYPOINT ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/dist"]
