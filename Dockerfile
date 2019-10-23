# builder container
FROM node:10 as builder

WORKDIR /home/node/app
COPY shared/ shared/
COPY src/ src/
COPY package.json tsconfig.json angular.json ./
RUN npm install
RUN npm run build -- --prod

# release container
FROM node:10

EXPOSE 8080

WORKDIR /home/node/app
COPY --from=builder /home/node/app/dist/ dist/
COPY shared/ shared/
COPY server/ server/
COPY app.js package.json ./
RUN npm install --production

ENV PORT 8080
ENV MONGODB 'mongodb://mongodb/evocracy'
CMD [ "node", "app.js" ]
