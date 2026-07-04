FROM node:20-alpine

WORKDIR /app

# Copy package.json only
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "server.js"]
