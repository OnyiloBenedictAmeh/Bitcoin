import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {

    // Only allow GET
    if (req.method !== "GET") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }

    try {

        const products = await sql`
            SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.price,
                p.image_url,
                p.stock,
                p.status,
                p.featured,
                p.created_at,

                c.id AS category_id,
                c.name AS category,
                c.slug AS category_slug

            FROM products p

            LEFT JOIN categories c
                ON p.category_id = c.id

            WHERE p.status = 'active'

            ORDER BY p.created_at DESC
        `;


        return res.status(200).json({
            success: true,
            products
        });

    } catch (error) {

        console.error(
            "PRODUCT API ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load products"
        });

    }

}