// ==========================================
// Core Domain Enums
// ==========================================

export enum UserRole {
  BUYER = 'BUYER',
  OWNER = 'OWNER',
  AGENT = 'AGENT',
  BUILDER = 'BUILDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ListingType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PropertyCategory {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  PG = 'PG',
}

export enum ResidentialPropertyType {
  APARTMENT = 'APARTMENT',
  FLAT = 'FLAT',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
  PLOT = 'PLOT',
  BUILDER_FLOOR = 'BUILDER_FLOOR',
  STUDIO = 'STUDIO',
}

export enum CommercialPropertyType {
  OFFICE = 'OFFICE',
  SHOP = 'SHOP',
  SHOWROOM = 'SHOWROOM',
  WAREHOUSE = 'WAREHOUSE',
  LAND = 'LAND',
  OTHER = 'OTHER',
}

export enum PgPropertyType {
  PG_SINGLE = 'PG_SINGLE',
  PG_SHARED = 'PG_SHARED',
  HOSTEL = 'HOSTEL',
  OTHER = 'OTHER',
}

export type PropertyType =
  | ResidentialPropertyType
  | CommercialPropertyType
  | PgPropertyType
  | string;

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}

export enum FurnishingStatus {
  UNFURNISHED = 'UNFURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  FULLY_FURNISHED = 'FULLY_FURNISHED',
}

export enum AreaUnit {
  SQ_FT = 'SQ_FT',
  SQ_YARD = 'SQ_YARD',
  SQ_METER = 'SQ_METER',
  ACRE = 'ACRE',
  HECTARE = 'HECTARE',
  BIGHA = 'BIGHA',
}

export enum LeadSource {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  ENQUIRY = 'ENQUIRY',
  WEBSITE = 'WEBSITE',
  MOBILE_APP = 'MOBILE_APP',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  FOLLOW_UP = 'FOLLOW_UP',
  SITE_VISIT = 'SITE_VISIT',
  NEGOTIATION = 'NEGOTIATION',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  CLOSED = 'CLOSED',
}

export enum SiteVisitStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  SOLD = 'SOLD',
  HOLD = 'HOLD',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  LIVE = 'LIVE',
  REJECTED = 'REJECTED',
}

export enum PaymentPurpose {
  FEATURED_PROPERTY = 'FEATURED_PROPERTY',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PREMIUM_LISTING = 'PREMIUM_LISTING',
  BUILDER_SUBSCRIPTION = 'BUILDER_SUBSCRIPTION',
  AGENT_SUBSCRIPTION = 'AGENT_SUBSCRIPTION',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  PROPERTY_REJECTED = 'PROPERTY_REJECTED',
  PROPERTY_UPDATED = 'PROPERTY_UPDATED',
  NEW_LEAD = 'NEW_LEAD',
  LEAD_STATUS_CHANGED = 'LEAD_STATUS_CHANGED',
  SITE_VISIT_REQUEST = 'SITE_VISIT_REQUEST',
  SITE_VISIT_ACCEPTED = 'SITE_VISIT_ACCEPTED',
  SITE_VISIT_REJECTED = 'SITE_VISIT_REJECTED',
  SITE_VISIT_REMINDER = 'SITE_VISIT_REMINDER',
  NEW_MATCHING_PROPERTY = 'NEW_MATCHING_PROPERTY',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  GENERAL = 'GENERAL',
}

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

// ==========================================
// User & Auth Interfaces
// ==========================================

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: string | Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserSummary;
  tokens: AuthTokens;
}

// ==========================================
// Property Models
// ==========================================

export interface PropertyImageDTO {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  sortOrder: number;
}

export interface AmenityDTO {
  id: string;
  name: string;
  icon?: string | null;
  category?: string | null;
}

export interface PropertySummary {
  id: string;
  title: string;
  description: string;
  listingType: ListingType;
  category: PropertyCategory;
  propertyType: string;
  price: number;
  rentAmount?: number | null;
  securityDeposit?: number | null;
  area: number;
  areaUnit: AreaUnit;
  bedrooms?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  floorNumber?: number | null;
  totalFloors?: number | null;
  furnishing?: FurnishingStatus | null;
  address?: string | null;
  locality: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  status: PropertyStatus;
  isVerified: boolean;
  isFeatured: boolean;
  featuredRequested?: boolean;
  featuredFrom?: string | Date | null;
  featuredUntil?: string | Date | null;
  rejectionReason?: string | null;
  primaryImage?: string | null;
  images?: PropertyImageDTO[];
  amenities?: AmenityDTO[];
  ownerId: string;
  ownerName?: string;
  agentId?: string | null;
  builderId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ==========================================
// Search & Filter Query Parameters
// ==========================================

export interface PropertyFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  locality?: string;
  listingType?: ListingType;
  category?: PropertyCategory;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  furnishing?: FurnishingStatus;
  amenities?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ==========================================
// Leads, Visits, Notifications
// ==========================================

export interface LeadDTO {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  buyerId: string;
  ownerId: string;
  agentId?: string | null;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string | Date;
}

export interface SiteVisitDTO {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  ownerId: string;
  agentId?: string | null;
  visitDate: string;
  timeSlot: string;
  status: SiteVisitStatus;
  notes?: string | null;
  createdAt: string | Date;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

// ==========================================
// Standard API Envelope
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}
