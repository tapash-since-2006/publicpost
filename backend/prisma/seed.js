import prisma from "./client.js";
import { hashPassword } from "../utils/hash.js";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_QUIZ_QUESTIONS = [
  "Government should prioritize equality of outcomes over individual liberty.",
  "Free markets generally produce better outcomes than government regulation.",
  "Immigration benefits the country more than it harms it.",
  "Climate change requires immediate and significant government intervention.",
  "Individual rights should take precedence over collective welfare.",
  "Traditional institutions and values are important for social stability.",
];

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@gmail.com";

  // ── Admin user ────────────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Admin already exists: ${email}`);
  } else {
    const passwordHash = await hashPassword("admin123");
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: passwordHash,
        role: "ADMIN",
        house: "CITIZEN",
        politicalLeaning: "CENTER",
      },
    });
    console.log(`✅ Admin created: ${email} / admin123`);
  }

  // ── Quiz questions ────────────────────────────────────────────────────────
  const questionCount = await prisma.quizQuestion.count();
  if (questionCount === 0) {
    await prisma.quizQuestion.createMany({
      data: DEFAULT_QUIZ_QUESTIONS.map((text, i) => ({
        text,
        orderIdx: i,
        active: true,
      })),
    });
    console.log(`✅ Quiz questions seeded (${DEFAULT_QUIZ_QUESTIONS.length} questions)`);
  } else {
    console.log(`✅ Quiz questions already exist (${questionCount} questions)`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
