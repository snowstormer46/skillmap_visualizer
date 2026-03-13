import express from "express";
import { createServer as createViteServer } from "vite";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import Skill from "./src/models/Skill.js";
import Analysis from "./src/models/Analysis.js";
import { ROLE_SKILLS, PROJECT_BANK } from "./src/services/geminiService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}
function clearRateLimit(ip: string) { loginAttempts.delete(ip); }

// ─── MongoDB Connection ───────────────────────────────────────────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<user>') || uri.includes('<password>')) {
    console.warn('⚠️  MONGODB_URI not configured — DB features will be unavailable.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('✅  Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err);
    if (process.env.NODE_ENV === 'production') process.exit(1);
    else console.warn('⚠️  Running without MongoDB — DB endpoints will return errors.');
  }
}

// ─── Server ──────────────────────────────────────────────────────────────────
async function startServer() {
  await connectDB();

  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");
  const isDev = process.env.NODE_ENV !== "production";

  app.set("trust proxy", 1);

  // CORS — allow Vercel frontend in production
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,         // e.g. https://skillmap.vercel.app
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());

  app.use(session({
    name: "skillmap.sid",
    secret: process.env.SESSION_SECRET || "skillmap-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    rolling: true,
    cookie: {
      secure: !isDev,
      sameSite: isDev ? "lax" : "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  const getRedirectUri = (req: express.Request) => {
    if (process.env.APP_URL) return `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback`;
    const host = req.get("host");
    const proto = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    return `${proto}://${host}/auth/callback`;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // AUTH ROUTES
  // ──────────────────────────────────────────────────────────────────────────

  // OAuth URL
  app.get("/api/auth/url", (req, res) => {
    const { provider } = req.query;
    const redirectUri = getRedirectUri(req);
    if (provider === "google") {
      const p = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state: "google" });
      return res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${p}` });
    }
    if (provider === "github") {
      const p = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID!, redirect_uri: redirectUri, scope: "user:email", state: "github" });
      return res.json({ url: `https://github.com/login/oauth/authorize?${p}` });
    }
    res.status(400).json({ error: "Invalid provider" });
  });

  // OAuth Callback
  app.get("/auth/callback", async (req, res) => {
    const { code, state } = req.query;
    const redirectUri = getRedirectUri(req);
    try {
      let email = "", name = "", providerId = "";
      if (state === "google") {
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", { code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" });
        const userRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        email = userRes.data.email; name = userRes.data.name; providerId = userRes.data.sub;
      } else if (state === "github") {
        const tokenRes = await axios.post("https://github.com/login/oauth/access_token", { code, client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, redirect_uri: redirectUri }, { headers: { Accept: "application/json" } });
        const [userRes, emailsRes] = await Promise.all([
          axios.get("https://api.github.com/user", { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } }),
          axios.get("https://api.github.com/user/emails", { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } }),
        ]);
        email = emailsRes.data.find((e: any) => e.primary).email;
        name = userRes.data.name || userRes.data.login;
        providerId = userRes.data.id.toString();
      }

      let user = await User.findOne({ email });
      if (!user) user = await User.create({ name, email, provider: state as string, providerId });

      (req as any).session.userId = user._id.toString();
      (req as any).session.save((err: any) => {
        if (err) console.error("OAuth session save error:", err);
        res.send(`<html><body><script>
          if(window.opener){window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS'},window.location.origin);window.close();}
          else{window.location.href='/';}
        </script></body></html>`);
      });
    } catch (err: any) {
      console.error("OAuth callback error:", err.message);
      res.redirect("/?error=oauth_failed");
    }
  });

  // Sign Up
  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    try {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ error: "An account with this email already exists." });
      const hash = await bcrypt.hash(password, 12);
      const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hash });
      (req as any).session.userId = user._id.toString();
      res.json({ message: "Account created successfully" });
    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const ip = req.ip || "unknown";
    if (isRateLimited(ip)) return res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.password) return res.status(401).json({ error: "Invalid email or password." });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: "Invalid email or password." });
      clearRateLimit(ip);
      (req as any).session.userId = user._id.toString();
      res.json({ message: "Logged in successfully" });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy(() => res.json({ message: "Logged out" }));
  });

  // Auth middleware
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    try {
      const user = await User.findById(userId);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      (req as any).user = user;
      next();
    } catch {
      res.status(401).json({ error: "Not authenticated" });
    }
  };

  // Get current user (session check)
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = (req as any).user;
    res.json({ id: user._id, name: user.name, email: user.email, targetRole: user.targetRole });
  });

  app.get("/api/user", requireAuth, (req, res) => {
    const user = (req as any).user;
    res.json({ id: user._id, name: user.name, email: user.email, targetRole: user.targetRole });
  });

  // Update user profile
  app.put("/api/user", requireAuth, async (req, res) => {
    const { name, targetRole } = req.body;
    try {
      const user = (req as any).user;
      if (name) user.name = name.trim();
      if (targetRole) user.targetRole = targetRole;
      await user.save();
      res.json({ message: "Profile updated", name: user.name, targetRole: user.targetRole });
    } catch (err) {
      res.status(500).json({ error: "Failed to update profile." });
    }
  });

  // ─── Auto-Analysis Helper ──────────────────────────────────────────────────
  async function triggerAutoAnalysis(userId: string, targetRole: string) {
    try {
      const skills = await Skill.find({ userId });
      const currentSkillNames = skills.map(s => s.name.toLowerCase());
      
      const roleSkills = ROLE_SKILLS[targetRole] || ROLE_SKILLS['Backend Developer'];
      if (!roleSkills) return;

      const found = roleSkills.filter(s => currentSkillNames.some(cs => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs)));
      const matchScore = Math.min(100, Math.round((found.length / roleSkills.length) * 100 * 1.5));
      
      await Analysis.create({
        userId,
        targetRole,
        matchScore,
        date: new Date().toISOString(),
        extractedSkills: skills.map(s => s.name),
        missingSkills: roleSkills.filter(s => !found.includes(s)).slice(0, 10),
        recommendedProjects: (PROJECT_BANK[targetRole] || PROJECT_BANK['Backend Developer']).slice(0, 5),
      });
    } catch (err) {
      console.error("Auto-analysis error:", err);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SKILLS ROUTES
  // ──────────────────────────────────────────────────────────────────────────

  app.get("/api/skills", requireAuth, async (req, res) => {
    try {
      const skills = await Skill.find({ userId: (req as any).user._id }).sort({ createdAt: -1 });
      res.json(skills.map(s => ({ id: s._id, name: s.name, level: s.level, category: s.category })));
    } catch (err) { res.status(500).json({ error: "Failed to fetch skills." }); }
  });

  app.post("/api/skills", requireAuth, async (req, res) => {
    const { name, level, category } = req.body;
    if (!name) return res.status(400).json({ error: "Skill name is required." });
    try {
      const userId = (req as any).user._id;
      const existing = await Skill.findOne({ userId, name: { $regex: new RegExp(`^${name}$`, "i") } });
      if (existing) return res.status(409).json({ error: "Skill already exists." });
      const skill = await Skill.create({ userId, name: name.trim(), level: level || "Beginner", category: category || "General" });
      
      // Trigger auto-analysis for the user to reflect skill change in graph
      const targetRole = (req as any).user.targetRole || "Backend Developer";
      triggerAutoAnalysis(userId.toString(), targetRole);

      res.status(201).json({ id: skill._id, name: skill.name, level: skill.level, category: skill.category });
    } catch (err) { res.status(500).json({ error: "Failed to add skill." }); }
  });

  app.delete("/api/skills/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user._id;
      const skill = await Skill.findOneAndDelete({ _id: req.params.id, userId });
      if (!skill) return res.status(404).json({ error: "Skill not found." });
      
      // Trigger auto-analysis
      const targetRole = (req as any).user.targetRole || "Backend Developer";
      triggerAutoAnalysis(userId.toString(), targetRole);

      res.json({ message: "Skill deleted." });
    } catch (err) { res.status(500).json({ error: "Failed to delete skill." }); }
  });

  // -----------------------------------------------------------------------
  // ANALYZE (primary endpoint called by Analyze.tsx)
  // -----------------------------------------------------------------------
  app.post('/api/analyze', requireAuth, async (req, res) => {
    const { targetRole, skills, matchScore, extractedSkills, missingSkills, recommendedProjects } = req.body;
    try {
      const userId = (req as any).user._id;

      // Save analysis record
      const analysis = await Analysis.create({
        userId,
        targetRole: targetRole || 'Backend Developer',
        matchScore: matchScore || 0,
        date: new Date().toISOString(),
        extractedSkills: extractedSkills || skills || [],
        missingSkills: missingSkills || [],
        recommendedProjects: recommendedProjects || [],
      });

      // Auto-save newly extracted skills (skip duplicates)
      const skillList: string[] = extractedSkills || skills || [];
      for (const name of skillList) {
        const exists = await Skill.findOne({ userId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!exists) await Skill.create({ userId, name, level: 'Beginner', category: 'Extracted' });
      }

      res.status(201).json({ id: analysis._id, message: 'Analysis saved.' });
    } catch (err) {
      console.error('Save analysis error:', err);
      res.status(500).json({ error: 'Failed to save analysis.' });
    }
  });

  // -----------------------------------------------------------------------
  // ANALYSES ROUTES
  // -----------------------------------------------------------------------

  app.get("/api/analyses", requireAuth, async (req, res) => {
    try {
      const analyses = await Analysis.find({ userId: (req as any).user._id }).sort({ createdAt: -1 });
      res.json(analyses.map(a => ({
        id: a._id,
        targetRole: a.targetRole,
        matchScore: a.matchScore,
        date: a.date,
        extractedSkills: a.extractedSkills,
        missingSkills: a.missingSkills,
        recommendedProjects: a.recommendedProjects,
        isArchived: a.isArchived,
      })));
    } catch (err) { res.status(500).json({ error: "Failed to fetch analyses." }); }
  });

  app.post("/api/analyses", requireAuth, async (req, res) => {
    const { targetRole, matchScore, extractedSkills, missingSkills, recommendedProjects } = req.body;
    try {
      const analysis = await Analysis.create({
        userId: (req as any).user._id,
        targetRole: targetRole,
        matchScore: matchScore || 0,
        date: new Date().toISOString(),
        extractedSkills: extractedSkills || [],
        missingSkills: missingSkills || [],
        recommendedProjects: recommendedProjects || [],
      });
      res.status(201).json({ id: analysis._id });
    } catch (err) { res.status(500).json({ error: "Failed to save analysis." }); }
  });

  app.patch("/api/analyses/:id/archive", requireAuth, async (req, res) => {
    try {
      const analysis = await Analysis.findOneAndUpdate(
        { _id: req.params.id, userId: (req as any).user._id },
        { isArchived: req.body.isArchived },
        { new: true }
      );
      if (!analysis) return res.status(404).json({ error: "Analysis not found." });
      res.json({ message: "Updated." });
    } catch (err) { res.status(500).json({ error: "Failed to update analysis." }); }
  });

  app.delete("/api/analyses/:id", requireAuth, async (req, res) => {
    try {
      const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, userId: (req as any).user._id });
      if (!analysis) return res.status(404).json({ error: "Analysis not found." });
      res.json({ message: "Deleted." });
    } catch (err) { res.status(500).json({ error: "Failed to delete analysis." }); }
  });

  // -----------------------------------------------------------------------
  // RESUME PARSING (PDF → text)
  // -----------------------------------------------------------------------
  {
    const multer = (await import('multer')).default;
    const { PDFParse } = await import('pdf-parse');
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

    app.post('/api/parse-resume', requireAuth, upload.single('resume'), async (req: any, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
      try {
        let text = '';
        if (req.file.mimetype === 'application/pdf') {
          const parser = new PDFParse({ data: req.file.buffer });
          const result = await parser.getText();
          text = result.text;
        } else {
          // Plain text / DOCX fallback — read as UTF-8
          text = req.file.buffer.toString('utf-8');
        }
        res.json({ text: text.trim() });
      } catch (err) {
        console.error('PDF parse error:', err);
        res.status(500).json({ error: 'Failed to parse resume. Please try a .txt file.' });
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VITE / STATIC
  // ──────────────────────────────────────────────────────────────────────────

  if (isDev) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    // In production, the server is bundled into dist-server/server.js
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => console.log(`🚀  SkillMap running on http://localhost:${PORT}`));
}

startServer();
