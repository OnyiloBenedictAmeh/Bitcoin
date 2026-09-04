import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { rateLimit } from "../_lib/rateLimit.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
    if (!rateLimit(req, res, { limit: 5, windowMs: 60_000 })) return;

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        return res.status(400).json({ success: false, message: "Enter a name, valid email, and password of at least 8 characters" });
    }

    try {
        const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        if (existing.length) return res.status(409).json({ success: false, message: "An account already uses this email" });
        const passwordHash = await bcrypt.hash(password, 12);
        const users = await sql`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (${name}, ${email}, ${passwordHash}, 'customer')
            RETURNING id, name, email, role, created_at
        `;
        return res.status(201).json({ success: true, user: users[0] });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to create account" });
    }
}
