import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "../../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {

    const admin = await requireAdmin(req, res);

    if (!admin) {
        return;
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {

        const {
            productId,
            images
        } = req.body || {};

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        if (!Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: "Images must be an array"
            });
        }

        if (images.length > 20) {
            return res.status(400).json({
                success: false,
                message: "A product can have a maximum of 20 images"
            });
        }

        // Make sure the product exists
        const product = await sql`
            SELECT id
            FROM products
            WHERE id = ${productId}
            LIMIT 1
        `;

        if (product.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Validate images
        for (const image of images) {

            if (!image || !image.url) {
                return res.status(400).json({
                    success: false,
                    message: "Every image must have a URL"
                });
            }

            if (typeof image.url !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid image URL"
                });
            }
        }

        /*
         * Replace the product's image list.
         *
         * The first image gets sort_order 0,
         * second gets 1, etc.
         *
         * Therefore the first image is the
         * product's primary image.
         */

        await sql`
            DELETE FROM product_images
            WHERE product_id = ${productId}
        `;

        for (let index = 0; index < images.length; index++) {

            const image = images[index];

            await sql`
                INSERT INTO product_images (
                    product_id,
                    image_url,
                    alt_text,
                    sort_order
                )
                VALUES (
                    ${productId},
                    ${image.url},
                    ${image.altText || ""},
                    ${index}
                )
            `;
        }

        return res.status(200).json({
            success: true,
            message: "Product images saved successfully",
            count: images.length
        });

    } catch (error) {

        console.error(
            "PRODUCT IMAGES SAVE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to save product images"
        });
    }
}