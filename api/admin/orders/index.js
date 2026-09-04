import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);
const ORDER_STATUSES = new Set(['pending', 'processing', 'fulfilled', 'cancelled']);
const PAYMENT_STATUSES = new Set(['pending', 'submitted', 'confirmed', 'failed', 'refunded']);

export default async function handler(req, res) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
        if (req.method === 'GET') {
            const orders = await sql`
                SELECT id, user_id, status, subtotal, shipping, total, payment_status, payment_method,
                       payment_reference, bitcoin_txid, customer_name, customer_email, created_at
                FROM orders ORDER BY created_at DESC LIMIT 200
            `;
            return res.status(200).json({ success: true, orders });
        }
        if (req.method === 'PATCH') {
            const id = String(req.query?.id || '');
            const status = req.body?.status;
            const paymentStatus = req.body?.payment_status;
            if (!id || (status !== undefined && !ORDER_STATUSES.has(status)) || (paymentStatus !== undefined && !PAYMENT_STATUSES.has(paymentStatus))) {
                return res.status(400).json({ success: false, message: 'Invalid order update' });
            }
            const rows = await sql`
                UPDATE orders SET status = COALESCE(${status || null}, status), payment_status = COALESCE(${paymentStatus || null}, payment_status), updated_at = NOW()
                WHERE id = ${id}
                RETURNING id, status, payment_status, updated_at
            `;
            if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
            return res.status(200).json({ success: true, order: rows[0] });
        }
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    } catch (error) {
        console.error('ADMIN ORDERS ERROR:', error);
        return res.status(500).json({ success: false, message: 'Unable to process order request' });
    }
}
