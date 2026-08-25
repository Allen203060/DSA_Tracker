FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose Vite's default port
EXPOSE 5173

# Vite requires the --host flag to expose the port outside the Docker container
CMD ["npm", "run", "dev", "--", "--host"]
