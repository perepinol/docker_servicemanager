FROM node:latest as front

WORKDIR /app
RUN npm i -g serve

COPY ./package*.json ./
RUN npm install
COPY ./src ./src
COPY ./webpack.config.js ./
RUN npm run build

CMD ["serve", "-l", "80", "build"]
