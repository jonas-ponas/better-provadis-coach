FROM node:18-alpine AS build

COPY . .

RUN npm install -g pnpm
RUN pnpm install 
RUN pnpm run build

FROM node:18-alpine

WORKDIR /app


COPY --from=build ./dist .

EXPOSE 8080

ENTRYPOINT [ "node", "index.js" ]