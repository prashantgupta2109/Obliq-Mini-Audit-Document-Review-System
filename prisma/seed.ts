import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.firm.deleteMany();

  // Create Firm A
  const firmA = await prisma.firm.create({
    data: { name: "ABC & Co." },
  });

  // Create Firm B
  const firmB = await prisma.firm.create({
    data: { name: "XYZ & Co." },
  });

  const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);

  // Firm A users
  const rohit = await prisma.user.create({
    data: {
      name: "Rohit Sharma",
      email: "rohit@abc.co",
      passwordHash: hashPw("password123"),
      role: "STAFF",
      firmId: firmA.id,
    },
  });

  const aman = await prisma.user.create({
    data: {
      name: "Aman Verma",
      email: "aman@abc.co",
      passwordHash: hashPw("password123"),
      role: "REVIEWER",
      firmId: firmA.id,
    },
  });

  // Firm B users
  await prisma.user.create({
    data: {
      name: "Priya Mehta",
      email: "priya@xyz.co",
      passwordHash: hashPw("password123"),
      role: "STAFF",
      firmId: firmB.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Kiran Patel",
      email: "kiran@xyz.co",
      passwordHash: hashPw("password123"),
      role: "REVIEWER",
      firmId: firmB.id,
    },
  });

  // Clients for Firm A
  const clientABC = await prisma.client.create({
    data: { name: "ABC Traders Pvt. Ltd.", firmId: firmA.id },
  });

  const clientDEF = await prisma.client.create({
    data: { name: "DEF Industries Ltd.", firmId: firmA.id },
  });

  // Clients for Firm B
  await prisma.client.create({
    data: { name: "PQR Solutions Pvt. Ltd.", firmId: firmB.id },
  });

  // Documents for ABC Traders (with full audit history)
  const bankStatement = await prisma.document.create({
    data: {
      name: "Bank Statement",
      fileName: "Bank_Statement_Q1_v2.pdf",
      status: "APPROVED",
      clientId: clientABC.id,
      uploadedById: rohit.id,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'Added document "Bank Statement"',
        comment: null,
        documentId: bankStatement.id,
        userId: aman.id,
        createdAt: new Date("2024-01-15T04:50:00Z"),
      },
      {
        action: "Uploaded Bank_Statement_Q1.pdf",
        comment: null,
        documentId: bankStatement.id,
        userId: rohit.id,
        createdAt: new Date("2024-01-15T05:00:00Z"),
      },
      {
        action: "Started reviewing",
        comment: null,
        documentId: bankStatement.id,
        userId: aman.id,
        createdAt: new Date("2024-01-15T05:11:00Z"),
      },
      {
        action: "Requested correction",
        comment: "Page 3 was missing. Please upload the complete bank statement.",
        documentId: bankStatement.id,
        userId: aman.id,
        createdAt: new Date("2024-01-15T05:14:00Z"),
      },
      {
        action: "Uploaded revised document: Bank_Statement_Q1_v2.pdf",
        comment: null,
        documentId: bankStatement.id,
        userId: rohit.id,
        createdAt: new Date("2024-01-15T06:35:00Z"),
      },
      {
        action: "Approved document",
        comment: null,
        documentId: bankStatement.id,
        userId: aman.id,
        createdAt: new Date("2024-01-15T06:42:00Z"),
      },
    ],
  });

  const salesRegister = await prisma.document.create({
    data: {
      name: "Sales Register",
      fileName: "Sales_Register.pdf",
      status: "UNDER_REVIEW",
      clientId: clientABC.id,
      uploadedById: rohit.id,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'Added document "Sales Register"',
        comment: null,
        documentId: salesRegister.id,
        userId: aman.id,
        createdAt: new Date("2024-01-16T06:00:00Z"),
      },
      {
        action: "Uploaded Sales_Register.pdf",
        comment: null,
        documentId: salesRegister.id,
        userId: rohit.id,
        createdAt: new Date("2024-01-16T07:00:00Z"),
      },
      {
        action: "Started reviewing",
        comment: null,
        documentId: salesRegister.id,
        userId: aman.id,
        createdAt: new Date("2024-01-16T08:00:00Z"),
      },
    ],
  });

  const gstReturn = await prisma.document.create({
    data: {
      name: "GST Return",
      status: "PENDING",
      clientId: clientABC.id,
      uploadedById: rohit.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'Added document "GST Return"',
      comment: null,
      documentId: gstReturn.id,
      userId: aman.id,
      createdAt: new Date("2024-01-16T06:05:00Z"),
    },
  });

  const purchaseRegister = await prisma.document.create({
    data: {
      name: "Purchase Register",
      status: "CORRECTION_REQUIRED",
      fileName: "Purchase_Register.pdf",
      clientId: clientABC.id,
      uploadedById: rohit.id,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'Added document "Purchase Register"',
        comment: null,
        documentId: purchaseRegister.id,
        userId: aman.id,
        createdAt: new Date("2024-01-17T06:00:00Z"),
      },
      {
        action: "Uploaded Purchase_Register.pdf",
        comment: null,
        documentId: purchaseRegister.id,
        userId: rohit.id,
        createdAt: new Date("2024-01-17T07:00:00Z"),
      },
      {
        action: "Started reviewing",
        comment: null,
        documentId: purchaseRegister.id,
        userId: aman.id,
        createdAt: new Date("2024-01-17T08:00:00Z"),
      },
      {
        action: "Requested correction",
        comment: "The totals on page 5 don't match. Please recheck and re-upload.",
        documentId: purchaseRegister.id,
        userId: aman.id,
        createdAt: new Date("2024-01-17T08:15:00Z"),
      },
    ],
  });

  // DEF Industries - pending docs
  for (const docName of ["Expense Summary", "GST Return"]) {
    const doc = await prisma.document.create({
      data: {
        name: docName,
        status: "PENDING",
        clientId: clientDEF.id,
        uploadedById: rohit.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: `Added document "${docName}"`,
        documentId: doc.id,
        userId: aman.id,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\nDemo accounts:");
  console.log("  Firm A — ABC & Co.");
  console.log("    Staff:    rohit@abc.co  / password123");
  console.log("    Reviewer: aman@abc.co   / password123");
  console.log("  Firm B — XYZ & Co.");
  console.log("    Staff:    priya@xyz.co  / password123");
  console.log("    Reviewer: kiran@xyz.co  / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
