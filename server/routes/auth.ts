import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

// TEMPORARY HARDCODED CREDENTIALS (Replace with DB lookup later)
const TEMP_CREDENTIALS = {
  email: "admin@intelleges.com",
  password: "TempAdmin2025!",
  user: {
    id: 1,
    email: "admin@intelleges.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    enterpriseId: 1067,
    isActive: true,
  },
};

/**
 * POST /api/auth/login
 * Simple credential check (hardcoded for now)
 */
router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Temporary credentials check
  if (email === TEMP_CREDENTIALS.email && password === TEMP_CREDENTIALS.password) {
    // Store user in session
    (req.session as any).user = TEMP_CREDENTIALS.user;
    return res.json({ user: TEMP_CREDENTIALS.user });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

/**
 * GET /api/auth/me
 * Get current user session
 */
router.get("/me", (req: Request, res: Response) => {
  const user = (req.session as any).user;
  
  if (!user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user });
});

/**
 * POST /api/auth/logout
 * Logout and destroy session
 */
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("iaos.sid");
    res.json({ ok: true });
  });
});

export default router;

