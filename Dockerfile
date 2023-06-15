# builder container
FROM node:lts as builder

WORKDIR /home/node/app
COPY shared/ shared/
COPY src/ src/
COPY package.json tsconfig.json angular.json ./
RUN npm install
RUN npm run build -- --prod

# release container
FROM node:lts

EXPOSE 8080

RUN apt dist-upgrade -y && apt update && apt install -y pandoc texlive-latex-base texlive-fonts-recommended && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app
COPY --from=builder /home/node/app/dist/ dist/
COPY shared/ shared/
COPY server/ server/
COPY files/ files/
COPY templates/ templates/
COPY app.js package.json ./
RUN npm install --production

ENV PORT 8080
ENV MONGODB 'mongodb://mongodb/evocracy'
CMD [ "node", "app.js" ]
