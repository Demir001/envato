# Stage 1: Build Stage
# Use Node.js 18 Alpine as the base image for building the React app
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
# This runs 'tsc && vite build' as defined in package.json
RUN npm run build

# Stage 2: Production Stage
# Use Nginx Alpine as a lightweight web server for the production build
FROM nginx:1.25-alpine

# Set working directory for Nginx
WORKDIR /usr/share/nginx/html

# Remove default Nginx public content
RUN rm -rf ./*

# Copy the built application from the 'builder' stage
# The 'build' folder is specified as 'outDir' in vite.config.ts
COPY --from=builder /app/build .

# Copy the custom Nginx configuration file
# This is crucial for routing all requests to index.html for a React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (default HTTP port for Nginx)
EXPOSE 80

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]