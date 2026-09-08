import { neon } from "@neondatabase/serverless";
import { requireCustomer } from "../_lib/requireCustomer.js";

const sql = neon(process.env.DATABASE_URL);

async function list(userId) {
    const rows = await sql`
        SELECT ci.id AS "cartItemId", ci.product_id AS id, ci.quantity, ci.options,
               p.name, p.price, p.stock, p.images
        FROM cart_items ci JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ${userId} AND p.status = 'active' ORDER BY ci.created_at
    `;
    return rows.map(row => ({ ...row, price: Number(row.price), quantity: Number(row.quantity), stock: Number(row.stock), image: row.images?.[0]?.url || row.images?.[0] || "", options: row.options || {} }));
}

export default async function handler(req, res) {
    const customer = await requireCustomer(req, res);
    if (!customer) return;
    try {
        if (req.method === "GET") return res.status(200).json({ success: true, items: await list(customer.id) });
        if (req.method === "POST") {
            const productId = String(req.body?.productId || "");
            const quantity = Number(req.body?.quantity);
            const options = req.body?.options && typeof req.body.options === "object" ? req.body.options : {};
            if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ success: false, message: "A valid product and quantity are required" });
            const product = (await sql`SELECT id, stock, status FROM products WHERE id = ${productId} LIMIT 1`)[0];
            if (!product || product.status !== "active" || Number(product.stock) < quantity) return res.status(409).json({ success: false, message: "This product is unavailable in the requested quantity" });
            const serialized = JSON.stringify(options);
            const current = (await sql`SELECT id, quantity FROM cart_items WHERE user_id = ${customer.id} AND product_id = ${productId} AND options = ${serialized}::jsonb LIMIT 1`)[0];
            if (current) await sql`UPDATE cart_items SET quantity = ${Math.min(Number(product.stock), Number(current.quantity) + quantity)}, updated_at = NOW() WHERE id = ${current.id}`;
            else await sql`INSERT INTO cart_items (user_id, product_id, quantity, options) VALUES (${customer.id}, ${productId}, ${quantity}, ${serialized}::jsonb)`;
            return res.status(200).json({ success: true, items: await list(customer.id) });
        }
        if (req.method === "PATCH") {
            const cartItemId = String(req.body?.cartItemId || ""); const quantity = Number(req.body?.quantity);
            if (!cartItemId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ success: false, message: "A valid cart item and quantity are required" });
            const changed = await sql`UPDATE cart_items ci SET quantity = ${quantity}, updated_at = NOW() FROM products p WHERE ci.id = ${cartItemId} AND ci.user_id = ${customer.id} AND p.id = ci.product_id AND p.stock >= ${quantity} RETURNING ci.id`;
            if (!changed.length) return res.status(409).json({ success: false, message: "The requested quantity is unavailable" });
            return res.status(200).json({ success: true, items: await list(customer.id) });
        }
        if (req.method === "DELETE") {
            const cartItemId = String(req.query?.id || "");
            if (req.query?.all === "true") {
                await sql`DELETE FROM cart_items WHERE user_id = ${customer.id}`;
                return res.status(200).json({ success: true, items: [] });
            }
            if (!cartItemId) return res.status(400).json({ success: false, message: "Cart item ID is required" });
            await sql`DELETE FROM cart_items WHERE id = ${cartItemId} AND user_id = ${customer.id}`;
            return res.status(200).json({ success: true, items: await list(customer.id) });
        }
        return res.status(405).json({ success: false, message: "Method not allowed" });
    } catch (error) { console.error("CART ERROR:", error); return res.status(500).json({ success: false, message: "Unable to update cart" }); }
}
