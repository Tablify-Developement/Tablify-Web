FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm install

# Copy the rest of the application
COPY . .

# Build TypeScript (without ignoring errors)
RUN npm run build

# For production, you can remove dev dependencies after build
# RUN npm prune --production

# Expose the port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]