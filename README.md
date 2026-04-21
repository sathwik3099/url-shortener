# Scalable URL Shortener Service

## Overview

This project is a production-grade URL shortener built using Node.js, PostgreSQL, and Redis. It converts long URLs into short, unique codes and provides fast redirection with low latency.

The system is designed using real-world backend principles including caching, asynchronous processing, rate limiting, and background job handling.

---

## Features

### Core Functionality

* Shorten long URLs into unique Base62-encoded short codes
* Redirect short URLs to original URLs with minimal latency
* Support custom aliases with validation and uniqueness checks
* Delete or deactivate existing URLs

### Expiry

* Time-based expiration of links
* Automatic cleanup of expired links using background jobs

### Analytics

* Track click events with timestamps
* Asynchronous processing using a queue and worker
* Batch insertion to reduce database load

### Performance Optimizations

* Redis cache using cache-aside pattern
* Hot URL detection and extended caching
* Indexed database queries for fast lookups

### Reliability and Safety

* Graceful fallback to database if Redis is unavailable
* Centralized error handling
* Structured logging using Pino
* Distributed rate limiting using Redis (sliding window)

### Background Processing

* Cron jobs for cleaning expired URLs
* Cleanup of old analytics data
* Worker for asynchronous analytics processing

---

## Architecture

```
Controller → Service → Repository → Database
                             ↓
                        Redis Cache
                             ↓
             Queue → Worker → Analytics Database
```

### Components

* Controller Layer: Handles HTTP requests and responses
* Service Layer: Contains business logic
* Repository Layer: Handles database operations
* Cache Layer (Redis): Stores frequently accessed URLs
* Queue + Worker: Processes analytics asynchronously
* Cron Jobs: Handles cleanup tasks

---

## Tech Stack

* Node.js (Express)
* PostgreSQL
* Redis
* node-cron
* Pino (logging)

---

## API Endpoints

### Create Short URL

POST /shorten

Request body:

```json
{
  "url": "https://example.com",
  "customAlias": "optional",
  "expiresAt": "optional timestamp"
}
```

### Redirect

GET /:shortCode

Redirects to the original URL.

### Get Analytics

GET /analytics/:shortCode

Returns analytics data for the given short code.

### Delete URL

DELETE /:shortCode

Deletes the URL mapping.

---

## Database Design

### URLs Table

* Stores short_code and original_url
* Includes expiry and timestamps
* Indexed for fast lookups

### Analytics Table

* Stores click events
* Indexed by short_code and timestamp
* Supports efficient aggregation queries

---

## Caching Strategy

The system uses a cache-aside pattern:

1. Check Redis for short code
2. If found, return immediately
3. If not found, query database
4. Store result in Redis

This reduces database load and improves response time.

---

## Rate Limiting

* Implemented using Redis
* Sliding window algorithm
* Limits requests per IP
* Distributed across multiple instances

---

## Scalability

* Stateless API enables horizontal scaling
* Redis reduces database load
* Asynchronous analytics prevents blocking
* Indexed queries optimize performance

---

## Fault Tolerance

* Redis failure falls back to database
* Error handling prevents crashes
* Background jobs run independently of request flow

---

## Running Locally

### 1. Install Dependencies

npm install

### 2. Configure Environment Variables

Create a `.env` file:

DATABASE_URL=postgresql://username@localhost:5432/url_shortener
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
RUN_CRON=true

### 3. Start PostgreSQL and Redis

brew services start postgresql
brew services start redis

### 4. Create Database and Run Schema

createdb url_shortener
psql url_shortener < src/db/schema.sql

### 5. Start Server

npm run dev

---

## Testing

### Create Short URL

curl -X POST http://localhost:3000/shorten 
-H "Content-Type: application/json" 
-d '{"url":"https://google.com"}'

### Open in Browser

http://localhost:3000/<shortCode>

Replace `<shortCode>` with the value returned from the API.

---

## Design Decisions

### Base62 Encoding

* Uses database ID converted to Base62
* Guarantees uniqueness
* Avoids collisions compared to random strings

### Cache-Aside Pattern

* Ensures fast reads
* Keeps cache consistent with database

### Asynchronous Analytics

* Prevents latency in redirect path
* Handles high volume efficiently

---

## Trade-offs

* In-memory queue is not durable (can be replaced with Kafka)
* Rate limiter is not fully atomic (can be improved with Lua scripts)
* Sequential IDs are predictable (can be obfuscated)

---

## Future Improvements

* Click-based expiry
* Kafka-based analytics pipeline
* Distributed ID generation (Snowflake)
* Authentication and user dashboards
* Advanced analytics (device, location)
* Pagination for analytics

---

## Summary

This project demonstrates a scalable backend system with clean architecture, performance optimizations, and real-world engineering trade-offs. It is designed to handle high traffic efficiently while maintaining low latency and reliability.
