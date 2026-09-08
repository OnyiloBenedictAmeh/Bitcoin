import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
    const customer = await requireCustomer(req, res);
    if (!customer) return;
    const sessionId = String(req.query?.session_id || "");
    const orderId = String(req.query?.id || "");
    const secret = String(process.env.STRIPE_SECRET_KEY || "");
    if (!sessionId || !orderId || !secret.startsWith("sk_")) return res.status(400).json({ success: false, message: "Payment session is invalid" });
    try {
        const orders = await sql`SELECT id, total, payment_status FROM orders WHERE id = ${orderId} AND user_id = ${customer.id} AND stripe_session_id = ${sessionId} LIMIT 1`;
        if (!orders.length) return res.status(404).json({ success: false, message: "Order not found" });
        const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${secret}` } });
        const session = await stripeResponse.json();
        if (!stripeResponse.ok || session.metadata?.order_id !== orderId) return res.status(502).json({ success: false, message: "Unable to verify payment" });
        const paid = session.payment_status === "paid";
        if (paid && orders[0].payment_status !== "paid") {
            await sql`UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ${orderId} AND user_id = ${customer.id} AND payment_status = 'pending'`;
        }
        return res.status(200).json({ success: true, paid, orderId });
    } catch (error) {
        console.error("STRIPE VERIFY ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to verify payment" });
    }
}
