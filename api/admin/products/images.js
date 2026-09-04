import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {

    /*
    ========================================
    ADMIN AUTHENTICATION
    ========================================
    */

    const admin = await requireAdmin(req, res);

    if (!admin) {
        return;
    }


    /*
    ========================================
    METHOD CHECK
    ========================================
    */

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    /*
    ========================================
    REQUEST
    ========================================
    */

    try {

        const {
            productId,
            images
        } = req.body || {};


        /*
        ========================================
        VALIDATE PRODUCT ID
        ========================================
        */

        if (!productId) {

            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });

        }


        /*
        ========================================
        VALIDATE IMAGES ARRAY
        ========================================
        */

        if (!Array.isArray(images)) {

            return res.status(400).json({
                success: false,
                message: "Images must be an array"
            });

        }


        if (images.length > 20) {

            return res.status(400).json({
                success: false,
                message:
                    "A product can have a maximum of 20 images"
            });

        }


        /*
        ========================================
        MAKE SURE PRODUCT EXISTS
        ========================================
        */

        const product =
            await sql`
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


        /*
        ========================================
        VALIDATE IMAGES
        ========================================
        */

        for (const image of images) {

            if (!image || !image.url) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Every image must have a URL"
                });

            }


            if (typeof image.url !== "string") {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid image URL"
                });

            }

        }


        /*
        ========================================
        GET CURRENT IMAGES
        ========================================
        
        We need the old URLs so we can determine
        which Blob files were removed.
        */

        const existingImages =
            await sql`
                SELECT image_url
                FROM product_images
                WHERE product_id = ${productId}
            `;


        const oldUrls =
            existingImages
                .map(image => image.image_url)
                .filter(Boolean);


        /*
        ========================================
        GET NEW IMAGE URLS
        ========================================
        */

        const newUrls = images.map(image => image.url).filter(Boolean);

        if (new Set(newUrls).size !== newUrls.length) {
            return res.status(400).json({
                success: false,
                message: "The same image cannot be added more than once"
            });
        }


        /*
        ========================================
        DETERMINE REMOVED IMAGES
        ========================================
        */

        const removedUrls =
            oldUrls.filter(
                oldUrl =>
                    !newUrls.includes(oldUrl)
            );


        /*
        ========================================
        REPLACE DATABASE IMAGE LIST
        ========================================
        
        First image = sort_order 0
        Therefore first image = primary.
        */

        await sql`
            DELETE FROM product_images
            WHERE product_id = ${productId}
        `;


        for (
            let index = 0;
            index < images.length;
            index++
        ) {

            const image =
                images[index];


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


        /*
        ========================================
        DELETE REMOVED BLOB FILES
        ========================================
        
        Database synchronization has succeeded,
        so now clean up Blob files that are no
        longer referenced by this product.
        */

        if (removedUrls.length) {

            const stillReferenced = await sql`
                SELECT image_url FROM product_images WHERE image_url = ANY(${removedUrls})
            `;
            const referencedUrls = new Set(
                stillReferenced.map(image => image.image_url)
            );
            const orphanUrls = removedUrls.filter(
                url => !referencedUrls.has(url)
            );
            const deletionResults = await Promise.allSettled(
                orphanUrls.map(url => del(url))
            );


            deletionResults.forEach(
                (result, index) => {

                    if (
                        result.status ===
                        "rejected"
                    ) {

                        console.error(
                            "BLOB DELETE ERROR:",
                            {
                                url:
                                    orphanUrls[index],

                                error:
                                    result.reason
                            }
                        );

                    }

                }
            );

        }


        /*
        ========================================
        RESPONSE
        ========================================
        */

        return res.status(200).json({

            success: true,

            message:
                "Product images saved successfully",

            count:
                images.length,

            deletedImages:
                removedUrls.length

        });

    } catch (error) {

        console.error(
            "PRODUCT IMAGES SAVE ERROR:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to save product images"
        });

    }

}
