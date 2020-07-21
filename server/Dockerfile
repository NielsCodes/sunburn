FROM node:12-slim
WORKDIR /usr/src/app
COPY package.json package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "./dist/app.js"]
