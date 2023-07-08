FROM node:18-alpine AS build

WORKDIR /srv

RUN npm install -g pnpm

COPY package*.json /srv/
RUN pnpm install
COPY tsconfig.json /srv/
COPY src /srv/src/
RUN pnpm build
RUN pnpm install --prod

FROM alpine:3
RUN apk add nodejs --no-cache
WORKDIR /srv
COPY --from=build /srv/node_modules /srv/node_modules
COPY --from=build /srv/dist /srv/
CMD node index.js

# FROM node:18-alpine

# WORKDIR /app

# COPY . .

# RUN npm install -g pnpm
# RUN pnpm install 
# RUN pnpm build

# EXPOSE 8080

# ENTRYPOINT [ "pnpm", "run", "start" ]