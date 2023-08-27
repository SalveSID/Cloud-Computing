FROM node:14

WORKDIR /usr

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 7000

CMD ["node", "app.js"]
