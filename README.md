# Production-Ready Real Estate Marketplace Platform

A full-stack, enterprise-grade real estate marketplace platform inspired by **99acres** and **Housing.com**, engineered with a modern TypeScript monorepo architecture.

Supports **BUY**, **RENT**, **SELL**, **COMMERCIAL**, and **PG** categories across multi-tier user roles: **Buyer/Tenant**, **Property Owner**, **Real Estate Agent**, **Builder/Developer**, **Platform Admin**, and **Super Admin**.

---

## 🏛️ Monorepo Architecture

```
real-estate-platform/
├── apps/
│   ├── api/          # Node.js + Express + TypeScript + Prisma + MySQL API
│   ├── admin/        # React + Vite + TypeScript + Tailwind CSS Admin Control Panel
│   └── mobile/       # React Native + Expo SDK 57 + Expo Router Mobile App
│
├── packages/
│   ├── types/        # Shared TypeScript interfaces, enums, & API envelopes
│   ├── validation/   # Zod validation schemas shared across client & backend
│   └── shared/       # Currency formatters (₹ Lakhs & Crores), utilities, phone maskers
│
├── prisma/
│   ├── schema.prisma # Normalized MySQL database schema with 25+ models & indexes
│   └── seed.ts       # Comprehensive database seeder (users, properties, leads, visits)
│
├── docs/             # Technical architecture and REST API endpoint reference
├── docker-compose.yml# Containerized MySQL 8 service definition
├── .env.example      # Environment variables template
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** `>= 18.0.0` (Tested on Node 20 / 24)
- **npm** `>= 9.0.0`
- **MySQL 8** (via Docker or local MySQL service)

### 2. Installation
Clone the repository and install dependencies at the root:
```bash
npm install
```

### 3. Database Configuration (MySQL)
You can start MySQL using Docker Compose:
```bash
docker compose up -d
```
Or use your existing local MySQL installation. Ensure your `.env` contains:
```env
# Component-based Database Configuration
DATABASE_USER="root"
DATABASE_PASSWORD="your_password"
DATABASE_HOST="localhost"
DATABASE_PORT="3306"
DATABASE_NAME="real-estate"
```

### 4. Prisma Migration & Seeder
Generate the Prisma client, run database migrations, and seed sample data:
```bash
# Generate Prisma Client
npm run db:generate

# Apply Migrations
npm run db:migrate

# Seed Database
npm run db:seed
```

### 5. Running the Application Services

#### Option A: Run API & Admin Simultaneously
```bash
npm run dev:all
```

#### Option B: Run Services Individually
- **Backend API**:
  ```bash
  npm run dev:api
  ```
  Accessible at: `http://localhost:5000/api`  
  Swagger API Documentation: `http://localhost:5000/api/docs`  
  Health Check: `http://localhost:5000/api/health`

- **Administrative Web Application**:
  ```bash
  npm run dev:admin
  ```
  Accessible at: `http://localhost:5173`

- **Mobile Application (Expo)**:
  ```bash
  npm run dev:mobile
  ```
  Launches the Expo development server for iOS, Android, and Web (`http://localhost:8081`).

---

## 🔑 Development Login Credentials

All test accounts share the development password: `Password123!`

| Role | Email | Password | Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@realestate.com` | `Password123!` | Full control, Admin user management, System audit logs |
| **Platform Admin**| `admin@realestate.com` | `Password123!` | Moderation queue, Approve/Reject listings, Verifications |
| **Owner 1** | `owner1@gmail.com` | `Password123!` | Post properties, Receive leads, Schedule visits |
| **Owner 2** | `owner2@gmail.com` | `Password123!` | Post properties, Edit rejected listings |
| **Agent 1** | `agent1@realty.com` | `Password123!` | Managed listings, Client site visits, RERA verified |
| **Builder 1** | `builder1@developers.com` | `Password123!` | Tower/Unit project management, Township showcase |
| **Buyer 1** | `buyer1@gmail.com` | `Password123!` | Enquiries, Schedule visits, Save favorites, Searches |

---

## 📱 Mobile Network Configuration (Android Emulator vs Physical Device)

As per requirement 66:
- **Android Emulator**: Cannot reach `localhost` directly. Set your environment variable:
  ```env
  EXPO_PUBLIC_API_URL="http://10.0.2.2:5000/api"
  ```
- **Physical Phone (Expo Go)**: Connect your phone to the same Wi-Fi network and set:
  ```env
  EXPO_PUBLIC_API_URL="http://<YOUR_LOCAL_IP>:5000/api"
  ```
- **iOS Simulator / Web**:
  ```env
  EXPO_PUBLIC_API_URL="http://localhost:5000/api"
  ```

---

## 🛡️ Key Business Rules & Workflows

1. **Moderation Queue**: A newly posted property enters `PENDING_REVIEW` status and is **never** publicly visible until approved by an Admin.
2. **Rejection Safeguards**: When an Admin rejects a listing, a detailed reason (`>= 5 chars`) is required, recorded in the database, and pushed to the owner.
3. **Transaction Safety**: All approval and verification state changes occur inside atomic Prisma database transactions (`prisma.$transaction`).
4. **Data Privacy**: Owner personal phone numbers are dynamically masked for unauthenticated viewers (`+91 987****210`).
5. **RBAC Protection**: Buyers cannot approve listings; normal admins cannot delete Super Admins.
6. **Server-Side Payment Verification**: Featured property upgrades and payments are cryptographically verified server-side with fallback mock testing support.

---

## 🧪 Automated Testing

Run the automated Vitest test suite covering Authentication, Authorization, RBAC enforcement, Property search, and Admin approval rules:
```bash
npm test
```
