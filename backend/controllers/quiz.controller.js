import { submitQuiz, getQuizQuestionsPublic } from "../services/quiz.service.js";

export const submitQuizController = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: "answers array is required" });
    const result = await submitQuiz(req.user.userId, answers);
    res.status(200).json({ message: "Quiz submitted", ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getQuizQuestionsController = async (req, res) => {
  try {
    const questions = await getQuizQuestionsPublic();
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
