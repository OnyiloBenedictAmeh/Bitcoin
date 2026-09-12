import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        if (req.method !== "GET") {
            return res.status(405).json({ success: false, message: "Method not allowed" });
        }

        const customers = await sql`
            SELECT id, name, email, phone, role, created_at
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
            LIMIT 200
        `;

        return res.status(200).json({ success: true, customers });
    } catch (error) {
        console.error("ADMIN CUSTOMERS ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to load customers" });
    }
}
