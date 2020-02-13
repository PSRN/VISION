FROM node:latest
WORKDIR /app
COPY ./package*.json ./
RUN npm install
RUN npm audit fix
COPY  . .
EXPOSE 3000
CMD ["npm","start"]