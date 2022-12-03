FROM node:18-alpine

WORKDIR /app

COPY . .

RUN ls -a

RUN npm install
RUN npm run build

RUN rm -rf ./src

EXPOSE 8080

ENTRYPOINT [ "npm", "run", "start" ]