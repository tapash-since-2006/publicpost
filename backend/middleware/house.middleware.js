// ADMIN always bypasses house check
export const authorizeHouse = (...allowedHouses) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role === "ADMIN") return next();
    if (!allowedHouses.includes(req.user.house)) {
      return res.status(403).json({
        error: `Access denied. Required house: ${allowedHouses.join(" or ")}. Your house: ${req.user.house}`,
      });
    }
    next();
  };
};
