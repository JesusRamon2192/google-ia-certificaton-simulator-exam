FROM node:18-alpine

WORKDIR /app

# Copy all project files into the image
COPY . /app/

# Install dependencies defined in package.json
RUN npm install

# Expose port 80
EXPOSE 80

# Start the node server
CMD ["npm", "start"]
