import prisma from "../prisma/client.js";
import { registerUser } from "./auth.service.js";
import { signToken } from "../utils/jwt.js";

// FIX: unified scoring matching quiz.service.js (range 6-30)
const calculatePoliticalLeaning = (answers) => {
  const total = answers.reduce((sum, val) => sum + val, 0);
  if (total <= 9)  return "LEFT";
  if (total <= 14) return "CENTER_LEFT";
  if (total <= 20) return "CENTER";
  if (total <= 25) return "CENTER_RIGHT";
  return "RIGHT";
};

const VALID_HOUSES = ["CITIZEN", "JOURNALIST", "FACT_CHECKER"];

export const completeRegistration = async ({ name, email, password, quizAnswers, house }) => {
  // Validate inputs
  if (!name || !email || !password) throw new Error("name, email and password are required");
  if (!VALID_HOUSES.includes(house)) throw new Error(`house must be one of: ${VALID_HOUSES.join(", ")}`);
  if (!Array.isArray(quizAnswers) || quizAnswers.length !== 6) {
    throw new Error("quizAnswers must be an array of 6 numbers (1-5 each)");
  }
  for (const a of quizAnswers) {
    if (typeof a !== "number" || a < 1 || a > 5) {
      throw new Error("Each quiz answer must be a number between 1 and 5");
    }
  }

  const { user: registeredUser } = await registerUser({ name, email, password });

  const politicalLeaning = calculatePoliticalLeaning(quizAnswers);
  const totalScore = quizAnswers.reduce((a, b) => a + b, 0);

  const updatedUser = await prisma.user.update({
    where: { id: registeredUser.id },
    data: { house, politicalLeaning, lastQuizTakenAt: new Date() },
  });

  await prisma.quizAttempt.create({
    data: {
      userId: registeredUser.id,
      q1: quizAnswers[0], q2: quizAnswers[1], q3: quizAnswers[2],
      q4: quizAnswers[3], q5: quizAnswers[4], q6: quizAnswers[5],
      totalScore,
      calculatedLeaning: politicalLeaning,
    },
  });

  const token = signToken({
    userId: updatedUser.id,
    role: updatedUser.role,
    house: updatedUser.house,
  });

  return {
    token,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      house: updatedUser.house,
      politicalLeaning: updatedUser.politicalLeaning,
    },
  };
};
