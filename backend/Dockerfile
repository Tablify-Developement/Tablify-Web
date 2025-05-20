FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]