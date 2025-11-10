# Stage 1: Builder
# Use a Node.js 18 Alpine image as the base for building the app
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies (including devDependencies for building)
RUN npm install

# Copy the rest of the source code
COPY . .

# Copy the demo database seeder configuration
COPY src/config/seed.ts src/config/seed.ts

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Pruner
# Prune devDependencies
FROM builder AS pruner
WORKDIR /app
RUN npm prune --production

# Stage 3: Production
# Use a lean Node.js 18 Alpine image for the final production environment
FROM node:18-alpine

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy built application from 'builder' stage
COPY --from=builder /app/dist ./dist

# Copy production dependencies from 'pruner' stage
COPY --from=pruner /app/node_modules ./node_modules

# Copy package.json (needed for 'npm start')
COPY package.json .

# Create a data directory for the SQLite database
# This directory will be mounted as a volume in docker-compose
RUN mkdir -p data

# Expose the port the app runs on
EXPOSE 5001

# Define the command to run the application
# This runs 'node dist/server.js' as defined in package.json
CMD [ "npm", "start" ]