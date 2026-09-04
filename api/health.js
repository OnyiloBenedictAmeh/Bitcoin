import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ ok: false, message: "Method not allowed" });
    const required = ["DATABASE_URL", "JWT_SECRET", "BLOB_READ_WRITE_TOKEN"];
    const missing = required.filter(name => !process.env[name]);
    if (missing.length) {
        console.error("HEALTH CHECK MISSING CONFIG:", missing);
        return res.status(503).json({ ok: false, message: "Service configuration incomplete" });
    }
    try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`SELECT 1 AS ok`;
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({ ok: true, service: "s-store" });
    } catch (error) {
        console.error("HEALTH CHECK DATABASE ERROR:", error);
        return res.status(503).json({ ok: false, message: "Database unavailable" });
    }
}
