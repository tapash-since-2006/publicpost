import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";
import { isTokenBlacklisted } from "../config/redis.js";

export const authenticate = async (req, res, next) => {
  // Support token from Authorization header OR query param (for SSE/EventSource)
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;

  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return res.status(401).json({ error: "Token has been revoked" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Always fetch fresh user from DB so house/role changes reflect immediately
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, house: true, email: true },
    });

    if (!user) return res.status(401).json({ error: "User no longer exists" });

    req.user = { userId: user.id, role: user.role, house: user.house };
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorize = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (req.user.role === "ADMIN") return next();
    if (allowed.includes(req.user.role) || allowed.includes(req.user.house)) return next();
    return res.status(403).json({
      error: `Access denied. Required: ${allowed.join(" or ")}. Your role: ${req.user.role}, house: ${req.user.house}`,
    });
  };
};

export const authorizeRoles = authorize;
