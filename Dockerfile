FROM node:8

EXPOSE 8080

WORKDIR /home/node/app
COPY dist .
COPY server .
COPY app.js .
COPY package.json .
RUN npm install --production

ENV PORT 8080
CMD [ "node", "app.js" ]
