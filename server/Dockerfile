FROM node:20-alpine

WORKDIR /app

# Install nodemon globally for hot-reloading inside the container
RUN npm install -g nodemon

COPY package*.json ./

RUN npm install

COPY . .

# Expose the API port
EXPOSE 5000

# Start in development mode
CMD ["npm", "run", "dev"]
