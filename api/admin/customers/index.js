import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        if (req.method === "GET") {
            const customers = await sql`
                SELECT id, name, email, phone, role, created_at
                FROM users
                WHERE role = 'customer'
                ORDER BY created_at DESC
                LIMIT 200
            `;

            return res.status(200).json({ success: true, customers });
        }

        if (req.method === "DELETE") {
            const customerId = String(req.query?.id || "").trim();

            if (!customerId) {
                return res.status(400).json({ success: false, message: "Customer id is required" });
            }

            const customer = await sql`
                SELECT id, name, email
                FROM users
                WHERE id = ${customerId} AND role = 'customer'
                LIMIT 1
            `;

            if (!customer.length) {
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            await sql`
                DELETE FROM order_items
                WHERE order_id IN (
                    SELECT id
                    FROM orders
                    WHERE user_id = ${customerId}
                )
            `;

            await sql`
                DELETE FROM orders
                WHERE user_id = ${customerId}
            `;

            const deleted = await sql`
                DELETE FROM users
                WHERE id = ${customerId} AND role = 'customer'
                RETURNING id, name, email
            `;

            if (!deleted.length) {
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Customer deleted",
                customer: deleted[0]
            });
        }

        return res.status(405).json({ success: false, message: "Method not allowed" });
    } catch (error) {
        console.error("ADMIN CUSTOMERS ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to process customer request" });
    }
}
