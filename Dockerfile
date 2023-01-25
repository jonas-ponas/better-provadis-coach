ARG PB_VERSION
FROM node:19 as build
COPY . . 

ARG GOOGLE_REDIRECT_URI 
ARG GITHUB_REDIRECT_URI 
ARG WEBSOCKET_URI 
ARG POCKETBASE_URI 
ARG UI_VERSION
ARG PB_VERSION

ENV VITE_UI_VERSION=${UI_VERSION}
ENV VITE_PB_VERSION=${PB_VERSION}
ENV VITE_GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI} 
ENV VITE_GITHUB_REDIRECT_URI=${GITHUB_REDIRECT_URI} 
ENV VITE_WEBSOCKET_URI=${WEBSOCKET_URI} 
ENV VITE_POCKETBASE_URI=${POCKETBASE_URI}

RUN npm ci
RUN npm run build

FROM ghcr.io/muchobien/pocketbase:${PB_VERSION}

EXPOSE 8090
COPY --from=build ./dist ./dist
ENTRYPOINT ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/dist"]
