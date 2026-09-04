import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);

function isProductBlobUrl(value) {
    try {
        return new URL(value).pathname.includes("/products/");
    } catch {
        return false;
    }
}

export default async function handler(req, res) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const urls = [...new Set(req.body?.urls || [])]
        .filter(url => typeof url === "string" && isProductBlobUrl(url))
        .slice(0, 20);

    if (!urls.length) {
        return res.status(200).json({ success: true, deleted: 0, skipped: 0 });
    }

    try {
        const referenced = await sql`
            SELECT image_url FROM product_images WHERE image_url = ANY(${urls})
        `;
        const referencedUrls = new Set(referenced.map(image => image.image_url));
        const orphanUrls = urls.filter(url => !referencedUrls.has(url));
        const results = await Promise.allSettled(orphanUrls.map(url => del(url)));

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error("ORPHAN IMAGE DELETE ERROR:", orphanUrls[index], result.reason);
            }
        });

        return res.status(200).json({
            success: true,
            deleted: results.filter(result => result.status === "fulfilled").length,
            skipped: urls.length - orphanUrls.length
        });
    } catch (error) {
        console.error("ORPHAN IMAGE CLEANUP ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to clean up images" });
    }
}
