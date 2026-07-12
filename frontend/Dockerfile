# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose Vite's default dev port (or preview port)
EXPOSE 5173

# Run Vite with the --host flag so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]