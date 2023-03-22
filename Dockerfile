FROM node:18-alpine

WORKDIR /app

COPY . .

RUN yarn install --immutable 
RUN yarn build

EXPOSE 8080

ENTRYPOINT [ "yarn", "start" ]