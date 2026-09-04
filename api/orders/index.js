import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";
import { rateLimit } from "../_lib/rateLimit.js";

const sql = neon(process.env.DATABASE_URL);
const MAX_ITEMS = 50;

function customerDetails(body) {
    const customer = body?.customer || {};
    const name = `${String(customer.firstName || "").trim()} ${String(customer.lastName || "").trim()}`.trim();
    const email = String(customer.email || "").trim().toLowerCase();
    const address = {
        address: String(customer.address || "").trim(), city: String(customer.city || "").trim(),
        state: String(customer.state || "").trim(), postalCode: String(customer.postalCode || "").trim(),
        country: String(customer.country || "").trim()
    };
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !address.address || !address.city || !address.state || !address.country) return null;
    return { name, email, phone: String(customer.phone || "").trim(), address };
}

export default async function handler(req, res) {
    if (req.method === "GET") {
        const customer = await requireCustomer(req, res);
        if (!customer) return;
        try {
            const orders = await sql`
                SELECT id, status, subtotal, shipping, total, payment_status, payment_method, payment_reference, created_at
                FROM orders WHERE user_id = ${customer.id} ORDER BY created_at DESC
            `;
            return res.status(200).json({ success: true, orders });
        } catch (error) {
            console.error("ORDERS GET ERROR:", error);
            return res.status(500).json({ success: false, message: "Unable to load orders" });
        }
    }

    if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
    if (!rateLimit(req, res, { limit: 10, windowMs: 60_000 })) return;
    const customer = await requireCustomer(req, res, { optional: true });
    const details = customerDetails(req.body);
    const cart = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!details || !cart.length || cart.length > MAX_ITEMS) {
        return res.status(400).json({ success: false, message: "Valid customer information and cart items are required" });
    }

    try {
        const lines = [];
        for (const item of cart) {
            const quantity = Number(item.quantity);
            if (!item?.id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                return res.status(400).json({ success: false, message: "Cart contains an invalid quantity" });
            }
            const products = await sql`
                SELECT id, name, price, stock, status FROM products WHERE id = ${String(item.id)} LIMIT 1
            `;
            const product = products[0];
            if (!product || product.status !== "active" || Number(product.stock) < quantity) {
                return res.status(409).json({ success: false, message: "One or more items are unavailable" });
            }
            lines.push({ product, quantity });
        }

        const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
        const orders = await sql`
            INSERT INTO orders (user_id, status, subtotal, shipping, total, payment_status, payment_method, customer_name, customer_email, customer_phone, shipping_address)
            VALUES (${customer?.id || null}, 'pending', ${subtotal}, ${0}, ${subtotal}, 'pending', 'bitcoin', ${details.name}, ${details.email}, ${details.phone || null}, ${JSON.stringify(details.address)}::jsonb)
            RETURNING id, status, subtotal, shipping, total, payment_status, payment_method, created_at
        `;
        const order = orders[0];
        const reference = `BTC-${String(order.id).replaceAll("-", "").slice(0, 12).toUpperCase()}`;
        await sql`UPDATE orders SET payment_reference = ${reference} WHERE id = ${order.id}`;

        for (const line of lines) {
            const updated = await sql`
                UPDATE products SET stock = stock - ${line.quantity}, updated_at = NOW()
                WHERE id = ${line.product.id} AND stock >= ${line.quantity} RETURNING id
            `;
            if (!updated.length) throw new Error("Stock changed while creating the order");
            await sql`
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                VALUES (${order.id}, ${line.product.id}, ${line.product.name}, ${line.quantity}, ${line.product.price})
            `;
        }
        return res.status(201).json({ success: true, order: { ...order, payment_reference: reference } });
    } catch (error) {
        console.error("ORDER CREATE ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to create order" });
    }
}
