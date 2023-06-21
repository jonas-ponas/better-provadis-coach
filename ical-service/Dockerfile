FROM node:18-alpine

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile 
RUN pnpm run build

EXPOSE 8080

ENTRYPOINT [ "pnpm", "run", "start" ]