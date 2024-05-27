FROM node:21-alpine

WORKDIR /app
COPY package*.json ./


#The --only=prod flag allows you to only install the main dependencies and leave out the dev dependencies 
RUN npm install

COPY . .

CMD ["npm", "run", "start:prod"]