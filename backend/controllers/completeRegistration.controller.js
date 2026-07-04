import * as completeRegistrationService from "../services/completeRegistration.service.js";

export const completeRegistrationController = async (req, res) => {
  try {
    const result = await completeRegistrationService.completeRegistration(
      req.body,
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
