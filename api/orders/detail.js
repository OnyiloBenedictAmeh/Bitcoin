import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
    const customer = await requireCustomer(req, res);
    if (!customer) return;
    const id = String(req.query?.id || "");
    if (!id) return res.status(400).json({ success: false, message: "Order ID is required" });
    try {
        const orders = await sql`
            SELECT id, status, subtotal, shipping, total, payment_status, payment_method, payment_reference,
                   bitcoin_amount, created_at, customer_name, customer_email, customer_phone, shipping_address
            FROM orders WHERE id = ${id} AND user_id = ${customer.id} LIMIT 1
        `;
        if (!orders.length) return res.status(404).json({ success: false, message: "Order not found" });
        const items = await sql`SELECT product_id, product_name, quantity, price FROM order_items WHERE order_id = ${id} ORDER BY created_at`;
        return res.status(200).json({ success: true, order: { ...orders[0], items } });
    } catch (error) {
        console.error("ORDER DETAIL ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to load order" });
    }
}
