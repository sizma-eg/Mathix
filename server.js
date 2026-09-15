import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-before-production";
const DAILY_LIMIT = Math.max(1, Number(process.env.DAILY_LIMIT || 5));
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = new Database(process.env.DB_PATH || "mathix.db");

db.pragma("journal_mode=WAL");
db.pragma("foreign_keys=ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    answer TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    note TEXT DEFAULT '',
    favorite INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS usage_daily (
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    PRIMARY KEY(user_id, day),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.static("."));

const day = () => new Date().toISOString().slice(0, 10);
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.created_at });
const tokenFor = (u) => jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "7d" });
const usedToday = (id) => db.prepare("SELECT count FROM usage_daily WHERE user_id=? AND day=?").get(id, day())?.count || 0;
const limit = () => DAILY_LIMIT;
const normalize = (row) => ({
  id: row.id,
  subject: row.subject,
  title: row.title,
  answer: row.answer,
  steps: JSON.parse(row.steps_json),
  note: row.note || "",
  favorite: Boolean(row.favorite),
  created: row.created_at
});

function auth(req, res, next) {
  try {
    const header = String(req.headers.authorization || "");
    const token = header.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Missing token");
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(payload.sub);
    if (!user) throw new Error("User not found");
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required." });
  }
}

function validImageData(value) {
  return typeof value === "string" && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
}

const SYSTEM = `You are Mathix, a rigorous AI tutor for mathematics, physics and chemistry.
Understand Arabic, English, mixed language, equations and OCR errors.
Solve carefully and verify the result. Never invent missing data.
For physics include givens, required, formula, substitution, units and answer.
For mathematics show transformations clearly.
For chemistry balance equations and verify atoms and charge.
If an image is unclear, explicitly say what is unreadable.
Return ONLY valid JSON with this exact shape:
{"subject":"math|physics|chemistry","title":"short title","answer":"final answer","steps":[{"title":"step title","explanation":"clear explanation","formula":"equation/calculation"}],"note":"verification/check"}`;

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "Mathix API" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Please enter a valid name." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email." });
    if (password.length < 8 || password.length > 200) return res.status(400).json({ error: "Password must be 8–200 characters." });
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email)) return res.status(409).json({ error: "Email is already registered." });
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)").run(name, email, hash);
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(result.lastInsertRowid);
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Invalid email or password." });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

app.get("/api/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.get("/api/dashboard", auth, (req, res) => {
  const u = req.user;
  const total = db.prepare("SELECT COUNT(*) AS c FROM solutions WHERE user_id=?").get(u.id).c;
  const favorites = db.prepare("SELECT COUNT(*) AS c FROM solutions WHERE user_id=? AND favorite=1").get(u.id).c;
  const today = db.prepare("SELECT COUNT(*) AS c FROM solutions WHERE user_id=? AND date(created_at)=date('now')").get(u.id).c;
  res.json({ user: publicUser(u), usage: { used: usedToday(u.id), limit: limit() }, stats: { totalSolved: total, favorites, today } });
});

app.get("/api/history", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM solutions WHERE user_id=? ORDER BY id DESC LIMIT 100").all(req.user.id);
  res.json({ history: rows.map(normalize) });
});

app.post("/api/solve", auth, async (req, res) => {
  try {
    const problem = String(req.body?.problem || "").trim();
    const subject = ["auto", "math", "physics", "chemistry"].includes(req.body?.subject) ? req.body.subject : "auto";
    const language = req.body?.language === "ar" ? "ar" : "en";
    const imageData = req.body?.imageData || null;

    if (!problem && !imageData) return res.status(400).json({ error: "Enter a problem or upload an image." });
    if (problem.length > 12000) return res.status(400).json({ error: "The problem text is too long." });
    if (imageData && (!validImageData(imageData) || imageData.length > MAX_IMAGE_BYTES * 1.4)) return res.status(400).json({ error: "Invalid or oversized image." });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server." });
    if (usedToday(req.user.id) >= limit()) return res.status(429).json({ error: `Daily limit reached. Please try again tomorrow.` });

    const content = [{
      type: "input_text",
      text: `Subject: ${subject}\nAnswer in ${language === "ar" ? "Arabic" : "English"}.\nProblem:\n${problem || "(The problem is in the image.)"}`
    }];
    if (imageData) content.push({ type: "input_image", image_url: imageData });

    const response = await ai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: SYSTEM,
      input: [{ role: "user", content }],
      text: { format: { type: "json_object" } }
    });

    const raw = JSON.parse(response.output_text || "{}");
    if (!raw.subject || !raw.title || !raw.answer || !Array.isArray(raw.steps)) throw new Error("The AI returned an incomplete solution.");
    raw.steps = raw.steps.map((s) => ({ title: String(s.title || "Step"), explanation: String(s.explanation || ""), formula: String(s.formula || "") }));

    const insert = db.prepare("INSERT INTO solutions(user_id,subject,title,answer,steps_json,note) VALUES(?,?,?,?,?,?)");
    const usageInsert = db.prepare(`INSERT INTO usage_daily(user_id,day,count) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET count=count+1`);
    const transaction = db.transaction(() => {
      const result = insert.run(req.user.id, String(raw.subject), String(raw.title), String(raw.answer), JSON.stringify(raw.steps), String(raw.note || ""));
      usageInsert.run(req.user.id, day());
      return result.lastInsertRowid;
    });
    const id = transaction();
    const row = db.prepare("SELECT * FROM solutions WHERE id=? AND user_id=?").get(id, req.user.id);
    res.json({ solution: normalize(row), usage: { used: usedToday(req.user.id), limit: limit() } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error?.message || "Unable to solve the problem." });
  }
});

app.post("/api/solutions/:id/favorite", auth, (req, res) => {
  const row = db.prepare("SELECT * FROM solutions WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "Solution not found." });
  const favorite = row.favorite ? 0 : 1;
  db.prepare("UPDATE solutions SET favorite=? WHERE id=? AND user_id=?").run(favorite, row.id, req.user.id);
  res.json({ favorite: Boolean(favorite) });
});

if (JWT_SECRET === "change-this-secret-before-production") console.warn("WARNING: Set a strong JWT_SECRET in .env before production.");
app.listen(PORT, () => console.log(`Mathix running at http://localhost:${PORT}`));
