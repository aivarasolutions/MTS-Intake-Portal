import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await hashPassword("Admin123!");
  const admin = await prisma.users.upsert({
    where: { email: "admin@mts1040.com" },
    update: {},
    create: {
      email: "admin@mts1040.com",
      password_hash: adminPassword,
      first_name: "System",
      last_name: "Admin",
      role: "admin",
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create preparer user
  const preparerPassword = await hashPassword("Preparer123!");
  const preparer = await prisma.users.upsert({
    where: { email: "preparer@mts1040.com" },
    update: {},
    create: {
      email: "preparer@mts1040.com",
      password_hash: preparerPassword,
      first_name: "John",
      last_name: "Preparer",
      role: "preparer",
    },
  });
  console.log(`✅ Created preparer user: ${preparer.email}`);

  // Create demo client user
  const clientPassword = await hashPassword("Client123!");
  const client = await prisma.users.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      password_hash: clientPassword,
      first_name: "Demo",
      last_name: "Client",
      role: "client",
    },
  });
  console.log(`✅ Created demo client user: ${client.email}`);

  // Check if demo intake already exists
  const existingIntake = await prisma.intakes.findFirst({
    where: { user_id: client.id },
  });

  if (!existingIntake) {
    // Create demo intake
    const intake = await prisma.intakes.create({
      data: {
        user_id: client.id,
        tax_year: 2024,
        status: "draft",
        assigned_preparer_id: preparer.id,
      },
    });
    console.log(`✅ Created demo intake for tax year ${intake.tax_year}`);

    // Create filing status for the intake
    await prisma.filing_status.create({
      data: {
        intake_id: intake.id,
        filing_status: "single",
      },
    });
    console.log(`✅ Created filing status for intake`);

    // Create taxpayer info (without encrypted fields for demo)
    await prisma.taxpayer_info.create({
      data: {
        intake_id: intake.id,
        taxpayer_first_name: "Demo",
        taxpayer_last_name: "Client",
        taxpayer_email: "demo@example.com",
        taxpayer_phone: "(555) 123-4567",
        address_street: "123 Main Street",
        address_city: "Columbus",
        address_state: "OH",
        address_zip: "43215",
        resident_state: "OH",
      },
    });
    console.log(`✅ Created taxpayer info for intake`);

    // Create initial status history entry
    await prisma.status_history.create({
      data: {
        intake_id: intake.id,
        old_status: null,
        new_status: "draft",
        notes: "Intake created",
      },
    });
    console.log(`✅ Created status history entry`);

    // Create a sample checklist item
    await prisma.checklist_items.create({
      data: {
        intake_id: intake.id,
        item_type: "missing_document",
        description: "Please upload your W-2 form(s)",
        is_resolved: false,
      },
    });
    console.log(`✅ Created sample checklist item`);
  } else {
    console.log(`⏭️ Demo intake already exists, skipping...`);
  }

  console.log("\n📊 Seed Summary:");
  console.log("================");
  console.log(`Admin: admin@mts1040.com / Admin123!`);
  console.log(`Preparer: preparer@mts1040.com / Preparer123!`);
  console.log(`Demo Client: demo@example.com / Client123!`);
  console.log("\n✨ Database seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
