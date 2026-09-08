import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";
import { rateLimit } from "../_lib/rateLimit.js";

const sql = neon(process.env.DATABASE_URL);

function siteUrl(req) {
    const configured = String(process.env.APP_URL || "").replace(/\/$/, "");
    if (configured) return configured;
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const host = req.headers.host;
    return host ? `${forwardedProto}://${host}` : "http://localhost:3000";
}

function addField(fields, key, value) {
    fields.set(key, String(value));
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
    if (!rateLimit(req, res, { limit: 10, windowMs: 60_000 })) return;
    const customer = await requireCustomer(req, res);
    if (!customer) return;
    const secret = String(process.env.STRIPE_SECRET_KEY || "");
    if (!secret || !secret.startsWith("sk_")) {
        return res.status(503).json({ success: false, message: "Card payments are not configured yet" });
    }

    const orderId = String(req.body?.orderId || "");
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID is required" });

    try {
        const orders = await sql`
            SELECT id, total, payment_status, payment_method, customer_email
            FROM orders
            WHERE id = ${orderId} AND user_id = ${customer.id}
            LIMIT 1
        `;
        const order = orders[0];
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.payment_method !== "card") return res.status(400).json({ success: false, message: "Order is not configured for card payment" });
        if (order.payment_status !== "pending") return res.status(409).json({ success: false, message: "This order is no longer payable" });

        const items = await sql`
            SELECT product_name, quantity, price
            FROM order_items WHERE order_id = ${orderId} ORDER BY created_at
        `;
        if (!items.length) return res.status(400).json({ success: false, message: "Order has no items" });

        const fields = new URLSearchParams();
        addField(fields, "mode", "payment");
        addField(fields, "customer_email", order.customer_email);
        addField(fields, "success_url", `${siteUrl(req)}/card-payment.html?id=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`);
        addField(fields, "cancel_url", `${siteUrl(req)}/card-payment.html?id=${encodeURIComponent(orderId)}`);
        addField(fields, "metadata[order_id]", orderId);
        items.forEach((item, index) => {
            addField(fields, `line_items[${index}][quantity]`, item.quantity);
            addField(fields, `line_items[${index}][price_data][currency]`, "usd");
            addField(fields, `line_items[${index}][price_data][unit_amount]`, Math.round(Number(item.price) * 100));
            addField(fields, `line_items[${index}][price_data][product_data][name]`, item.product_name);
        });

        const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: fields
        });
        const session = await stripeResponse.json();
        if (!stripeResponse.ok || !session.id || !session.url) {
            console.error("STRIPE CHECKOUT ERROR:", session);
            return res.status(502).json({ success: false, message: "Unable to start secure card checkout" });
        }
        await sql`UPDATE orders SET stripe_session_id = ${session.id}, payment_reference = ${session.id} WHERE id = ${orderId} AND payment_status = 'pending'`;
        return res.status(200).json({ success: true, url: session.url, sessionId: session.id });
    } catch (error) {
        console.error("CHECKOUT SESSION ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to start secure card checkout" });
    }
}
