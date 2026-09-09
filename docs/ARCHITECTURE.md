# System Architecture & Technical Specification

## 1. High-Level Architecture Overview

The Real Estate Marketplace is designed as an enterprise-grade monorepo containing:
- **Backend Core**: Node.js + Express + TypeScript + Prisma ORM + MySQL.
- **Admin Application**: React 18 + Vite + TypeScript + Tailwind CSS + Recharts + Lucide Icons.
- **Mobile Application**: React Native + Expo SDK 52 + Expo Router + TypeScript + Zustand + React Query.
- **Shared Libraries**: `@real-estate/types`, `@real-estate/validation`, `@real-estate/shared`.

```
                  +-----------------------------------+
                  |        Client Interfaces          |
                  |                                   |
                  |   [Mobile App]    [Admin Portal]  |
                  |  (Expo / React)   (Vite / React)  |
                  +---------+---------------+---------+
                            |               |
                       REST | Bearer JWT    | REST Bearer JWT
                            v               v
                  +-----------------------------------+
                  |           Express API             |
                  |   - Helmet, CORS, RateLimiting    |
                  |   - JWT Auth & RBAC Middleware    |
                  |   - Zod Validation Layers         |
                  +-----------------+-----------------+
                                    |
                           Prisma   | ORM
                                    v
                  +-----------------------------------+
                  |          MySQL Database           |
                  |  - Properties, Users, Leads       |
                  |  - Projects, Towers, Units        |
                  |  - Payments, Approvals, Audits    |
                  +-----------------------------------+
```

---

## 2. Property Lifecycle State Machine

```
              Owner Submits
[DRAFT] ------------------------> [PENDING_REVIEW]
                                       |
                   +-------------------+-------------------+
                   |                                       |
            Admin Approves                          Admin Rejects
                   |                              (Reason Required)
                   v                                       v
                [LIVE] <---------------------------- [REJECTED]
             (Publicly visible)     Owner edits & resubmits
                   |
            +------+------+
            |             |
         [SOLD]       [RENTED]
```

### Business Rules Enforced in Code:
1. **Rule 1**: Only approved properties can have status `LIVE`.
2. **Rule 2**: Rejections require a mandatory reason (`PropertyApproval.reason` and `Property.rejectionReason`).
3. **Rule 3**: Only `ADMIN` or `SUPER_ADMIN` can approve or reject property listings.
4. **Rule 4**: Owner can edit rejected property and resubmit, resetting status to `PENDING_REVIEW`.
5. **Rule 5**: Unauthenticated users can browse and filter properties freely.
6. **Rule 6**: Actions like creating leads, saving favorites, scheduling visits, or posting properties require authentication.
7. **Rule 7**: Agent and Builder profiles require administrative verification.
8. **Rule 8**: Server-side verification is mandatory for payments; client receipts are never trusted alone.
9. **Rule 9**: Passwords hashes and refresh tokens are strictly filtered out of API payloads.
10. **Rule 10**: All administrative approvals, rejections, and state modifications are logged into `AdminAction` audit tables.

---

## 3. Database Schema Entity Relationships

- **User (1)** <---> **(N) Property**: An owner or agent can own multiple properties.
- **Property (1)** <---> **(N) PropertyImage**: Multiple uploaded photos per property with sort ordering.
- **Property (1)** <---> **(N) PropertyAmenity** <---> **(N) Amenity**: Many-to-many relationship connecting features like Lift, Swimming Pool, Gym, etc.
- **Property (1)** <---> **(N) PropertyApproval**: Audit records of all admin review decisions with admin ID and rejection reasons.
- **Property (1)** <---> **(N) Lead**: Buyer enquiries containing message, phone, source, and lead status.
- **Property (1)** <---> **(N) SiteVisit**: Scheduled physical appointments.
- **BuilderProject (1)** <---> **(N) Tower (1)** <---> **(N) Floor (1)** <---> **(N) Unit**: Multi-tiered architectural structure for large developments.
