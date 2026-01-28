FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "build/index.js"]