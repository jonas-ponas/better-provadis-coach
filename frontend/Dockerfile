ARG PB_VERSION
FROM node:lts as build

WORKDIR /app
COPY . . 

ARG UI_VERSION
ARG PB_VERSION

ENV VITE_UI_VERSION=${UI_VERSION}
ENV VITE_PB_VERSION=${PB_VERSION}

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM ghcr.io/muchobien/pocketbase:${PB_VERSION}

EXPOSE 8090
COPY --from=build /app/dist ./dist
ENTRYPOINT ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/dist"]
