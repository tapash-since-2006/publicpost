import { getSideBySideService } from "../services/comparison.service.js";

export const getSideBySide = async (req, res) => {
  try {
    const data = await getSideBySideService(req.params.articleId);
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
