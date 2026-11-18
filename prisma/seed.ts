import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash(process.env.SEED_PASSWORD || "ChangeMe-2026!", 10);
  const users: [string, string, Role][] = [
    ["Owner Admin", "admin@garicare.test", "ADMIN"],
    ["Attendant", "attendant@garicare.test", "ATTENDANT"],
    ["Technician", "technician@garicare.test", "TECHNICIAN"],
    ["Inspector", "inspector@garicare.test", "INSPECTOR"],
    ["Cashier", "cashier@garicare.test", "CASHIER"],
  ];
  for (const [name, email, role] of users)
    await prisma.user.upsert({ where: { email }, update: {}, create: { name, email, role, passwordHash: pw } });

  const services: [string, string, number][] = [
    ["Exterior wash", "Wash & detail", 500], ["Full wash", "Wash & detail", 800],
    ["Interior vacuum", "Wash & detail", 400], ["Engine-bay cleaning", "Wash & detail", 1000],
    ["Polishing & waxing", "Wash & detail", 2500], ["Carpet washing", "Upholstery", 1500],
    ["Puncture repair", "Tyres", 600], ["Wheel balancing", "Tyres", 1200],
  ];
  if ((await prisma.service.count()) === 0)
    await prisma.service.createMany({ data: services.map(([name, category, price]) => ({ name, category, price })) });
  console.log("Seed complete");
}
main().finally(() => prisma.$disconnect());
