import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { chatUsers, chatRegisterSchema, chatLoginSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 12;
const JWT_EXPIRY = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}

export function generateTrustLayerIdPublic(): string {
  return generateTrustLayerId();
}

function generateTrustLayerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Array.from({ length: 8 }, () =>
    Math.random().toString(36).charAt(2)
  ).join("");
  return `tl-${timestamp}-${random}`;
}

function generateAvatarColor(): string {
  const colors = [
    "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function signToken(userId: string, trustLayerId: string): string {
  return jwt.sign(
    { userId, trustLayerId, iss: "trust-layer-sso" },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY, algorithm: "HS256" }
  );
}

export function verifyToken(token: string): { userId: string; trustLayerId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.iss !== "trust-layer-sso") return null;
    return { userId: decoded.userId, trustLayerId: decoded.trustLayerId };
  } catch {
    return null;
  }
}

export function requireChatAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
  (req as any).chatUserId = decoded.userId;
  (req as any).trustLayerId = decoded.trustLayerId;
  next();
}

function sanitizeChatUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export function registerChatAuthRoutes(app: Express) {
  app.post("/api/chat/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = chatRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { username, email, password, displayName } = parsed.data;

      const [existingUsername] = await db.select().from(chatUsers).where(eq(chatUsers.username, username)).limit(1);
      if (existingUsername) {
        return res.status(409).json({ success: false, message: "Username already taken" });
      }

      const [existingEmail] = await db.select().from(chatUsers).where(eq(chatUsers.email, email)).limit(1);
      if (existingEmail) {
        return res.status(409).json({ success: false, message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const trustLayerId = generateTrustLayerId();
      const avatarColor = generateAvatarColor();

      const [user] = await db.insert(chatUsers).values({
        username,
        email,
        passwordHash,
        displayName,
        avatarColor,
        trustLayerId,
        role: "member",
        isOnline: false,
      }).returning();

      const token = signToken(user.id, user.trustLayerId!);

      return res.status(201).json({
        success: true,
        user: sanitizeChatUser(user),
        token,
      });
    } catch (error) {
      console.error("Chat registration error:", error);
      return res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  app.post("/api/chat/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = chatLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { username, password } = parsed.data;
      const [user] = await db.select().from(chatUsers).where(eq(chatUsers.username, username)).limit(1);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid username or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ success: false, message: "Invalid username or password" });
      }

      await db.update(chatUsers).set({ isOnline: true, lastSeen: new Date() }).where(eq(chatUsers.id, user.id));

      const token = signToken(user.id, user.trustLayerId!);

      return res.json({
        success: true,
        user: sanitizeChatUser(user),
        token,
      });
    } catch (error) {
      console.error("Chat login error:", error);
      return res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.get("/api/chat/auth/me", requireChatAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).chatUserId;
      const [user] = await db.select().from(chatUsers).where(eq(chatUsers.id, userId)).limit(1);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.json({ success: true, user: sanitizeChatUser(user) });
    } catch (error) {
      console.error("Get chat user error:", error);
      return res.status(500).json({ success: false, message: "Failed to get user" });
    }
  });

  app.get("/api/chat/channels", async (_req: Request, res: Response) => {
    try {
      const { chatChannels } = await import("@shared/schema");
      const allChannels = await db.select().from(chatChannels);
      return res.json({ success: true, channels: allChannels });
    } catch (error) {
      console.error("Get channels error:", error);
      return res.status(500).json({ success: false, message: "Failed to get channels" });
    }
  });
}
