FROM mcr.microsoft.com/playwright:v1.48.0-jammy
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install ALL dependencies
RUN npm install
# Install Playwright browsers
RUN npx playwright install chromium
# Copy application files
COPY . .
# Fix permissions on node_modules (if needed)
RUN chmod -R +x node_modules/.bin || true
# Expose port
EXPOSE 3000
# Start the server
CMD ["node", "server.js"]
