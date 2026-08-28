FROM node:20-alpine AS base 
WORKDIR /app
COPY package*.json ./

# dev
FROM base AS dev
RUN npm install
COPY . .
CMD ["node", "--watch", "index.js"]

# prod
FROM base AS prod
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]