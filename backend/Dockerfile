FROM golang:1.21-alpine

WORKDIR /app

RUN apk add --no-cache git

# Enable Go modules
ENV GO111MODULE=on
ENV CGO_ENABLED=0

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies and verify
RUN go mod download && go mod verify

# Copy the rest of the application
COPY . .

# Build and run
CMD ["go", "run", "main.go"]
