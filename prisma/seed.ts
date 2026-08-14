import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Surya Power ERP database...");

  // 1. Seed Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);
  const accountantPassword = await bcrypt.hash("accountant123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@suryapower.com" },
    update: {},
    create: {
      email: "admin@suryapower.com",
      name: "Admin User (Proprietor)",
      password: adminPassword,
      role: "ADMIN",
      phone: "9790987190",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@suryapower.com" },
    update: {},
    create: {
      email: "staff@suryapower.com",
      name: "Sales Staff",
      password: staffPassword,
      role: "STAFF",
      phone: "9840841887",
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: "accountant@suryapower.com" },
    update: {},
    create: {
      email: "accountant@suryapower.com",
      name: "Accountant",
      password: accountantPassword,
      role: "ACCOUNTANT",
      phone: "9790987190",
    },
  });

  console.log("Seeded Users:", { admin: admin.email, staff: staff.email, accountant: accountant.email });

  // 2. Seed Customers
  const cust1 = await prisma.customer.upsert({
    where: { gstin: "33BBLPK8853F2ZF" },
    update: {},
    create: {
      companyName: "Narayana Engineering Industries",
      gstin: "33BBLPK8853F2ZF",
      pan: "BBLPK8853F",
      address: "No: 1/299A, Sholinganallur Main Road, Perumbakkam, Chennai - 600 100",
      shippingAddress: "Site No 4, OMR IT Highway, Sholinganallur, Chennai - 600 119",
      contactPerson: "Mr. R. Narayanan",
      phone: "9840123456",
      email: "purchase@narayanaeng.com",
      state: "Tamil Nadu",
      stateCode: "33",
      placeOfSupply: "Tamil Nadu (33)",
      status: "ACTIVE",
      remarks: "Regular DG Hiring and Service customer",
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { gstin: "33AAACL1234F1Z8" },
    update: {},
    create: {
      companyName: "Larsen & Toubro Construction",
      gstin: "33AAACL1234F1Z8",
      pan: "AAACL1234F",
      address: "Mount Poonamallee Road, Manapakkam, Chennai, Tamil Nadu - 600 089",
      contactPerson: "S. K. Sharma",
      phone: "9940876543",
      email: "infra.procure@lntecc.com",
      state: "Tamil Nadu",
      stateCode: "33",
      placeOfSupply: "Tamil Nadu (33)",
      status: "ACTIVE",
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { gstin: "29AABCT9988G1Z2" },
    update: {},
    create: {
      companyName: "TVS Motor Company (Interstate)",
      gstin: "29AABCT9988G1Z2",
      pan: "AABCT9988G",
      address: "PB No 4, Harita, Hosur, Karnataka - 635 109",
      contactPerson: "V. Anand",
      phone: "9443210987",
      email: "spares@tvsmotor.com",
      state: "Karnataka",
      stateCode: "29",
      placeOfSupply: "Karnataka (29)",
      status: "ACTIVE",
    },
  });

  console.log("Seeded Customers:", [cust1.companyName, cust2.companyName, cust3.companyName]);

  // 3. Seed Products (DG Sets, Engines, Alternators)
  const prod1 = await prisma.product.create({
    data: {
      name: "15 KVA Cummins Silent DG Set",
      dgBrand: "Cummins",
      engineBrand: "Cummins Engine",
      alternatorBrand: "Stamford",
      model: "C15D5P",
      serialNumber: "DG-2026-015",
      engineNumber: "ENG-889012",
      alternatorNumber: "ALT-776123",
      kva: 15.0,
      fuelType: "Diesel",
      purchaseCost: 95000,
      sellingPrice: 125000,
      gstPercentage: 18.0,
      hsnCode: "8502",
      description: "15 KVA Silent Diesel Generator Set with Stamford Alternator - Old DG Set Refurbished",
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: "62.5 KVA Kirloskar Silent DG Set",
      dgBrand: "Kirloskar Green",
      engineBrand: "Kirloskar",
      alternatorBrand: "Kirloskar",
      model: "KG1-62.5WS",
      serialNumber: "DG-2026-062",
      engineNumber: "KIR-99120",
      alternatorNumber: "KALT-5541",
      kva: 62.5,
      fuelType: "Diesel",
      purchaseCost: 240000,
      sellingPrice: 320000,
      gstPercentage: 18.0,
      hsnCode: "8502",
      description: "62.5 KVA Kirloskar Green Water-Cooled Silent Generator Set",
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: "Monthly DG Hiring Service (125 KVA)",
      dgBrand: "Ashok Leyland",
      engineBrand: "Ashok Leyland",
      alternatorBrand: "Leroy Somer",
      model: "AL-125",
      kva: 125.0,
      fuelType: "Diesel",
      purchaseCost: 0,
      sellingPrice: 45000,
      gstPercentage: 18.0,
      hsnCode: "998729",
      description: "Monthly Rental Hiring Charge for 125 KVA DG Set (Excluding Diesel)",
    },
  });

  console.log("Seeded Products:", [prod1.name, prod2.name, prod3.name]);

  // 4. Initial Document Sequences
  const currentYear = new Date().getFullYear();
  await prisma.documentSequence.upsert({
    where: { prefix_year: { prefix: "QT", year: currentYear } },
    update: {},
    create: { prefix: "QT", year: currentYear, currentSeq: 0 },
  });
  await prisma.documentSequence.upsert({
    where: { prefix_year: { prefix: "INV", year: currentYear } },
    update: {},
    create: { prefix: "INV", year: currentYear, currentSeq: 0 },
  });
  await prisma.documentSequence.upsert({
    where: { prefix_year: { prefix: "DC", year: currentYear } },
    update: {},
    create: { prefix: "DC", year: currentYear, currentSeq: 0 },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
