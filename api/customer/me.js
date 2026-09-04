import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
    const session = await requireCustomer(req, res);
    if (!session) return;

    try {
        const users = await sql`
            SELECT id, name, email, role, created_at FROM users WHERE id = ${session.id} LIMIT 1
        `;
        if (!users.length) return res.status(404).json({ success: false, message: "Account not found" });
        return res.status(200).json({ success: true, user: users[0] });
    } catch (error) {
        console.error("CUSTOMER ME ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to load account" });
    }
}
