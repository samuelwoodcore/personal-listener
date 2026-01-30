# Webhook Listener

A fullstack webhook testing and monitoring application built with React, Golang, and PostgreSQL.

## Features

- Create webhook endpoints with custom response codes and bodies
- Edit webhook responses dynamically
- View historical webhook events
- Simple and clean user interface
- Docker-based deployment

## Tech Stack

- **Frontend**: React
- **Backend**: Golang (Gorilla Mux)
- **Database**: PostgreSQL
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Running the Application

1. Clone the repository and navigate to the project directory:
```bash
cd listener
```

2. Start all services with Docker Compose:
```bash
docker-compose up
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Development

#### Backend

**Local Development (without Docker):**

If running the backend locally, first download dependencies:
```bash
cd backend
go mod download
go run main.go
```

**Docker Development:**

The backend runs on port 8080 and provides the following API endpoints:

- `POST /api/webhooks` - Create a new webhook
- `GET /api/webhooks` - Get all webhooks
- `GET /api/webhooks/{id}` - Get a specific webhook
- `PUT /api/webhooks/{id}` - Update a webhook's response code/body
- `DELETE /api/webhooks/{id}` - Delete a webhook
- `GET /api/webhooks/{id}/events` - Get webhook events
- `GET/POST/PUT/DELETE/PATCH /webhook/{path}` - Webhook endpoint

#### Frontend

The frontend runs on port 3000 and provides a simple interface to:
- Create webhooks
- View all webhooks
- Edit webhook responses
- View webhook event history

## Usage

1. **Create a Webhook**: Click "Create Webhook" and set the default response code and body
2. **Get Webhook URL**: Each webhook gets a unique URL (e.g., `http://localhost:8080/webhook/{path}`)
3. **Send Requests**: Send HTTP requests to the webhook URL
4. **View Events**: Click on a webhook to see all historical events
5. **Edit Response**: Update the response code and body at any time

## Database Schema

- **webhooks**: Stores webhook configurations (id, path, response_code, response_body, created_at)
- **webhook_events**: Stores all incoming webhook requests (id, webhook_id, method, headers, body, timestamp)
