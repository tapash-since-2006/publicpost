import prisma from "../prisma/client.js";

export const triggerAIFactCheck = async (articleId) => {
  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article || article.status !== "UNDER_REVIEW") return;

    // Simulate AI fact-checking with varying confidence
    // ~60% auto-publish, ~40% need human review (realistic for testing all features)
    const confidenceScore = parseFloat((Math.random() * 0.35 + 0.65).toFixed(2)); // 0.65–1.0
    const isSafe = confidenceScore > 0.7;
    const autoPublish = isSafe && confidenceScore > 0.9;

    await prisma.$transaction(async (tx) => {
      await tx.factCheck.create({
        data: {
          articleId,
          type: "AI",
          status: autoPublish ? "APPROVED" : isSafe ? "APPROVED" : "FLAGGED",
          result: {
            summary: autoPublish
              ? "Content verified. Sources match known databases."
              : "Content requires human verification before publishing.",
            confidenceScore,
            bias: "NEUTRAL",
            isSafe,
            autoPublished: autoPublish,
          },
          confidence: confidenceScore,
        },
      });

      if (autoPublish) {
        await tx.article.update({
          where: { id: articleId },
          data: { status: "PUBLISHED" },
        });
        console.log(`✅ AI auto-published article ${articleId} (confidence: ${confidenceScore})`);
      } else {
        console.log(`📋 Article ${articleId} queued for human review (confidence: ${confidenceScore})`);
      }
    });
  } catch (error) {
    console.error("AI Fact Check Error:", error.message);
  }
};
