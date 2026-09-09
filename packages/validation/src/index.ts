import { z } from 'zod';
import {
  UserRole,
  ListingType,
  PropertyCategory,
  PropertyStatus,
  FurnishingStatus,
  AreaUnit,
  LeadSource,
  LeadStatus,
  SiteVisitStatus,
  PaymentPurpose,
  ApprovalDecision,
} from '@real-estate/types';

// ==========================================
// Authentication Schemas
// ==========================================

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid phone number format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([UserRole.BUYER, UserRole.OWNER, UserRole.AGENT, UserRole.BUILDER]).default(UserRole.BUYER),
  avatarUrl: z.string().url().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// ==========================================
// Property Schemas
// ==========================================

export const CreatePropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  listingType: z.nativeEnum(ListingType),
  category: z.nativeEnum(PropertyCategory),
  propertyType: z.string().min(2, 'Property type is required'),
  price: z.number().positive('Price must be greater than 0'),
  rentAmount: z.number().positive().optional().nullable(),
  securityDeposit: z.number().positive().optional().nullable(),
  area: z.number().positive('Area must be greater than 0'),
  areaUnit: z.nativeEnum(AreaUnit).default(AreaUnit.SQ_FT),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  balconies: z.number().int().min(0).optional().nullable(),
  floorNumber: z.number().int().optional().nullable(),
  totalFloors: z.number().int().optional().nullable(),
  furnishing: z.nativeEnum(FurnishingStatus).optional().nullable(),
  address: z.string().optional().nullable(),
  locality: z.string().min(2, 'Locality is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India'),
  pincode: z.string().min(4, 'Pincode is required'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  amenityIds: z.array(z.string()).optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        sortOrder: z.number().default(0),
      })
    )
    .optional(),
  isDraft: z.boolean().optional().default(false),
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

export const AdminPropertyReviewSchema = z.object({
  decision: z.nativeEnum(ApprovalDecision),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.decision === ApprovalDecision.REJECTED || data.decision === ApprovalDecision.CHANGES_REQUESTED) {
      return !!data.reason && data.reason.trim().length >= 5;
    }
    return true;
  },
  {
    message: 'A detailed reason (at least 5 characters) is required when rejecting or requesting changes',
    path: ['reason'],
  }
);

// ==========================================
// Lead & Site Visit Schemas
// ==========================================

export const CreateLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  message: z.string().max(500).optional(),
  source: z.nativeEnum(LeadSource).default(LeadSource.ENQUIRY),
});

export const UpdateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
});

export const ScheduleSiteVisitSchema = z.object({
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be YYYY-MM-DD'),
  timeSlot: z.string().min(2, 'Time slot is required (e.g. 10:00 AM - 12:00 PM)'),
  notes: z.string().max(500).optional(),
});

export const UpdateSiteVisitStatusSchema = z.object({
  status: z.nativeEnum(SiteVisitStatus),
  notes: z.string().optional(),
});

// ==========================================
// Saved Search & Filter Schemas
// ==========================================

export const PropertyFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  listingType: z.nativeEnum(ListingType).optional(),
  category: z.nativeEnum(PropertyCategory).optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  bedrooms: z.union([z.string(), z.array(z.coerce.number())]).optional(),
  furnishing: z.nativeEnum(FurnishingStatus).optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  isVerified: z.preprocess((val) => {
    if (val === undefined || val === '' || val === null) return undefined;
    return val === 'true' || val === true;
  }, z.boolean().optional()),
  isFeatured: z.preprocess((val) => {
    if (val === undefined || val === '' || val === null) return undefined;
    return val === 'true' || val === true;
  }, z.boolean().optional()),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc']).default('newest'),
});

export const CreateSavedSearchSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  city: z.string().optional(),
  criteria: z.record(z.any()),
  notifyEmail: z.boolean().default(true),
});

// ==========================================
// Payment Schemas
// ==========================================

export const CreatePaymentOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  purpose: z.nativeEnum(PaymentPurpose),
  referenceId: z.string().min(1, 'Reference ID (e.g., propertyId) is required'),
});

export const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().optional(),
});

// ==========================================
// Agent & Builder Registration
// ==========================================

export const AgentRegistrationSchema = z.object({
  agencyName: z.string().min(2, 'Agency name is required'),
  agencyAddress: z.string().min(5, 'Agency address is required'),
  licenseNumber: z.string().min(3, 'License or RERA number is required'),
  experienceYears: z.number().int().min(0).default(0),
  bio: z.string().optional(),
});

export const BuilderRegistrationSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companyAddress: z.string().min(5, 'Company address is required'),
  reraNumber: z.string().min(3, 'RERA registration number is required'),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().min(10, 'Description is required'),
  logoUrl: z.string().url().optional(),
});

export const CreateBuilderProjectSchema = z.object({
  name: z.string().min(3, 'Project name is required'),
  description: z.string().min(20, 'Description is required'),
  location: z.string().min(3, 'Location is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  reraNumber: z.string().min(3, 'RERA number is required'),
  totalTowers: z.number().int().positive().default(1),
  totalUnits: z.number().int().positive().default(1),
  possessionDate: z.string().optional(),
  priceFrom: z.number().positive(),
  priceTo: z.number().positive(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
