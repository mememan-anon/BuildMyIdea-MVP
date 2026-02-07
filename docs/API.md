# BuildMyIdea API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the MVP uses session-based authentication for admin users. Production should implement proper JWT or OAuth.

---

## Ideas API

### Get All Ideas
```http
GET /api/ideas
```

**Response:**
```json
{
  "ideas": [
    {
      "id": "idea_123",
      "user_id": "user_456",
      "title": "My Great Idea",
      "description": "Description here...",
      "category": "general",
      "status": "paid",
      "created_at": 1677649200,
      "updated_at": 1677649200,
      "user_email": "user@example.com"
    }
  ]
}
```

### Get Idea by ID
```http
GET /api/ideas/:id
```

### Get User's Ideas
```http
GET /api/ideas/user/:userId
```

### Submit Idea
```http
POST /api/ideas
Content-Type: application/json

{
  "userId": "user_456",
  "title": "My Idea",
  "description": "Description...",
  "category": "general"
}
```

### Update Idea Status
```http
PUT /api/ideas/:id/status
Content-Type: application/json

{
  "status": "winner"
}
```

**Status values:** `pending`, `paid`, `winner`, `queued`

### Select Idea as Winner
```http
POST /api/ideas/:id/winner
```

### Add Idea to Build Queue
```http
POST /api/ideas/:id/queue
Content-Type: application/json

{
  "priority": 5
}
```

**Priority values:** 1-10 (1 = highest)

### Remove from Queue
```http
DELETE /api/ideas/:id/queue
```

### Get Build Queue
```http
GET /api/ideas/queue/all
```

### Get Next Item in Queue
```http
GET /api/ideas/queue/next
```

### Get All Winners
```http
GET /api/ideas/winners
```

### Get Winner by ID
```http
GET /api/ideas/winner/:id
```

### Update Winner Build Status
```http
PUT /api/ideas/winner/:id/build
Content-Type: application/json

{
  "build_started_at": 1677649200,
  "build_completed_at": 1677735600,
  "demo_url": "https://demo.example.com",
  "repo_url": "https://github.com/example",
  "status": "completed"
}
```

**Status values:** `selected`, `building`, `completed`

---

## Stripe API

### Create Checkout Session
```http
POST /api/stripe/checkout
Content-Type: application/json

{
  "title": "My Idea",
  "description": "Description...",
  "category": "general",
  "email": "user@example.com",
  "userId": "user_456"
}
```

**Response:**
```json
{
  "sessionId": "cs_123456",
  "url": "https://checkout.stripe.com/c/pay/cs_123456"
}
```

### Get Session Details
```http
GET /api/stripe/session/:session_id
```

### Stripe Webhook
```http
POST /api/stripe/webhook
```

This endpoint handles Stripe webhook events:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## Admin API

### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@buildmyidea.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "admin@buildmyidea.com",
    "is_admin": true
  }
}
```

### Admin Logout
```http
POST /api/admin/logout
```

### Check Admin Status
```http
GET /api/admin/check
```

**Response:**
```json
{
  "isAdmin": true,
  "user": {
    "id": "user_123",
    "email": "admin@buildmyidea.com"
  }
}
```

### Get Dashboard Stats
```http
GET /api/admin/stats
```

**Response:**
```json
{
  "totalUsers": 10,
  "totalIdeas": 25,
  "totalWinners": 5,
  "queueCount": 3,
  "pendingIdeas": 10,
  "queuedIdeas": 3
}
```

---

## Users API

### Create User
```http
POST /api/users/create
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "isAdmin": false
}
```

### User Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### User Logout
```http
POST /api/users/logout
```

### Get Current User
```http
GET /api/users/me
```

**Response:**
```json
{
  "isAuthenticated": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Webhook Events

### checkout.session.completed
Triggered when a user completes the Stripe checkout. Creates an idea in the database.

**Metadata included:**
- `title` - Idea title
- `description` - Idea description
- `category` - Idea category
- `email` - User email
- `userId` - User ID (or "guest")

### payment_intent.succeeded
Triggered when a payment is successfully processed.

### payment_intent.payment_failed
Triggered when a payment fails.

---

## Rate Limiting
Not implemented in MVP. Production should implement rate limiting to prevent abuse.

---

## CORS
CORS is enabled for all origins in development. Configure properly for production.
