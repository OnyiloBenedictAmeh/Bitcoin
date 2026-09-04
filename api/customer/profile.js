import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    const customer = await requireCustomer(req, res);
    if (!customer) return;
    try {
        if (req.method === "GET") {
            const users = await sql`SELECT id, name, email, phone, created_at FROM users WHERE id = ${customer.id} LIMIT 1`;
            return users.length ? res.status(200).json({ success: true, user: users[0] }) : res.status(404).json({ success: false, message: "Account not found" });
        }
        if (req.method === "PATCH") {
            const name = String(req.body?.name || "").trim();
            const email = String(req.body?.email || "").trim().toLowerCase();
            const phone = String(req.body?.phone || "").trim() || null;
            if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: "Enter a valid name and email" });
            const duplicate = await sql`SELECT id FROM users WHERE email = ${email} AND id <> ${customer.id} LIMIT 1`;
            if (duplicate.length) return res.status(409).json({ success: false, message: "Another account uses this email" });
            const users = await sql`UPDATE users SET name = ${name}, email = ${email}, phone = ${phone}, updated_at = NOW() WHERE id = ${customer.id} RETURNING id, name, email, phone`;
            return res.status(200).json({ success: true, user: users[0] });
        }
        return res.status(405).json({ success: false, message: "Method not allowed" });
    } catch (error) {
        console.error("CUSTOMER PROFILE ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to update profile" });
    }
}
