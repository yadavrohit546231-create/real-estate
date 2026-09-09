# Real Estate Marketplace - REST API Documentation

Base URL: `http://localhost:5000/api`
Interactive Swagger Docs: `http://localhost:5000/api/docs`

---

## 1. Authentication Endpoints

### Register
`POST /api/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91 9876543210",
  "password": "Password123!",
  "role": "BUYER"
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "admin@realestate.com",
  "password": "Password123!"
}
```

### Refresh Token
`POST /api/auth/refresh`
```json
{
  "refreshToken": "<refresh_token>"
}
```

### Get Current User Profile
`GET /api/auth/me`
Header: `Authorization: Bearer <token>`

---

## 2. Properties Endpoints

### Search / List Properties (Public)
`GET /api/properties?city=Patna&category=RESIDENTIAL&listingType=SALE&minPrice=1000000&maxPrice=10000000&page=1&limit=20`

### Get Property by ID (Public with masked owner contact)
`GET /api/properties/:id`

### Post Property (Protected - Owner/Agent)
`POST /api/properties`
Header: `Authorization: Bearer <token>`
```json
{
  "title": "3 BHK Sea Facing Luxury Apartment",
  "description": "Exquisite sea views with modular kitchen and clubhouse access.",
  "listingType": "SALE",
  "category": "RESIDENTIAL",
  "propertyType": "APARTMENT",
  "price": 12500000,
  "area": 1650,
  "bedrooms": 3,
  "bathrooms": 3,
  "locality": "Bandra West",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400050",
  "images": [{ "url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800" }],
  "isDraft": false
}
```

### Submit Draft for Review
`POST /api/properties/:id/submit`

---

## 3. Admin Moderation Endpoints

### Pending Properties Queue
`GET /api/admin/properties/pending?page=1&limit=20`
Header: `Authorization: Bearer <admin_token>`

### Approve Property
`POST /api/admin/properties/:id/approve`
Header: `Authorization: Bearer <admin_token>`

### Reject Property (Reason Mandatory)
`POST /api/admin/properties/:id/reject`
Header: `Authorization: Bearer <admin_token>`
```json
{
  "reason": "Address is incomplete and property photos are blurry. Please re-upload clearer photos."
}
```

### Dashboard Analytics
`GET /api/admin/dashboard`

### CSV Report Export
`GET /api/admin/reports/export?type=properties` (Options: `properties`, `leads`, `revenue`)

---

## 4. Leads & Site Visits

### Submit Enquiry (Lead)
`POST /api/leads/property/:propertyId`
```json
{
  "name": "Arjun Rao",
  "phone": "+91 9811122233",
  "email": "arjun@example.com",
  "message": "Is this apartment still available for sale?",
  "source": "ENQUIRY"
}
```

### Schedule Site Visit
`POST /api/site-visits/property/:propertyId`
```json
{
  "visitDate": "2026-09-15",
  "timeSlot": "10:00 AM - 12:00 PM",
  "notes": "Will be visiting with family."
}
```

### Accept / Reject Site Visit
`PATCH /api/site-visits/:id/accept`
`PATCH /api/site-visits/:id/reject`
```json
{
  "notes": "Owner confirmed availability."
}
```

---

## 5. Payments (Razorpay & Mock)

### Create Payment Order
`POST /api/payments/create-order`
```json
{
  "amount": 4999,
  "currency": "INR",
  "purpose": "FEATURED_PROPERTY",
  "referenceId": "<property_id>"
}
```

### Verify Payment (Server-side validation)
`POST /api/payments/verify`
```json
{
  "orderId": "order_mock_12345678",
  "paymentId": "pay_mock_87654321"
}
```
