FROM mcr.microsoft.com/playwright:v1.48.0-jammy
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including TypeScript for build)
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application files
COPY . .

# BUILD STEP - Compile TypeScript to JavaScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "build/index.js"]
