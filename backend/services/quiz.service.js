import prisma from "../prisma/client.js";
import { getQuizQuestionsService } from "./admin.service.js";

const calculateLeaning = (totalScore) => {
  if (totalScore <= 9)  return "LEFT";
  if (totalScore <= 14) return "CENTER_LEFT";
  if (totalScore <= 20) return "CENTER";
  if (totalScore <= 25) return "CENTER_RIGHT";
  return "RIGHT";
};

export const submitQuiz = async (userId, answers) => {
  if (!Array.isArray(answers) || answers.length !== 6) {
    throw new Error("Quiz must contain exactly 6 answers");
  }
  for (const a of answers) {
    const num = Number(a);
    if (isNaN(num) || num < 1 || num > 5) {
      throw new Error("Each answer must be a number between 1 and 5");
    }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.lastQuizTakenAt) {
    const oneMonthLater = new Date(user.lastQuizTakenAt);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    if (new Date() < oneMonthLater) {
      const daysLeft = Math.ceil((oneMonthLater - new Date()) / (1000 * 60 * 60 * 24));
      throw new Error(`You can retake the quiz in ${daysLeft} day(s)`);
    }
  }

  const nums = answers.map(Number);
  const totalScore = nums.reduce((sum, val) => sum + val, 0);
  const calculatedLeaning = calculateLeaning(totalScore);

  await prisma.quizAttempt.create({
    data: {
      userId,
      q1: nums[0], q2: nums[1], q3: nums[2],
      q4: nums[3], q5: nums[4], q6: nums[5],
      totalScore,
      calculatedLeaning,
    },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { politicalLeaning: calculatedLeaning, lastQuizTakenAt: new Date() },
  });

  return {
    userId: updatedUser.id,
    politicalLeaning: calculatedLeaning,
    totalScore,
    lastQuizTakenAt: updatedUser.lastQuizTakenAt,
  };
};

// Public endpoint — get current questions for the quiz UI
export const getQuizQuestionsPublic = async () => {
  return await getQuizQuestionsService();
};
