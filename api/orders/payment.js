import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
    const customer = await requireCustomer(req, res, { optional: true });
    const orderId = String(req.body?.orderId || "");
    const txid = String(req.body?.txid || "").trim();
    if (!orderId || !/^[a-fA-F0-9]{64}$/.test(txid)) {
        return res.status(400).json({ success: false, message: "A valid Bitcoin transaction ID is required" });
    }
    try {
        const orders = customer
            ? await sql`SELECT id FROM orders WHERE id = ${orderId} AND user_id = ${customer.id} LIMIT 1`
            : await sql`SELECT id FROM orders WHERE id = ${orderId} LIMIT 1`;
        if (!orders.length) return res.status(404).json({ success: false, message: "Order not found" });
        const updated = await sql`
            UPDATE orders SET bitcoin_txid = ${txid}, payment_status = 'submitted', updated_at = NOW()
            WHERE id = ${orderId} AND payment_status IN ('pending', 'submitted')
            RETURNING id, payment_status, payment_reference
        `;
        if (!updated.length) return res.status(409).json({ success: false, message: "Payment can no longer be updated" });
        return res.status(200).json({ success: true, order: updated[0] });
    } catch (error) {
        console.error("BITCOIN PAYMENT ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to submit payment" });
    }
}
