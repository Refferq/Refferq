# Refferq API Documentation

**Author: Refferq Team**

Complete API reference for Refferq affiliate management platform.

## Table of Contents

- [Authentication](#authentication)
- [Admin APIs](#admin-apis)
- [Affiliate APIs](#affiliate-apis)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)

---

## Authentication

All API endpoints (except auth endpoints) require authentication via JWT token stored in cookies.

### Register

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AFFILIATE"
  }
}
```

### Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AFFILIATE",
    "hasAffiliate": true
  }
}
```

### Logout

```
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User

```
GET /api/auth/me
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AFFILIATE",
    "hasAffiliate": true
  }
}
```

---

## Admin APIs

### Dashboard Statistics

```
GET /api/admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRevenue": 50000,
    "totalPartners": 125,
    "activePartners": 98,
    "totalReferrals": 450,
    "pendingReferrals": 23,
    "approvedReferrals": 380,
    "totalCommissions": 12500,
    "paidCommissions": 8000,
    "conversionRate": 15.5
  }
}
```

### Manage Affiliates

#### Get All Affiliates

```
GET /api/admin/affiliates
```

**Response:**
```json
{
  "success": true,
  "affiliates": [
    {
      "id": "affiliate_id",
      "userId": "user_id",
      "referralCode": "JOHN123",
      "balanceCents": 25000,
      "createdAt": "2025-01-01T00:00:00Z",
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "status": "ACTIVE"
      }
    }
  ]
}
```

### Manage Referrals

#### Get All Referrals

```
GET /api/admin/referrals
```

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)

**Response:**
```json
{
  "success": true,
  "referrals": [
    {
      "id": "referral_id",
      "leadName": "Jane Smith",
      "leadEmail": "jane@example.com",
      "status": "PENDING",
      "metadata": {
        "estimatedValue": 5000
      },
      "createdAt": "2025-01-10T00:00:00Z",
      "affiliate": {
        "user": {
          "name": "John Doe"
        }
      }
    }
  ]
}
```

#### Update Referral Status

```
PUT /api/admin/referrals/[id]
PATCH /api/admin/referrals/[id]
```

**Request Body:**
```json
{
  "action": "approve",
  "reviewNotes": "Verified lead"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral approved successfully",
  "referral": {
    "id": "referral_id",
    "status": "APPROVED",
    "reviewedAt": "2025-01-10T10:00:00Z"
  }
}
```

### Program Settings

#### Get Settings

```
GET /api/admin/settings
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "productName": "BsBot",
    "programName": "BsBot's Affiliate Program",
    "websiteUrl": "https://kyns.com",
    "currency": "INR",
    "minimumPayoutThreshold": 1000,
    "payoutTerm": "NET-15"
  }
}
```

#### Update Settings

```
PUT /api/admin/settings
```

**Request Body:**
```json
{
  "productName": "NewProduct",
  "programName": "New Program Name",
  "minimumPayoutThreshold": 2000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### Payouts

#### Get All Payouts

```
GET /api/admin/payouts
```

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_id",
      "userId": "user_id",
      "amountCents": 5000,
      "method": "PAYPAL",
      "status": "COMPLETED",
      "processedAt": "2025-01-15T00:00:00Z"
    }
  ]
}
```

---

## Affiliate APIs

### Profile

#### Get Profile

```
GET /api/affiliate/profile
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "affiliate": {
    "id": "affiliate_id",
    "referralCode": "JOHN123",
    "balanceCents": 25000
  },
  "stats": {
    "totalEarnings": 25000,
    "pendingEarnings": 5000,
    "totalCommissions": 15,
    "totalConversions": 45,
    "conversionRate": 12.5
  },
  "referrals": [],
  "commissions": []
}
```

#### Update Profile

```
PUT /api/affiliate/profile
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "company": "Company Name",
  "country": "India",
  "paymentMethod": "PayPal",
  "paymentEmail": "john@paypal.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### Referrals

#### Get Referrals

```
GET /api/affiliate/referrals
```

**Response:**
```json
{
  "success": true,
  "referrals": [
    {
      "id": "referral_id",
      "leadName": "Jane Smith",
      "leadEmail": "jane@example.com",
      "status": "APPROVED",
      "estimatedValue": 5000,
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ]
}
```

#### Submit Referral

```
POST /api/affiliate/referrals
```

**Request Body:**
```json
{
  "lead_name": "Jane Smith",
  "lead_email": "jane@example.com",
  "estimated_value": "5000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral submitted successfully",
  "referral": {
    "id": "referral_id",
    "status": "PENDING"
  }
}
```

### Payouts

#### Get Payouts

```
GET /api/affiliate/payouts
```

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_id",
      "amount": 5000,
      "status": "COMPLETED",
      "method": "PAYPAL",
      "createdAt": "2025-01-01T00:00:00Z",
      "paidAt": "2025-01-15T00:00:00Z"
    }
  ]
}
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Error Messages

- `No authentication token` - User not logged in
- `Admin access required` - User is not admin
- `Affiliate role required` - User is not affiliate
- `Invalid credentials` - Wrong email/password
- `User not found` - User doesn't exist
- `Email already in use` - Email taken during registration

---

## Rate Limiting

Currently, there are no rate limits. In production, consider implementing rate limiting for security.

---

## Webhooks (Coming Soon)

Webhook support for external integrations is planned for future releases.

---

**Documentation by Refferq Team**
*Last Updated: October 2025*
