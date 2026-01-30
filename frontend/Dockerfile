FROM node:18-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies with cache mount for faster builds
# Using npm ci for faster, reliable installs
RUN --mount=type=cache,target=/root/.npm \
    if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile --network-timeout 100000; \
    elif [ -f package-lock.json ]; then \
      npm ci --only=production=false --prefer-offline --no-audit; \
    else \
      npm install --prefer-offline --no-audit; \
    fi

# Copy source code
COPY . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV NODE_ENV=development

CMD ["npm", "start"]
