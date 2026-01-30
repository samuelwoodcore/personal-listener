package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Webhook struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Path         string `json:"path"`
	ResponseCode int    `json:"responseCode"`
	ResponseBody string `json:"responseBody"`
	CreatedAt    string `json:"createdAt"`
}

type WebhookEvent struct {
	ID                string            `json:"id"`
	WebhookID         string            `json:"webhookId"`
	Method            string            `json:"method"`
	Headers           map[string]string `json:"headers"`
	Body              string            `json:"body"`
	ResponseReference string            `json:"responseReference"`
	Timestamp         string            `json:"timestamp"`
}

type CreateWebhookRequest struct {
	Name         string `json:"name"`
	ResponseCode int    `json:"responseCode"`
	ResponseBody string `json:"responseBody"`
}

type UpdateWebhookRequest struct {
	Name         string `json:"name"`
	ResponseCode int    `json:"responseCode"`
	ResponseBody string `json:"responseBody"`
}

var db *sql.DB

func initDB() {
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "webhook")
	dbPassword := getEnv("DB_PASSWORD", "webhook123")
	dbName := getEnv("DB_NAME", "webhookdb")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	// Create tables
	createTables()
}

func createTables() {
	webhooksTable := `
    CREATE TABLE IF NOT EXISTS webhooks (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) DEFAULT '',
      path VARCHAR(255) UNIQUE NOT NULL,
      response_code INTEGER NOT NULL DEFAULT 200,
      response_body TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

	// Add name column if it doesn't exist (for existing databases)
	alterTable := `ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '';`
	db.Exec(alterTable)

	// Add response_reference to webhook_events if it doesn't exist
	alterEventsTable := `ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS response_reference VARCHAR(255) UNIQUE;`
	db.Exec(alterEventsTable)

	eventsTable := `
    CREATE TABLE IF NOT EXISTS webhook_events (
      id VARCHAR(36) PRIMARY KEY,
      webhook_id VARCHAR(36) NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      method VARCHAR(10) NOT NULL,
      headers JSONB,
      body TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

	if _, err := db.Exec(webhooksTable); err != nil {
		log.Fatal("Failed to create webhooks table:", err)
	}

	if _, err := db.Exec(eventsTable); err != nil {
		log.Fatal("Failed to create webhook_events table:", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getFunkyMessage(statusCode int) string {
	messages := map[int]string{
		200: `{"status": "success", "message": "🎉 Everything is awesome! Your request was processed with flying colors!", "data": {"timestamp": "now", "vibe": "excellent"}}`,
		201: `{"status": "created", "message": "✨ Poof! It's alive! Your resource has been magically created!", "data": {"magic": true, "timestamp": "now"}}`,
		400: `{"status": "error", "message": "🤦 Oops! Something went sideways. Your request is a bit... wonky.", "error": "Bad Request", "suggestion": "Double-check your request, friend!"}`,
		401: `{"status": "error", "message": "🔒 Hold up! You need to prove you're you. Authentication required!", "error": "Unauthorized", "hint": "Check your credentials"}`,
		404: `{"status": "error", "message": "🔍 Lost in the void! We searched everywhere but couldn't find what you're looking for.", "error": "Not Found", "emoji": "🤷"}`,
		500: `{"status": "error", "message": "💥 Kaboom! Our servers had a moment. We're working on it!", "error": "Internal Server Error", "apology": "Sorry about that!"}`,
		502: `{"status": "error", "message": "🌉 Bridge out! The gateway is having a bad day.", "error": "Bad Gateway", "availability": "temporarily unavailable"}`,
		503: `{"status": "error", "message": "🚧 Under maintenance! We're sprucing things up. Check back soon!", "error": "Service Unavailable", "eta": "soon"}`,
	}

	if msg, ok := messages[statusCode]; ok {
		return msg
	}

	// Default funky message for unknown status codes
	return fmt.Sprintf(`{"status": "unknown", "message": "🤔 Status %d? That's a new one! Something interesting happened.", "code": %d}`, statusCode, statusCode)
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func createWebhook(w http.ResponseWriter, r *http.Request) {
	var req CreateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Default to 200 if not provided
	if req.ResponseCode == 0 {
		req.ResponseCode = 200
	}

	// Use funky message if response body is empty
	if req.ResponseBody == "" {
		req.ResponseBody = getFunkyMessage(req.ResponseCode)
	}

	id := uuid.New().String()
	path := uuid.New().String()

	query := `INSERT INTO webhooks (id, name, path, response_code, response_body) VALUES ($1, $2, $3, $4, $5) RETURNING created_at`
	var createdAt time.Time
	err := db.QueryRow(query, id, req.Name, path, req.ResponseCode, req.ResponseBody).Scan(&createdAt)
	if err != nil {
		http.Error(w, "Failed to create webhook", http.StatusInternalServerError)
		return
	}

	webhook := Webhook{
		ID:           id,
		Name:         req.Name,
		Path:         path,
		ResponseCode: req.ResponseCode,
		ResponseBody: req.ResponseBody,
		CreatedAt:    createdAt.Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(webhook)
}

func getWebhooks(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, path, response_code, response_body, created_at FROM webhooks ORDER BY created_at DESC")
	if err != nil {
		log.Printf("Error querying webhooks: %v", err)
		http.Error(w, "Failed to fetch webhooks", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var webhooks []Webhook
	for rows.Next() {
		var wb Webhook
		var name sql.NullString
		var createdAt time.Time
		err := rows.Scan(&wb.ID, &name, &wb.Path, &wb.ResponseCode, &wb.ResponseBody, &createdAt)
		if err != nil {
			log.Printf("Error scanning webhook row: %v", err)
			continue
		}
		if name.Valid {
			wb.Name = name.String
		} else {
			wb.Name = ""
		}
		wb.CreatedAt = createdAt.Format(time.RFC3339)
		webhooks = append(webhooks, wb)
	}

	// Check for errors from iterating over rows
	if err = rows.Err(); err != nil {
		log.Printf("Error iterating webhook rows: %v", err)
		http.Error(w, "Failed to fetch webhooks", http.StatusInternalServerError)
		return
	}

	// Ensure we always return an array, not null
	if webhooks == nil {
		webhooks = []Webhook{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(webhooks)
}

func getWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var wb Webhook
	var name sql.NullString
	var createdAt time.Time
	err := db.QueryRow(
		"SELECT id, name, path, response_code, response_body, created_at FROM webhooks WHERE id = $1",
		id,
	).Scan(&wb.ID, &name, &wb.Path, &wb.ResponseCode, &wb.ResponseBody, &createdAt)

	if err == sql.ErrNoRows {
		http.Error(w, "Webhook not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("Error fetching webhook: %v", err)
		http.Error(w, "Failed to fetch webhook", http.StatusInternalServerError)
		return
	}

	if name.Valid {
		wb.Name = name.String
	} else {
		wb.Name = ""
	}
	wb.CreatedAt = createdAt.Format(time.RFC3339)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wb)
}

func updateWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req UpdateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Default to 200 if not provided
	if req.ResponseCode == 0 {
		req.ResponseCode = 200
	}

	// Use funky message if response body is empty
	if req.ResponseBody == "" {
		req.ResponseBody = getFunkyMessage(req.ResponseCode)
	}

	_, err := db.Exec(
		"UPDATE webhooks SET name = $1, response_code = $2, response_body = $3 WHERE id = $4",
		req.Name, req.ResponseCode, req.ResponseBody, id,
	)

	if err != nil {
		http.Error(w, "Failed to update webhook", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Webhook updated successfully"})
}

func deleteWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	_, err := db.Exec("DELETE FROM webhooks WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Failed to delete webhook", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Webhook deleted successfully"})
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["path"]

	// Get webhook configuration
	var responseCode int
	var responseBody string
	var webhookID string
	err := db.QueryRow(
		"SELECT id, response_code, response_body FROM webhooks WHERE path = $1",
		path,
	).Scan(&webhookID, &responseCode, &responseBody)

	if err == sql.ErrNoRows {
		http.Error(w, "Webhook not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Failed to process webhook", http.StatusInternalServerError)
		return
	}

	// Read request body
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		bodyBytes = []byte{}
	}
	bodyStr := string(bodyBytes)

	// Read headers
	headers := make(map[string]string)
	for key, values := range r.Header {
		if len(values) > 0 {
			headers[key] = values[0]
		}
	}

	// Generate unique reference for this event
	eventRef := uuid.New().String()

	// Store event
	eventID := uuid.New().String()
	headersJSON, _ := json.Marshal(headers)
	_, err = db.Exec(
		"INSERT INTO webhook_events (id, webhook_id, method, headers, body, response_reference) VALUES ($1, $2, $3, $4, $5, $6)",
		eventID, webhookID, r.Method, string(headersJSON), bodyStr, eventRef,
	)

	if err != nil {
		log.Printf("Failed to store webhook event: %v", err)
	}

	// Use funky message if response body is empty
	finalResponseBody := responseBody
	if responseBody == "" {
		finalResponseBody = getFunkyMessage(responseCode)
	}

	// Add response_reference to the response if it's JSON
	var responseData map[string]interface{}
	if err := json.Unmarshal([]byte(finalResponseBody), &responseData); err == nil {
		responseData["response_reference"] = eventRef
		finalResponseBodyBytes, _ := json.Marshal(responseData)
		finalResponseBody = string(finalResponseBodyBytes)
	} else {
		// If not JSON, append as header
		w.Header().Set("X-Response-Reference", eventRef)
	}

	// Return configured response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(responseCode)
	w.Write([]byte(finalResponseBody))
}

func getWebhookEvents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	webhookID := vars["id"]

	// Get pagination parameters
	page := r.URL.Query().Get("page")
	limit := r.URL.Query().Get("limit")

	pageNum := 1
	limitNum := 20

	if page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			pageNum = p
		}
	}
	if limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 && l <= 100 {
			limitNum = l
		}
	}

	offset := (pageNum - 1) * limitNum

	// Get total count
	var totalCount int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM webhook_events WHERE webhook_id = $1",
		webhookID,
	).Scan(&totalCount)
	if err != nil {
		http.Error(w, "Failed to fetch events count", http.StatusInternalServerError)
		return
	}

	// Get paginated events
	rows, err := db.Query(
		"SELECT id, webhook_id, method, headers, body, response_reference, timestamp FROM webhook_events WHERE webhook_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3",
		webhookID, limitNum, offset,
	)
	if err != nil {
		http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []WebhookEvent
	for rows.Next() {
		var event WebhookEvent
		var headersJSON []byte
		var responseRef sql.NullString
		var timestamp time.Time
		err := rows.Scan(&event.ID, &event.WebhookID, &event.Method, &headersJSON, &event.Body, &responseRef, &timestamp)
		if err != nil {
			continue
		}

		json.Unmarshal(headersJSON, &event.Headers)
		if responseRef.Valid {
			event.ResponseReference = responseRef.String
		} else {
			event.ResponseReference = ""
		}
		event.Timestamp = timestamp.Format(time.RFC3339)
		events = append(events, event)
	}

	// Ensure we always return an array, not null
	if events == nil {
		events = []WebhookEvent{}
	}

	// Return paginated response
	response := map[string]interface{}{
		"events":     events,
		"page":       pageNum,
		"limit":      limitNum,
		"total":      totalCount,
		"totalPages": (totalCount + limitNum - 1) / limitNum,
		"hasMore":    offset+len(events) < totalCount,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Load .env file if it exists
	godotenv.Load()

	initDB()
	defer db.Close()

	r := mux.NewRouter()
	api := r.PathPrefix("/api").Subrouter()

	// Webhook management endpoints
	api.HandleFunc("/webhooks", createWebhook).Methods("POST")
	api.HandleFunc("/webhooks", getWebhooks).Methods("GET")
	api.HandleFunc("/webhooks/{id}", getWebhook).Methods("GET")
	api.HandleFunc("/webhooks/{id}", updateWebhook).Methods("PUT")
	api.HandleFunc("/webhooks/{id}", deleteWebhook).Methods("DELETE")
	api.HandleFunc("/webhooks/{id}/events", getWebhookEvents).Methods("GET")

	// Search endpoint
	api.HandleFunc("/events/search", searchEventsByReference).Methods("GET")

	// Webhook endpoint (catch-all)
	r.HandleFunc("/webhook/{path}", handleWebhook).Methods("GET", "POST", "PUT", "DELETE", "PATCH")

	http.Handle("/", enableCORS(r))

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func searchEventsByReference(w http.ResponseWriter, r *http.Request) {
	reference := r.URL.Query().Get("reference")
	if reference == "" {
		http.Error(w, "Reference parameter is required", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(
		"SELECT e.id, e.webhook_id, e.method, e.headers, e.body, e.response_reference, e.timestamp, w.name as webhook_name, w.path as webhook_path FROM webhook_events e JOIN webhooks w ON e.webhook_id = w.id WHERE e.response_reference = $1 ORDER BY e.timestamp DESC",
		reference,
	)
	if err != nil {
		log.Printf("Error searching events: %v", err)
		http.Error(w, "Failed to search events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var event WebhookEvent
		var headersJSON []byte
		var responseRef sql.NullString
		var timestamp time.Time
		var webhookName sql.NullString
		var webhookPath string
		err := rows.Scan(&event.ID, &event.WebhookID, &event.Method, &headersJSON, &event.Body, &responseRef, &timestamp, &webhookName, &webhookPath)
		if err != nil {
			continue
		}

		json.Unmarshal(headersJSON, &event.Headers)
		if responseRef.Valid {
			event.ResponseReference = responseRef.String
		} else {
			event.ResponseReference = ""
		}
		event.Timestamp = timestamp.Format(time.RFC3339)

		eventData := map[string]interface{}{
			"id":                event.ID,
			"webhookId":         event.WebhookID,
			"webhookName":       webhookName.String,
			"webhookPath":       webhookPath,
			"method":            event.Method,
			"headers":           event.Headers,
			"body":              event.Body,
			"responseReference": event.ResponseReference,
			"timestamp":         event.Timestamp,
		}
		events = append(events, eventData)
	}

	if events == nil {
		events = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}
