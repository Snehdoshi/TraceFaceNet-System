import { randomUUID } from "crypto";
import { Router, type IRouter } from "express";

type SessionRecord = {
  username: string;
  createdAt: string;
};

type UserRecord = {
  username: string;
  passwordHash: string;
  createdAt: string;
};

type ResetTokenRecord = {
  username: string;
  createdAt: string;
};

const router: IRouter = Router();
const sessions = new Map<string, SessionRecord>();
const users = new Map<string, UserRecord>();
const resetTokens = new Map<string, ResetTokenRecord>();
const SESSION_COOKIE = "tfn_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

function hashPassword(password: string) {
  return randomUUID() + ":" + Buffer.from(password).toString("base64");
}

function verifyPassword(storedHash: string, password: string) {
  const [, encoded] = storedHash.split(":");
  return encoded === Buffer.from(password).toString("base64");
}

function createSession(username: string) {
  const sessionId = randomUUID();
  sessions.set(sessionId, {
    username,
    createdAt: new Date().toISOString(),
  });
  return sessionId;
}

router.post("/login", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

  if (!username || !password) {
    return res.status(400).json({ error: "validation_error", message: "Username and password are required" });
  }

  const user = users.get(username.toLowerCase());
  if (!user || !verifyPassword(user.passwordHash, password)) {
    return res.status(401).json({ error: "invalid_credentials", message: "Invalid username or password" });
  }

  const sessionId = createSession(user.username);

  res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  return res.json({ username: user.username });
});

router.post("/register", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

  if (!username || !password) {
    return res.status(400).json({ error: "validation_error", message: "Username and password are required" });
  }

  const key = username.toLowerCase();
  if (users.has(key)) {
    return res.status(409).json({ error: "conflict", message: "Username already exists" });
  }

  users.set(key, {
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  const sessionId = createSession(username);
  res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  return res.status(201).json({ username });
});

router.post("/forgot-password", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  if (!username) {
    return res.status(400).json({ error: "validation_error", message: "Username is required" });
  }

  const user = users.get(username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found" });
  }

  const resetToken = randomUUID();
  resetTokens.set(resetToken, { username: user.username, createdAt: new Date().toISOString() });
  return res.json({ username: user.username, resetToken });
});

router.post("/reset-password", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const resetToken = typeof req.body?.resetToken === "string" ? req.body.resetToken.trim() : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword.trim() : "";

  if (!username || !resetToken || !newPassword) {
    return res.status(400).json({ error: "validation_error", message: "Username, reset token, and new password are required" });
  }

  const tokenRecord = resetTokens.get(resetToken);
  if (!tokenRecord || tokenRecord.username.toLowerCase() !== username.toLowerCase()) {
    return res.status(400).json({ error: "invalid_token", message: "Reset token is invalid" });
  }

  const user = users.get(username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found" });
  }

  users.set(username.toLowerCase(), {
    ...user,
    passwordHash: hashPassword(newPassword),
  });
  resetTokens.delete(resetToken);
  return res.json({ username: user.username, success: true });
});

router.get("/me", async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (typeof sessionId !== "string") {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(401).json({ error: "unauthorized", message: "Not authenticated" });
  }

  return res.json({ username: session.username, createdAt: session.createdAt });
});

router.post("/logout", async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (typeof sessionId === "string") {
    sessions.delete(sessionId);
  }

  res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
  return res.json({ success: true });
});

export default router;
