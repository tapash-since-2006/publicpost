import { selectHouse } from "../services/house.service.js";

export const selectHouseController = async (req, res) => {
  try {
    const { house } = req.body; // expected: "CITIZEN", "JOURNALIST", "FACT_CHECKER"
    const userId = req.user.userId;

    const updatedUser = await selectHouse(userId, house);

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
