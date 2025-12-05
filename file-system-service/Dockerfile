FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
VOLUME ["/data/files"]
CMD ["node", "server.js"]
