import {
  PrismaClient,
  UserRole,
  UserStatus,
  ListingType,
  PropertyCategory,
  PropertyStatus,
  FurnishingStatus,
  AreaUnit,
  VerificationStatus,
  LeadSource,
  LeadStatus,
  SiteVisitStatus,
  NotificationType,
  PaymentPurpose,
  PaymentStatus,
  ProjectStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const user = encodeURIComponent(process.env.DATABASE_USER || process.env.DATABSE_USER || process.env.DB_USER || 'root');
  const password = encodeURIComponent(process.env.DATABASE_PASSWORD || process.env.DATABSE_PASSWORD || process.env.DB_PASSWORD || '');
  const host = process.env.DATABASE_HOST || process.env.DATABSE_HOST || process.env.DB_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || process.env.DATABSE_PORT || process.env.DB_PORT || '3306';
  const name = process.env.DATABASE_NAME || process.env.DATABSE_NAME || process.env.DB_NAME || 'real-estate';
  return `mysql://${user}:${password}@${host}:${port}/${name}`;
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Hash password for all seed test accounts: "Password123!"
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.siteVisit.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.propertyApproval.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.propertyVideo.deleteMany();
  await prisma.property.deleteMany();
  await prisma.projectAmenity.deleteMany();
  await prisma.projectMedia.deleteMany();
  await prisma.floorPlan.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.tower.deleteMany();
  await prisma.builderProject.deleteMany();
  await prisma.builderProfile.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.location.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 2. Seed Locations
  const locationsData = [
    { city: 'Patna', state: 'Bihar', locality: 'Bailey Road', pincode: '800001', latitude: 25.612, longitude: 85.101 },
    { city: 'Patna', state: 'Bihar', locality: 'Kankarbagh', pincode: '800020', latitude: 25.594, longitude: 85.148 },
    { city: 'Delhi', state: 'Delhi', locality: 'Connaught Place', pincode: '110001', latitude: 28.631, longitude: 77.216 },
    { city: 'Delhi', state: 'Delhi', locality: 'Dwarka', pincode: '110075', latitude: 28.582, longitude: 77.050 },
    { city: 'Mumbai', state: 'Maharashtra', locality: 'Bandra West', pincode: '400050', latitude: 19.059, longitude: 72.829 },
    { city: 'Mumbai', state: 'Maharashtra', locality: 'Andheri East', pincode: '400069', latitude: 19.113, longitude: 72.869 },
    { city: 'Bangalore', state: 'Karnataka', locality: 'Whitefield', pincode: '560066', latitude: 12.969, longitude: 77.750 },
    { city: 'Bangalore', state: 'Karnataka', locality: 'Koramangala', pincode: '560034', latitude: 12.935, longitude: 77.624 },
    { city: 'Hyderabad', state: 'Telangana', locality: 'Gachibowli', pincode: '500032', latitude: 17.440, longitude: 78.348 },
    { city: 'Pune', state: 'Maharashtra', locality: 'Kothrud', pincode: '411038', latitude: 18.507, longitude: 73.807 },
    { city: 'Kolkata', state: 'West Bengal', locality: 'Salt Lake', pincode: '700091', latitude: 22.580, longitude: 88.420 },
    { city: 'Chennai', state: 'Tamil Nadu', locality: 'OMR', pincode: '600097', latitude: 12.971, longitude: 80.243 },
    { city: 'Noida', state: 'Uttar Pradesh', locality: 'Sector 62', pincode: '201309', latitude: 28.628, longitude: 77.364 },
    { city: 'Gurgaon', state: 'Haryana', locality: 'Cyber City', pincode: '122002', latitude: 28.495, longitude: 77.089 },
  ];

  for (const loc of locationsData) {
    await prisma.location.create({ data: loc });
  }
  console.log(`📍 Seeded ${locationsData.length} locations.`);

  // 3. Seed Amenities
  const amenitiesList = [
    { name: 'Lift', icon: 'elevator', category: 'General' },
    { name: 'Power Backup', icon: 'battery-charging', category: 'General' },
    { name: 'Swimming Pool', icon: 'waves', category: 'Recreation' },
    { name: 'Gym', icon: 'dumbbell', category: 'Fitness' },
    { name: '24x7 Security', icon: 'shield-check', category: 'Safety' },
    { name: 'Reserved Parking', icon: 'car', category: 'Convenience' },
    { name: 'Balcony', icon: 'sun', category: 'Architecture' },
    { name: 'Club House', icon: 'home', category: 'Community' },
    { name: 'Garden', icon: 'tree', category: 'Outdoor' },
    { name: 'Pet Friendly', icon: 'paw', category: 'Policy' },
    { name: 'Wi-Fi / Internet', icon: 'wifi', category: 'Connectivity' },
    { name: 'Intercom', icon: 'phone', category: 'Safety' },
  ];

  const createdAmenities = await Promise.all(
    amenitiesList.map((a) => prisma.amenity.create({ data: a }))
  );
  console.log(`✨ Seeded ${createdAmenities.length} amenities.`);

  // 4. Seed Users: Super Admin, Admin, Buyers, Owners, Agents, Builders
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@realestate.com',
      phone: '+91 9999900001',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'admin@realestate.com',
      phone: '+91 9999900002',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 5 Buyers
  const buyers = [];
  for (let i = 1; i <= 5; i++) {
    const buyer = await prisma.user.create({
      data: {
        name: `Buyer Person ${i}`,
        email: `buyer${i}@gmail.com`,
        phone: `+91 981110000${i}`,
        passwordHash,
        role: UserRole.BUYER,
        status: UserStatus.ACTIVE,
      },
    });
    buyers.push(buyer);
  }

  // 3 Owners
  const owners = [];
  const ownerNames = ['Rajesh Sharma', 'Priya Verma', 'Amitabh Kumar'];
  for (let i = 0; i < 3; i++) {
    const owner = await prisma.user.create({
      data: {
        name: ownerNames[i],
        email: `owner${i + 1}@gmail.com`,
        phone: `+91 982220000${i + 1}`,
        passwordHash,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      },
    });
    owners.push(owner);
  }

  // 2 Agents
  const agents = [];
  const agentData = [
    { name: 'Vikram Malhotra', agency: 'Apex Realty Solutions', license: 'RERA-DL-AGT-2023-0881' },
    { name: 'Neha Singhania', agency: 'Metro Estates Global', license: 'RERA-KA-AGT-2022-1402' },
  ];
  for (let i = 0; i < 2; i++) {
    const agent = await prisma.user.create({
      data: {
        name: agentData[i].name,
        email: `agent${i + 1}@realty.com`,
        phone: `+91 983330000${i + 1}`,
        passwordHash,
        role: UserRole.AGENT,
        status: UserStatus.ACTIVE,
        agentProfile: {
          create: {
            agencyName: agentData[i].agency,
            agencyAddress: `${100 + i * 20}, Commercial Tower, Business District`,
            licenseNumber: agentData[i].license,
            experienceYears: 7 + i * 3,
            bio: 'Expert consultant with deep local market insights and premium property portfolios.',
            status: VerificationStatus.VERIFIED,
          },
        },
      },
      include: { agentProfile: true },
    });
    agents.push(agent);
  }

  // 2 Builders
  const builders = [];
  const builderData = [
    { name: 'Prestige Skyline Developers', rera: 'RERA-PRJ-BLR-2021-9921', company: 'Prestige Developers Pvt Ltd' },
    { name: 'Godrej Heights Infrastructure', rera: 'RERA-PRJ-DL-2020-4412', company: 'Godrej Properties Ltd' },
  ];
  for (let i = 0; i < 2; i++) {
    const builder = await prisma.user.create({
      data: {
        name: builderData[i].name,
        email: `builder${i + 1}@developers.com`,
        phone: `+91 984440000${i + 1}`,
        passwordHash,
        role: UserRole.BUILDER,
        status: UserStatus.ACTIVE,
        builderProfile: {
          create: {
            companyName: builderData[i].company,
            companyAddress: 'Corporate Park, Outer Ring Road, Tech Corridor',
            reraNumber: builderData[i].rera,
            website: 'https://www.developers-sample.com',
            description: 'Leading real estate developer crafting sustainable luxury living for 25+ years.',
            status: VerificationStatus.VERIFIED,
          },
        },
      },
      include: { builderProfile: true },
    });
    builders.push(builder);
  }

  console.log('👥 Seeded Users: 1 SuperAdmin, 1 Admin, 5 Buyers, 3 Owners, 2 Agents, 2 Builders.');

  // 5. Seed Properties (Live, Pending Review, Featured, Rejected)
  const sampleProperties = [
    {
      ownerId: owners[0].id,
      title: 'Luxury 3 BHK High-Rise Apartment with Panoramic Skyline View',
      description: 'Stunning 3 BHK apartment situated on the 14th floor with unobstructed views. Features imported Italian marble flooring, modular kitchen with chimney and hob, spacious balconies, and 2 designated covered parking spots. Gated community with 24x7 security and clubhouse.',
      listingType: ListingType.SALE,
      category: PropertyCategory.RESIDENTIAL,
      propertyType: 'APARTMENT',
      price: 13500000,
      area: 1850,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 3,
      bathrooms: 3,
      balconies: 2,
      floorNumber: 14,
      totalFloors: 24,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      address: 'Tower B, Skyline Orchids, Bailey Road',
      locality: 'Bailey Road',
      city: 'Patna',
      state: 'Bihar',
      country: 'India',
      pincode: '800001',
      latitude: 25.612,
      longitude: 85.101,
      status: PropertyStatus.LIVE,
      isVerified: true,
      isFeatured: true,
      featuredFrom: new Date(),
      featuredUntil: new Date(Date.now() + 30 * 86400000),
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      ],
    },
    {
      ownerId: owners[1].id,
      title: 'Modern 2 BHK Furnished Flat Near Metro Station',
      description: 'Well-ventilated 2 BHK flat for rent, 5 minutes walking distance from Connaught Place metro. High-speed broadband ready, fully furnished with split air conditioners, geyser, refrigerator, and double beds. Ideal for corporate professionals and families.',
      listingType: ListingType.RENT,
      category: PropertyCategory.RESIDENTIAL,
      propertyType: 'FLAT',
      price: 42000,
      rentAmount: 42000,
      securityDeposit: 84000,
      area: 1100,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 2,
      bathrooms: 2,
      balconies: 1,
      floorNumber: 4,
      totalFloors: 8,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      address: 'Flat 402, Metro Regency, Barakhamba Road',
      locality: 'Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001',
      latitude: 28.631,
      longitude: 77.216,
      status: PropertyStatus.LIVE,
      isVerified: true,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      ],
    },
    {
      ownerId: owners[2].id,
      title: 'Sea-Facing 4 BHK Luxury Villa with Private Swimming Pool',
      description: 'Ultra-exclusive 4 BHK beachfront villa in prime Bandra West. Private heated swimming pool, landscaped lawn, automated home theater, smart climate control, and separate servant quarters. Truly one of the finest addresses in Mumbai.',
      listingType: ListingType.SALE,
      category: PropertyCategory.RESIDENTIAL,
      propertyType: 'VILLA',
      price: 85000000,
      area: 4600,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 4,
      bathrooms: 5,
      balconies: 4,
      floorNumber: 1,
      totalFloors: 3,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      address: 'Villa 7, Sea Crest Enclave, Carter Road',
      locality: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400050',
      latitude: 19.059,
      longitude: 72.829,
      status: PropertyStatus.LIVE,
      isVerified: true,
      isFeatured: true,
      featuredFrom: new Date(),
      featuredUntil: new Date(Date.now() + 60 * 86400000),
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      ],
    },
    {
      ownerId: owners[0].id,
      agentId: agents[0].id,
      title: 'Grade A Commercial Office Space in Cyber City',
      description: 'Fully furnished Grade A corporate office space ready for plug and play. Contains 85 workstations, 4 executive cabins, 2 conference rooms, server room, and cafeteria. 100% DG power backup and central HVAC.',
      listingType: ListingType.RENT,
      category: PropertyCategory.COMMERCIAL,
      propertyType: 'OFFICE',
      price: 250000,
      rentAmount: 250000,
      securityDeposit: 1500000,
      area: 4200,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 0,
      bathrooms: 4,
      balconies: 0,
      floorNumber: 6,
      totalFloors: 15,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      address: 'Floor 6, DLF Cyber One, Sector 25A',
      locality: 'Cyber City',
      city: 'Gurgaon',
      state: 'Haryana',
      country: 'India',
      pincode: '122002',
      latitude: 28.495,
      longitude: 77.089,
      status: PropertyStatus.LIVE,
      isVerified: true,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80',
      ],
    },
    {
      ownerId: owners[1].id,
      title: 'Premium Single PG for Working Professionals near Tech Park',
      description: 'Cozy, clean single room PG in Whitefield. Includes 3 meals daily, daily housekeeping, 100 Mbps Wi-Fi, laundry facility, and RO drinking water. 5 mins from ITPL tech park.',
      listingType: ListingType.RENT,
      category: PropertyCategory.PG,
      propertyType: 'PG_SINGLE',
      price: 15500,
      rentAmount: 15500,
      securityDeposit: 20000,
      area: 220,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 1,
      bathrooms: 1,
      balconies: 1,
      floorNumber: 2,
      totalFloors: 4,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      address: 'House 14, Prestige Tech Enclave, Whitefield',
      locality: 'Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560066',
      latitude: 12.969,
      longitude: 77.750,
      status: PropertyStatus.LIVE,
      isVerified: true,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80',
      ],
    },
    // PENDING REVIEW Property (for Admin review demo)
    {
      ownerId: owners[0].id,
      title: 'Newly Listed 3 BHK Builder Floor with Terrace Garden',
      description: 'Brand new builder floor with private terrace garden in Kankarbagh. Spacious rooms with branded fittings, modular kitchen, and private parking. Submitted by owner for admin verification.',
      listingType: ListingType.SALE,
      category: PropertyCategory.RESIDENTIAL,
      propertyType: 'BUILDER_FLOOR',
      price: 7800000,
      area: 1450,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 3,
      bathrooms: 2,
      balconies: 2,
      floorNumber: 3,
      totalFloors: 3,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      address: 'Plot 44, Doctors Colony, Kankarbagh',
      locality: 'Kankarbagh',
      city: 'Patna',
      state: 'Bihar',
      country: 'India',
      pincode: '800020',
      latitude: 25.594,
      longitude: 85.148,
      status: PropertyStatus.PENDING_REVIEW,
      isVerified: false,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
      ],
    },
    // REJECTED Property (for Reject & Owner resubmit demo)
    {
      ownerId: owners[2].id,
      title: 'Spacious Residential Plot for Sale (Review Rejected Example)',
      description: 'Clear title residential plot located near airport road. Ready for immediate construction. Rejection demo record.',
      listingType: ListingType.SALE,
      category: PropertyCategory.RESIDENTIAL,
      propertyType: 'PLOT',
      price: 3200000,
      area: 1800,
      areaUnit: AreaUnit.SQ_FT,
      bedrooms: 0,
      bathrooms: 0,
      balconies: 0,
      furnishing: FurnishingStatus.UNFURNISHED,
      address: 'Survey 102, Airport Bypass Road',
      locality: 'Bailey Road',
      city: 'Patna',
      state: 'Bihar',
      country: 'India',
      pincode: '800014',
      status: PropertyStatus.REJECTED,
      rejectionReason: 'Incomplete address and missing clear boundary photos. Please upload updated site layout.',
      isVerified: false,
      isFeatured: false,
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
      ],
    },
  ];

  const createdProperties = [];
  for (const prop of sampleProperties) {
    const { images, ...propData } = prop;
    const createdProp = await prisma.property.create({
      data: {
        ...propData,
        images: {
          create: images.map((url, idx) => ({
            url,
            sortOrder: idx,
          })),
        },
        amenities: {
          create: createdAmenities.slice(0, 5).map((amenity: { id: string }) => ({
            amenity: { connect: { id: amenity.id } },
          })),
        },
      },
    });
    createdProperties.push(createdProp);
  }
  console.log(`🏡 Seeded ${createdProperties.length} sample properties.`);

  // 6. Seed Builder Projects, Towers, Floors, Units
  const project = await prisma.builderProject.create({
    data: {
      builderId: builders[0].id,
      name: 'Prestige Boulevard Heights',
      description: 'Mega integrated residential township spread across 18 acres with 80% open green space.',
      location: 'Whitefield Main Road, Opposite ITPL',
      city: 'Bangalore',
      state: 'Karnataka',
      developer: 'Prestige Developers Pvt Ltd',
      reraNumber: 'PRM/KA/RERA/1251/446/PR/210408/004122',
      totalTowers: 3,
      totalUnits: 120,
      possessionDate: new Date('2026-12-31'),
      priceFrom: 9500000,
      priceTo: 24000000,
      latitude: 12.969,
      longitude: 77.750,
      status: ProjectStatus.LIVE,
      towers: {
        create: [
          {
            name: 'Tower A - Coral',
            floors: {
              create: [
                {
                  floorNumber: 1,
                  units: {
                    create: [
                      { unitNumber: 'A-101', bedrooms: 2, bathrooms: 2, area: 1250, price: 9500000 },
                      { unitNumber: 'A-102', bedrooms: 3, bathrooms: 3, area: 1750, price: 14500000 },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
      floorPlans: {
        create: [
          {
            title: '2 BHK Premium Floor Plan',
            bedrooms: 2,
            bathrooms: 2,
            area: 1250,
            imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
          },
        ],
      },
    },
  });
  console.log(`🏗️ Seeded Builder Project: ${project.name}`);

  // 7. Seed Leads & Enquiries
  await prisma.lead.create({
    data: {
      propertyId: createdProperties[0].id,
      buyerId: buyers[0].id,
      ownerId: owners[0].id,
      name: buyers[0].name,
      phone: buyers[0].phone,
      email: buyers[0].email,
      message: 'Hello, I am looking to purchase this 3 BHK apartment. Can we negotiate the price?',
      source: LeadSource.ENQUIRY,
      status: LeadStatus.NEW,
    },
  });

  await prisma.lead.create({
    data: {
      propertyId: createdProperties[1].id,
      buyerId: buyers[1].id,
      ownerId: owners[1].id,
      name: buyers[1].name,
      phone: buyers[1].phone,
      email: buyers[1].email,
      message: 'Hi, is this flat available for immediate move-in from next Monday?',
      source: LeadSource.WHATSAPP,
      status: LeadStatus.CONTACTED,
    },
  });
  console.log('📬 Seeded sample leads.');

  // 8. Seed Site Visit
  await prisma.siteVisit.create({
    data: {
      propertyId: createdProperties[0].id,
      userId: buyers[2].id,
      ownerId: owners[0].id,
      visitDate: new Date(Date.now() + 2 * 86400000),
      timeSlot: '11:00 AM - 01:00 PM',
      status: SiteVisitStatus.REQUESTED,
      notes: 'Please arrange key with guard if owner is unavailable.',
    },
  });
  console.log('🗓️ Seeded sample site visit request.');

  // 9. Seed Favorites & Saved Searches
  await prisma.favorite.create({
    data: {
      userId: buyers[0].id,
      propertyId: createdProperties[0].id,
    },
  });

  await prisma.savedSearch.create({
    data: {
      userId: buyers[0].id,
      name: '2 & 3 BHK under ₹1.5 Cr in Patna',
      city: 'Patna',
      criteria: JSON.stringify({
        city: 'Patna',
        category: 'RESIDENTIAL',
        maxPrice: 15000000,
        bedrooms: [2, 3],
      }),
      notifyEmail: true,
    },
  });
  console.log('⭐ Seeded favorites & saved searches.');

  // 10. Seed Notifications
  await prisma.notification.create({
    data: {
      userId: owners[0].id,
      title: 'New Lead Received!',
      message: `${buyers[0].name} sent an enquiry for your property "Luxury 3 BHK High-Rise Apartment".`,
      type: NotificationType.NEW_LEAD,
      entityType: 'Property',
      entityId: createdProperties[0].id,
      isRead: false,
    },
  });
  console.log('🔔 Seeded notifications.');

  // 11. Seed Payments
  await prisma.payment.create({
    data: {
      userId: owners[0].id,
      amount: 4999,
      currency: 'INR',
      purpose: PaymentPurpose.FEATURED_PROPERTY,
      referenceId: createdProperties[0].id,
      gatewayOrderId: 'order_mock_12345678',
      gatewayPaymentId: 'pay_mock_87654321',
      status: PaymentStatus.SUCCESS,
    },
  });
  console.log('💳 Seeded payments.');

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
