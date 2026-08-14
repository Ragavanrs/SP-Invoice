import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  return await seedDB();
}

export async function GET() {
  return await seedDB();
}

async function seedDB() {
  try {
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

    // Sample Customer 1
    await prisma.customer.upsert({
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

    // Sample Customer 2
    await prisma.customer.upsert({
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

    // Sample Product
    const countProd = await prisma.product.count();
    if (countProd === 0) {
      await prisma.product.create({
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
    }

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

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      credentials: [
        { role: "ADMIN", email: "admin@suryapower.com", password: "admin123" },
        { role: "STAFF", email: "staff@suryapower.com", password: "staff123" },
        { role: "ACCOUNTANT", email: "accountant@suryapower.com", password: "accountant123" },
      ],
    });
  } catch (err: any) {
    console.error("Seed API error:", err);
    return NextResponse.json({ error: err.message || "Seed failed" }, { status: 500 });
  }
}
