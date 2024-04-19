# Use an official Node.js image as base
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install -g pnpm
RUN npm install -g typescript@5.0.4 ts-node --save-dev
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD [ "npx", "ts-node", "src/index.ts" ]
