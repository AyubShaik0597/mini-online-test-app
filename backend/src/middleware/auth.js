import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getAdminEmail = () =>
  (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.userId)
      .select("_id name email createdAt");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

export function requireAdmin(req, res, next) {
  const adminEmail = getAdminEmail();

  if (
    !req.user ||
    !adminEmail ||
    req.user.email.toLowerCase() !== adminEmail
  ) {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
}

export function requireStudent(req, res, next) {
  const adminEmail = getAdminEmail();

  if (
    adminEmail &&
    req.user?.email.toLowerCase() === adminEmail
  ) {
    return res.status(403).json({
      message: "Administrators cannot take the student exam."
    });
  }

  next();
}