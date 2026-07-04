import { registerUser, loginUser, logoutUser, getProfileService } from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    await logoutUser(req.token);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await getProfileService(req.user.userId);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
