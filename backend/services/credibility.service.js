import prisma from "../prisma/client.js";
import { delCachePattern } from "../config/redis.js";

const SCORE_LIMITS = { min: 0, max: 100 };

const clamp = (val) => Math.min(SCORE_LIMITS.max, Math.max(SCORE_LIMITS.min, val));

// ─── Adjust score ────────────────────────────────────────────────────────────
export const adjustCredibility = async (journalistId, delta, reason) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
  });
  if (!journalist) throw new Error("Journalist not found");

  const newScore = clamp(journalist.credibilityScore + delta);

  await prisma.$transaction([
    prisma.journalistProfile.update({
      where: { id: journalistId },
      data: { credibilityScore: newScore },
    }),
    prisma.credibilityLog.create({
      data: { journalistId, delta, reason, newScore },
    }),
  ]);

  // Bust cache
  await delCachePattern(`credibility:${journalistId}*`);

  return { journalistId, previousScore: journalist.credibilityScore, newScore, delta, reason };
};

// ─── Get journalist credibility ───────────────────────────────────────────────
export const getCredibilityService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    select: {
      id: true,
      credibilityScore: true,
      verified: true,
      user: { select: { id: true, name: true } },
    },
  });
  if (!journalist) throw new Error("Journalist not found");
  return journalist;
};

// ─── Get credibility history ──────────────────────────────────────────────────
export const getCredibilityHistoryService = async (journalistId, page = 1) => {
  const limit = 20;
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.credibilityLog.findMany({
      where: { journalistId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.credibilityLog.count({ where: { journalistId } }),
  ]);
  return { data: logs, pagination: { page, limit, total } };
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const getCredibilityLeaderboardService = async (limit = 10) => {
  return await prisma.journalistProfile.findMany({
    where: { verified: true },
    orderBy: { credibilityScore: "desc" },
    take: limit,
    select: {
      id: true,
      credibilityScore: true,
      user: { select: { id: true, name: true } },
    },
  });
};
