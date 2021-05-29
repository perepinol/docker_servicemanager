FROM node:latest as front

WORKDIR /app
COPY ./front/package*.json ./
RUN npm install
COPY ./front/src ./src
COPY ./front/webpack.config.js ./
RUN npm run build

FROM python:3.7

WORKDIR /
COPY --from=front /app/build ./build
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY api.py ./

CMD ["gunicorn", "api:api", "-b", "0.0.0.0:80"]
