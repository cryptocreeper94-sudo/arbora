import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import { sendVerificationEmail } from "./email";
import { generateTrustLayerIdPublic } from "./trustlayer-sso";
import { createTrustStamp } from "./hallmark";

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SHORT_SESSION_MS = 24 * 60 * 60 * 1000;
const TRUST_LAYER_HUB = "https://orbitstaffing.io";

async function verifyWithTrustLayerHub(identifier: string, credential: string): Promise<{ verified: boolean; user?: any }> {
  const apiKey = process.env.TRUST_LAYER_HUB_API_KEY;
  const apiSecret = process.env.TRUST_LAYER_HUB_API_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  if (apiSecret) headers["x-api-secret"] = apiSecret;

  const endpoints = [
    { url: `${TRUST_LAYER_HUB}/api/auth/ecosystem-login`, body: { identifier, credential, appSlug: "verdara" } },
    { url: `${TRUST_LAYER_HUB}/api/chat/auth/login`, body: { username: identifier, password: credential } },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { method: "POST", headers, body: JSON.stringify(ep.body) });
      if (res.ok) {
        const data = await res.json();
        return { verified: true, user: data.user || data };
      }
    } catch {}
  }
  return { verified: false };
}

const TRUSTED_ISSUERS = [
  "trust-layer-sso",
  "trustlayer",
  "trusthome",
  "trustvault",
  "signal",
  "darkwave",
  "dwtl",
];

function verifySsoToken(token: string): { trustLayerId: string; email?: string; firstName?: string; lastName?: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as any;
    if (decoded.iss && !TRUSTED_ISSUERS.includes(decoded.iss)) return null;
    const trustLayerId = decoded.sub || decoded.trustLayerId || decoded.tlid;
    if (!trustLayerId) return null;
    return {
      trustLayerId,
      email: decoded.email,
      firstName: decoded.firstName || decoded.given_name,
      lastName: decoded.lastName || decoded.family_name,
    };
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session_token;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  storage.getSessionByToken(token).then(session => {
    if (!session || session.expiresAt < new Date()) {
      res.clearCookie("session_token");
      return res.status(401).json({ message: "Session expired" });
    }
    req.userId = session.userId;
    next();
  }).catch(() => {
    res.status(500).json({ message: "Authentication error" });
  });
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { firstName, lastName, email, password } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const verificationToken = generateToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const trustLayerId = generateTrustLayerIdPublic();
      const uniqueHash = crypto.randomBytes(12).toString("hex");
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        passwordHash,
        verificationToken,
        verificationExpires,
        emailVerified: false,
        trustLayerId,
        uniqueHash,
      });

      await sendVerificationEmail(email, verificationToken, firstName);

      createTrustStamp({
        userId: user.id,
        category: "auth-register",
        data: { email: user.email, username: `${firstName} ${lastName}`, appContext: "verdara", timestamp: new Date().toISOString() },
      }).catch(err => console.warn("[TrustStamp] auth-register failed:", err?.message));

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      await storage.createSession(user.id, sessionToken, expiresAt);

      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION_MS,
        path: "/",
      });

      return res.status(201).json({
        user: sanitizeUser(user),
        message: "Account created. Please check your email to verify your address.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, password } = parsed.data;
      const rememberMe = req.body.rememberMe !== false;
      let user = await storage.getUserByEmail(email);

      if (!user) {
        try {
          const hubResult = await verifyWithTrustLayerHub(email, password);
          if (hubResult.verified) {
            const hubUser = hubResult.user || {};
            const trustLayerId = hubUser.trustLayerId || hubUser.trust_layer_id || hubUser.id || generateTrustLayerIdPublic();
            const displayName = hubUser.displayName || hubUser.display_name || hubUser.username || "Explorer";

            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            user = await storage.createUser({
              firstName: displayName.split(" ")[0] || "Explorer",
              lastName: displayName.split(" ").slice(1).join(" ") || "",
              email: email.toLowerCase(),
              passwordHash,
              emailVerified: true,
              trustLayerId: String(trustLayerId).startsWith("tl-") ? trustLayerId : generateTrustLayerIdPublic(),
            });
            console.log(`[Login] Auto-created Verdara account for Trust Layer member: ${email} (${user.trustLayerId})`);
          } else {
            return res.status(401).json({ message: "Invalid email or password" });
          }
        } catch {
          return res.status(401).json({ message: "Invalid email or password" });
        }
      } else {
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
      }

      const duration = rememberMe ? SESSION_DURATION_MS : SHORT_SESSION_MS;
      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + duration);
      await storage.createSession(user.id, sessionToken, expiresAt);

      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: duration,
        path: "/",
      });

      createTrustStamp({
        userId: user.id,
        category: "auth-login",
        data: { ip: req.ip || "unknown", device: req.headers["user-agent"] || "unknown", appContext: "verdara", timestamp: new Date().toISOString() },
      }).catch(err => console.warn("[TrustStamp] auth-login failed:", err?.message));

      return res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.session_token;
      if (token) {
        await storage.deleteSession(token);
      }

      createTrustStamp({
        userId: req.userId!,
        category: "auth-logout",
        data: { sessionDuration: "unknown", appContext: "verdara", timestamp: new Date().toISOString() },
      }).catch(err => console.warn("[TrustStamp] auth-logout failed:", err?.message));

      res.clearCookie("session_token");
      return res.json({ message: "Logged out" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/?verified=error");
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.redirect("/?verified=invalid");
      }

      if (user.verificationExpires && user.verificationExpires < new Date()) {
        return res.redirect("/?verified=expired");
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      } as any);

      return res.redirect("/?verified=success");
    } catch (error) {
      console.error("Verification error:", error);
      return res.redirect("/?verified=error");
    }
  });

  // ─── Trust Layer Direct Ecosystem Login ────────────────────
  app.post("/api/auth/ecosystem-login", async (req: Request, res: Response) => {
    try {
      const { identifier, credential } = req.body;

      if (!identifier || !credential || typeof identifier !== "string" || typeof credential !== "string") {
        return res.status(400).json({ message: "Trust Layer ID or email and credential are required" });
      }

      const trimmedId = identifier.trim();
      const trimmedCred = credential.trim();

      if (!trimmedId || !trimmedCred) {
        return res.status(400).json({ message: "Trust Layer ID or email and credential are required" });
      }

      let user;
      if (trimmedId.startsWith("tl-")) {
        user = await storage.getUserByTrustLayerId(trimmedId);
      }
      if (!user) {
        user = await storage.getUserByEmail(trimmedId.toLowerCase());
      }

      if (!user) {
        try {
          const hubResult = await verifyWithTrustLayerHub(trimmedId, trimmedCred);
          if (hubResult.verified) {
            const hubUser = hubResult.user || {};
            const rawTlId = hubUser.trustLayerId || hubUser.trust_layer_id || hubUser.id;
            const trustLayerId = rawTlId && String(rawTlId).startsWith("tl-") ? rawTlId : generateTrustLayerIdPublic();
            const hubEmail = hubUser.email || (trimmedId.includes("@") ? trimmedId.toLowerCase() : `${trustLayerId}@trustlayer.ecosystem`);
            const displayName = hubUser.displayName || hubUser.display_name || hubUser.username || "Explorer";

            const passwordHash = await bcrypt.hash(trimmedCred, SALT_ROUNDS);
            user = await storage.createUser({
              firstName: displayName.split(" ")[0] || "Explorer",
              lastName: displayName.split(" ").slice(1).join(" ") || "",
              email: hubEmail,
              passwordHash,
              emailVerified: true,
              trustLayerId,
            });
            console.log(`[Ecosystem Login] Auto-created Verdara account for Trust Layer member: ${hubEmail} (${trustLayerId})`);
          } else {
            return res.status(401).json({ message: "No ecosystem account found. Please register first or check your credentials." });
          }
        } catch (hubError: any) {
          console.warn("[Ecosystem Login] Hub verification failed:", hubError?.message || "unknown");
          return res.status(401).json({ message: "No ecosystem account found. Check your Trust Layer ID or email." });
        }
      } else {
        if (!user.trustLayerId) {
          return res.status(401).json({ message: "This account is not linked to the Trust Layer ecosystem. Please sign in with your email and password instead." });
        }

        let authenticated = false;

        if (user.ecosystemPinHash && trimmedCred.length <= 8 && /^\d+$/.test(trimmedCred)) {
          authenticated = await bcrypt.compare(trimmedCred, user.ecosystemPinHash);
        }

        if (!authenticated) {
          authenticated = await bcrypt.compare(trimmedCred, user.passwordHash);
        }

        if (!authenticated) {
          return res.status(401).json({ message: "Invalid credential. Please check your password or ecosystem PIN." });
        }
      }

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      await storage.createSession(user.id, sessionToken, expiresAt);

      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION_MS,
        path: "/",
      });

      console.log(`[Ecosystem Login] ${user.email} authenticated via Trust Layer (${user.trustLayerId})`);
      return res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error("Ecosystem login error:", error);
      return res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // ─── Trust Layer SSO Login ──────────────────────────────────
  app.post("/api/auth/sso", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "SSO token is required" });
      }

      const decoded = verifySsoToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired SSO token" });
      }

      const { trustLayerId } = decoded;

      let user = await storage.getUserByTrustLayerId(trustLayerId);

      if (!user) {
        const email = req.body.email || decoded.email;
        if (email) {
          user = await storage.getUserByEmail(email.toLowerCase()) || undefined;
          if (user && !user.trustLayerId) {
            await storage.updateUserTrustLayerId(user.id, trustLayerId);
            user = await storage.getUser(user.id);
          }
        }
      }

      if (!user) {
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

        user = await storage.createUser({
          firstName: req.body.firstName || decoded.firstName || req.body.displayName || "Explorer",
          lastName: req.body.lastName || decoded.lastName || "",
          email: req.body.email || decoded.email || `${trustLayerId}@trustlayer.ecosystem`,
          passwordHash,
          emailVerified: true,
          trustLayerId,
        });
        console.log(`[SSO] Auto-created Verdara account for Trust Layer member: ${trustLayerId}`);
      }

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      await storage.createSession(user!.id, sessionToken, expiresAt);

      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION_MS,
        path: "/",
      });

      return res.json({ user: sanitizeUser(user!) });
    } catch (error) {
      console.error("SSO login error:", error);
      return res.status(500).json({ message: "SSO login failed" });
    }
  });

  app.get("/api/auth/sso/redirect", async (req: Request, res: Response) => {
    try {
      const { token, email, firstName, lastName, displayName } = req.query;
      if (!token || typeof token !== "string") {
        return res.redirect("/auth?sso_error=missing_token");
      }

      const decoded = verifySsoToken(token);
      if (!decoded) {
        return res.redirect("/auth?sso_error=invalid_token");
      }

      const { trustLayerId } = decoded;

      let user = await storage.getUserByTrustLayerId(trustLayerId);

      if (!user && (email || decoded.email)) {
        const lookupEmail = ((email as string) || decoded.email!).toLowerCase();
        user = await storage.getUserByEmail(lookupEmail) || undefined;
        if (user && !user.trustLayerId) {
          await storage.updateUserTrustLayerId(user.id, trustLayerId);
          user = await storage.getUser(user.id);
        }
      }

      if (!user) {
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

        user = await storage.createUser({
          firstName: (firstName as string) || decoded.firstName || (displayName as string) || "Explorer",
          lastName: (lastName as string) || decoded.lastName || "",
          email: (email as string) || decoded.email || `${trustLayerId}@trustlayer.ecosystem`,
          passwordHash,
          emailVerified: true,
          trustLayerId,
        });
        console.log(`[SSO] Auto-created Verdara account via redirect for: ${trustLayerId}`);
      }

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      await storage.createSession(user!.id, sessionToken, expiresAt);

      res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION_MS,
        path: "/",
      });

      return res.redirect("/?sso=success");
    } catch (error) {
      console.error("SSO redirect error:", error);
      return res.redirect("/auth?sso_error=failed");
    }
  });

  app.post("/api/auth/resend-verification", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.emailVerified) {
        return res.json({ message: "Email already verified" });
      }

      const verificationToken = generateToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.updateUser(user.id, { verificationToken, verificationExpires } as any);
      await sendVerificationEmail(user.email, verificationToken, user.firstName);

      return res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({ message: "Failed to send verification email" });
    }
  });
}

function sanitizeUser(user: any) {
  const { passwordHash, verificationToken, verificationExpires, ecosystemPinHash, ...safe } = user;
  return safe;
}
