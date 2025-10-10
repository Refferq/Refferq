# API Overview

Complete reference for the Refferq REST API.

---

## 📚 Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Introduction

The Refferq API is a RESTful API that allows you to programmatically interact with your affiliate program. All API endpoints return JSON responses.

### Base URL

```
http://localhost:3000/api  # Development
https://yourdomain.com/api  # Production
```

### API Version

Current version: **v1.0.0**

---

## Authentication

Refferq uses **JWT (JSON Web Tokens)** for authentication.

### Getting a Token

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "AFFILIATE"
  }
}
```

### Using the Token

Include the JWT token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Token Expiration

Tokens expire after **7 days**. You'll need to re-authenticate after expiration.

---

## API Endpoints

### Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | 7 | Authentication and user management |
| **Admin** | 18 | Admin operations |
| **Affiliate** | 6 | Affiliate operations |
| **Webhook** | 1 | External integrations |
| **Testing** | 1 | Email testing |

### Endpoint List

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/send-otp` - Send OTP code
- `POST /api/auth/verify-otp` - Verify OTP code

#### Admin - Affiliates
- `GET /api/admin/affiliates` - List all affiliates
- `POST /api/admin/affiliates` - Create affiliate
- `PATCH /api/admin/affiliates/[id]` - Update affiliate
- `DELETE /api/admin/affiliates/[id]` - Delete affiliate
- `POST /api/admin/affiliates/batch` - Batch operations

#### Admin - Referrals
- `GET /api/admin/referrals` - List all referrals
- `POST /api/admin/referrals` - Create referral
- `PUT /api/admin/referrals/[id]` - Approve/reject referral
- `PATCH /api/admin/referrals/[id]` - Update referral details
- `DELETE /api/admin/referrals/[id]` - Delete referral

#### Admin - Analytics
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/analytics` - Detailed analytics
- `GET /api/admin/reports` - Generate reports

#### Admin - Payouts
- `GET /api/admin/payouts` - List payouts
- `POST /api/admin/payouts` - Process payouts

#### Admin - Settings
- `GET /api/admin/settings` - Get program settings
- `PUT /api/admin/settings` - Update program settings
- `GET /api/admin/settings/profile` - Get admin profile
- `PUT /api/admin/settings/profile` - Update admin profile
- `PUT /api/admin/settings/integration` - Update integrations

#### Admin - Email
- `POST /api/admin/emails/test` - Test email configuration

#### Affiliate
- `GET /api/affiliate/referrals` - List own referrals
- `POST /api/affiliate/referrals` - Submit referral
- `GET /api/affiliate/payouts` - View payout history
- `GET /api/affiliate/profile` - Get profile
- `PUT /api/affiliate/profile` - Update profile

#### Webhook
- `POST /api/webhook/conversion` - Track conversion

---

## Request Format

### Headers

All requests should include:

```http
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body

Use JSON for request bodies:

```json
{
  "key": "value",
  "nested": {
    "key": "value"
  }
}
```

### Query Parameters

For GET requests with filters:

```
GET /api/admin/affiliates?status=ACTIVE&page=1&limit=10
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "DETAILED_ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal error |

---

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_CREDENTIALS` | Wrong email/password | Check credentials |
| `TOKEN_EXPIRED` | JWT expired | Re-authenticate |
| `UNAUTHORIZED` | Not logged in | Include auth token |
| `FORBIDDEN` | Wrong role | Check permissions |
| `NOT_FOUND` | Resource missing | Check ID/URL |
| `VALIDATION_ERROR` | Invalid input | Check request body |
| `DUPLICATE_EMAIL` | Email exists | Use different email |

### Error Response Example

```json
{
  "success": false,
  "message": "Email already registered",
  "error": "DUPLICATE_EMAIL"
}
```

---

## Rate Limiting

### Current Limits

**Version 1.0.0:** No rate limiting

**Planned (v1.1.0):** 
- 100 requests/minute per IP
- 1000 requests/hour per user

### Best Practices

- Cache responses when possible
- Use webhooks instead of polling
- Implement exponential backoff for retries

---

## Examples

### Register New Affiliate

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AFFILIATE"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AFFILIATE",
    "status": "PENDING"
  }
}
```

### Submit Referral

```bash
curl -X POST http://localhost:3000/api/affiliate/referrals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "leadName": "Jane Smith",
    "leadEmail": "jane@example.com",
    "company": "Acme Inc",
    "estimatedValue": 100000,
    "notes": "Interested in enterprise plan"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Referral submitted successfully",
  "referral": {
    "id": "456",
    "leadName": "Jane Smith",
    "leadEmail": "jane@example.com",
    "status": "PENDING",
    "createdAt": "2025-10-10T12:00:00Z"
  }
}
```

### Approve Referral (Admin)

```bash
curl -X PUT http://localhost:3000/api/admin/referrals/456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "action": "approve",
    "commissionAmount": 20000,
    "notes": "Signed up for annual plan"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Referral approved",
  "referral": {
    "id": "456",
    "status": "APPROVED",
    "commissionAmount": 20000
  },
  "commission": {
    "id": "789",
    "amount": 20000,
    "status": "UNPAID"
  }
}
```

### Get Dashboard Analytics (Admin)

```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAffiliates": 25,
    "activeAffiliates": 18,
    "pendingAffiliates": 7,
    "totalReferrals": 150,
    "approvedReferrals": 120,
    "totalCommissions": 500000,
    "unpaidCommissions": 125000,
    "conversionRate": 0.80
  }
}
```

---

## Pagination

List endpoints support pagination:

```bash
GET /api/admin/affiliates?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## Filtering

Use query parameters to filter results:

```bash
GET /api/admin/affiliates?status=ACTIVE&group=premium
```

**Available Filters:**

**Affiliates:**
- `status` - PENDING, ACTIVE, INACTIVE, SUSPENDED
- `group` - Group name
- `search` - Name or email

**Referrals:**
- `status` - PENDING, APPROVED, REJECTED
- `affiliateId` - Filter by affiliate
- `dateFrom` - Start date (ISO 8601)
- `dateTo` - End date (ISO 8601)

---

## Sorting

Use `sortBy` and `order` parameters:

```bash
GET /api/admin/referrals?sortBy=createdAt&order=desc
```

**Sort Fields:**
- `createdAt` - Creation date
- `name` - Name
- `amount` - Commission amount
- `status` - Status

**Order:**
- `asc` - Ascending
- `desc` - Descending

---

## Detailed API Documentation

For complete endpoint documentation with all parameters and examples, see:

- **[Admin API](Admin-API)** - Admin endpoint reference
- **[Affiliate API](Affiliate-API)** - Affiliate endpoint reference
- **[Auth API](Auth-API)** - Authentication endpoint reference
- **[Webhook API](Webhook-API)** - Webhook integration guide

---

## SDK & Libraries

### Official SDKs

Coming soon:
- JavaScript/TypeScript SDK
- Python SDK
- PHP SDK

### Community SDKs

Have you built an SDK? [Let us know!](https://github.com/refferq/refferq/discussions)

---

## Testing

### Postman Collection

Download our Postman collection: **Coming soon**

### Testing Endpoints

Use the test email endpoint to verify configuration:

```bash
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "test@example.com"
  }'
```

---

## Webhooks (Coming v1.1.0)

Subscribe to events:
- `affiliate.created`
- `affiliate.approved`
- `referral.submitted`
- `referral.approved`
- `commission.created`
- `payout.completed`

See [Webhook API](Webhook-API) for details.

---

## API Changelog

### v1.0.0 (October 2025)
- Initial API release
- 31 endpoints
- JWT authentication
- JSON responses

---

## Support

Need help with the API?

- **[GitHub Issues](https://github.com/refferq/refferq/issues)** - Report bugs
- **[GitHub Discussions](https://github.com/refferq/refferq/discussions)** - Ask questions
- **Email:** hello@refferq.com

---

<p align="center">
  <strong>Ready to integrate?</strong><br>
  Check out our <a href="Admin-API">detailed API reference</a>
</p>
