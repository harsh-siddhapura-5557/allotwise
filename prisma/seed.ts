import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const partnerPassword = await bcrypt.hash("partner123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@allotwise.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@allotwise.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const partner = await prisma.user.upsert({
    where: { email: "partner@allotwise.com" },
    update: {},
    create: {
      name: "Partner User",
      email: "partner@allotwise.com",
      password: partnerPassword,
      role: "PARTNER",
    },
  });

  // Create members
  const members = await Promise.all([
    prisma.member.upsert({
      where: { panNumber: "ABCDE1234F" },
      update: {},
      create: {
        fullName: "Rajesh Patel",
        panNumber: "ABCDE1234F",
        mobile: "9876543210",
        notes: "Primary applicant",
      },
    }),
    prisma.member.upsert({
      where: { panNumber: "FGHIJ5678K" },
      update: {},
      create: {
        fullName: "Priya Shah",
        panNumber: "FGHIJ5678K",
        mobile: "9876543211",
        notes: "Family member",
      },
    }),
    prisma.member.upsert({
      where: { panNumber: "LMNOP9012Q" },
      update: {},
      create: {
        fullName: "Amit Desai",
        panNumber: "LMNOP9012Q",
        mobile: "9876543212",
        notes: "Friend",
      },
    }),
    prisma.member.upsert({
      where: { panNumber: "RSTUV3456W" },
      update: {},
      create: {
        fullName: "Neha Joshi",
        panNumber: "RSTUV3456W",
        mobile: "9876543213",
        notes: "",
      },
    }),
  ]);

  // Create UPI IDs
  const upis = await Promise.all([
    prisma.upiId.upsert({
      where: { upiId: "rajesh@upi" },
      update: {},
      create: { memberId: members[0].id, upiId: "rajesh@upi" },
    }),
    prisma.upiId.upsert({
      where: { upiId: "rajesh2@upi" },
      update: {},
      create: { memberId: members[0].id, upiId: "rajesh2@upi" },
    }),
    prisma.upiId.upsert({
      where: { upiId: "priya@upi" },
      update: {},
      create: { memberId: members[1].id, upiId: "priya@upi" },
    }),
    prisma.upiId.upsert({
      where: { upiId: "amit@upi" },
      update: {},
      create: { memberId: members[2].id, upiId: "amit@upi" },
    }),
    prisma.upiId.upsert({
      where: { upiId: "neha@upi" },
      update: {},
      create: { memberId: members[3].id, upiId: "neha@upi" },
    }),
  ]);

  // Create IPOs
  const ipos = await Promise.all([
    prisma.iPO.upsert({
      where: { id: "ipo-tata-tech" },
      update: {},
      create: {
        id: "ipo-tata-tech",
        name: "Tata Technologies",
        ipoType: "MAINBOARD",
        issuePrice: 500,
        lotSize: 30,
        openDate: new Date("2024-11-22"),
        closeDate: new Date("2024-11-24"),
        status: "LISTED",
      },
    }),
    prisma.iPO.upsert({
      where: { id: "ipo-jyoti-cnc" },
      update: {},
      create: {
        id: "ipo-jyoti-cnc",
        name: "Jyoti CNC Automation",
        ipoType: "MAINBOARD",
        issuePrice: 331,
        lotSize: 45,
        openDate: new Date("2024-01-09"),
        closeDate: new Date("2024-01-11"),
        status: "LISTED",
      },
    }),
    prisma.iPO.upsert({
      where: { id: "ipo-vibhor-steel" },
      update: {},
      create: {
        id: "ipo-vibhor-steel",
        name: "Vibhor Steel Tubes",
        ipoType: "SME",
        issuePrice: 151,
        lotSize: 800,
        openDate: new Date("2024-02-01"),
        closeDate: new Date("2024-02-05"),
        status: "LISTED",
      },
    }),
    prisma.iPO.upsert({
      where: { id: "ipo-nova-agri" },
      update: {},
      create: {
        id: "ipo-nova-agri",
        name: "Nova AgriTech",
        ipoType: "SME",
        issuePrice: 39,
        lotSize: 3000,
        openDate: new Date("2024-03-15"),
        closeDate: new Date("2024-03-19"),
        status: "LISTED",
      },
    }),
    prisma.iPO.upsert({
      where: { id: "ipo-upcoming-abc" },
      update: {},
      create: {
        id: "ipo-upcoming-abc",
        name: "ABC Fintech",
        ipoType: "MAINBOARD",
        issuePrice: 250,
        lotSize: 60,
        openDate: new Date("2024-12-20"),
        closeDate: new Date("2024-12-22"),
        status: "UPCOMING",
      },
    }),
  ]);

  // Create applications
  const apps = await Promise.all([
    prisma.application.upsert({
      where: { id: "app-1" },
      update: {},
      create: {
        id: "app-1",
        ipoId: ipos[0].id,
        memberId: members[0].id,
        upiIdId: upis[0].id,
        appliedAmount: 15000,
        lotQuantity: 1,
        status: "ALLOTTED",
        applicationDate: new Date("2024-11-22"),
      },
    }),
    prisma.application.upsert({
      where: { id: "app-2" },
      update: {},
      create: {
        id: "app-2",
        ipoId: ipos[0].id,
        memberId: members[1].id,
        upiIdId: upis[2].id,
        appliedAmount: 15000,
        lotQuantity: 1,
        status: "NOT_ALLOTTED",
        applicationDate: new Date("2024-11-22"),
      },
    }),
    prisma.application.upsert({
      where: { id: "app-3" },
      update: {},
      create: {
        id: "app-3",
        ipoId: ipos[1].id,
        memberId: members[0].id,
        upiIdId: upis[0].id,
        appliedAmount: 14895,
        lotQuantity: 1,
        status: "SOLD",
        applicationDate: new Date("2024-01-09"),
      },
    }),
    prisma.application.upsert({
      where: { id: "app-4" },
      update: {},
      create: {
        id: "app-4",
        ipoId: ipos[1].id,
        memberId: members[2].id,
        upiIdId: upis[3].id,
        appliedAmount: 14895,
        lotQuantity: 1,
        status: "SOLD",
        applicationDate: new Date("2024-01-09"),
      },
    }),
    prisma.application.upsert({
      where: { id: "app-5" },
      update: {},
      create: {
        id: "app-5",
        ipoId: ipos[2].id,
        memberId: members[0].id,
        upiIdId: upis[1].id,
        appliedAmount: 120800,
        lotQuantity: 1,
        status: "ALLOTTED",
        applicationDate: new Date("2024-02-01"),
      },
    }),
    prisma.application.upsert({
      where: { id: "app-6" },
      update: {},
      create: {
        id: "app-6",
        ipoId: ipos[3].id,
        memberId: members[3].id,
        upiIdId: upis[4].id,
        appliedAmount: 117000,
        lotQuantity: 1,
        status: "REFUNDED",
        applicationDate: new Date("2024-03-15"),
      },
    }),
  ]);

  // Create allotments
  await Promise.all([
    prisma.allotment.upsert({
      where: { applicationId: "app-1" },
      update: {},
      create: {
        applicationId: "app-1",
        sharesAllotted: 30,
        issuePrice: 500,
        listingPrice: 1200,
        sellPrice: 1150,
        profit: (1150 - 500) * 30,
        loss: 0,
      },
    }),
    prisma.allotment.upsert({
      where: { applicationId: "app-3" },
      update: {},
      create: {
        applicationId: "app-3",
        sharesAllotted: 45,
        issuePrice: 331,
        listingPrice: 710,
        sellPrice: 695,
        profit: (695 - 331) * 45,
        loss: 0,
      },
    }),
    prisma.allotment.upsert({
      where: { applicationId: "app-4" },
      update: {},
      create: {
        applicationId: "app-4",
        sharesAllotted: 45,
        issuePrice: 331,
        listingPrice: 710,
        sellPrice: 680,
        profit: (680 - 331) * 45,
        loss: 0,
      },
    }),
    prisma.allotment.upsert({
      where: { applicationId: "app-5" },
      update: {},
      create: {
        applicationId: "app-5",
        sharesAllotted: 800,
        issuePrice: 151,
        listingPrice: 180,
        sellPrice: null,
        profit: null,
        loss: null,
      },
    }),
  ]);

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        applicationId: "app-1",
        action: "APPLICATION_ADDED",
        details: "Added application for Tata Technologies - Rajesh Patel",
        createdAt: new Date("2024-11-22T09:00:00"),
      },
      {
        userId: admin.id,
        applicationId: "app-1",
        action: "STATUS_UPDATED",
        details:
          "Updated status to ALLOTTED for Tata Technologies - Rajesh Patel",
        createdAt: new Date("2024-11-28T10:30:00"),
      },
      {
        userId: partner.id,
        applicationId: "app-3",
        action: "APPLICATION_ADDED",
        details: "Added application for Jyoti CNC - Rajesh Patel",
        createdAt: new Date("2024-01-09T11:00:00"),
      },
      {
        userId: admin.id,
        applicationId: "app-3",
        action: "STATUS_UPDATED",
        details: "Updated status to SOLD for Jyoti CNC - Rajesh Patel",
        createdAt: new Date("2024-01-18T14:00:00"),
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("📧 Admin: admin@allotwise.com / admin123");
  console.log("📧 Partner: partner@allotwise.com / partner123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
