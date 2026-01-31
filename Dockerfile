FROM mcr.microsoft.com/playwright:v1.48.0-jammy
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Install TypeScript globally to avoid permission issues
RUN npm install -g typescript

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application files
COPY . .

# Fix permissions on node_modules (if needed)
RUN chmod -R +x node_modules/.bin || true

# BUILD STEP - Compile TypeScript to JavaScript
RUN tsc

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "build/index.js"]
