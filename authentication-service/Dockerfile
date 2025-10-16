FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
ENV PORT=4000 \
	DEFAULT_ADMIN_USER=admin \
	DEFAULT_ADMIN_PASS=admin123
CMD ["node", "server.js"]
