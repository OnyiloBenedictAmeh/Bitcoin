import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);


/*
========================================
HELPERS
========================================
*/

function sendError(res, status, message) {

    return res.status(status).json({
        success: false,
        message
    });

}


function makeSlug(value) {

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


function parseBoolean(value) {

    if (typeof value === "boolean") {
        return value;
    }

    if (
        value === "true" ||
        value === "1"
    ) {
        return true;
    }

    return false;

}


function parseNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


/*
========================================
GET PRODUCTS
========================================
*/

async function getProducts(req, res) {

    const products = await sql`
        SELECT
            p.id,
            p.name,
            p.slug,
            p.description,
            p.category_id,
            p.price,
            p.compare_price,
            p.stock,
            p.sku,
            p.brand,
            p.featured,
            p.status,
            p.created_at,
            p.updated_at,

            c.name AS category,
            c.slug AS category_slug,

            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', pi.id,
                            'url', pi.image_url,
                            'alt', pi.alt_text,
                            'sortOrder', pi.sort_order
                        )
                        ORDER BY pi.sort_order ASC
                    )
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                ),
                '[]'::json
            ) AS images

        FROM products p

        LEFT JOIN categories c
            ON c.id = p.category_id

        ORDER BY p.created_at DESC
    `;


    return res.status(200).json({

        success: true,

        products

    });

}


/*
========================================
CREATE PRODUCT
========================================
*/

async function createProduct(req, res) {

    const body =
        req.body || {};


    const name =
        String(body.name || "").trim();

    const description =
        String(
            body.description || ""
        ).trim();

    const categoryId =
        body.category_id || null;

    const price =
        parseNumber(body.price);

    const comparePrice =
        body.compare_price === "" ||
        body.compare_price === null ||
        body.compare_price === undefined
            ? null
            : parseNumber(
                body.compare_price
            );

    const stock =
        parseNumber(body.stock);

    const sku =
        String(body.sku || "").trim() ||
        null;

    const brand =
        String(body.brand || "").trim() ||
        null;

    const featured =
        parseBoolean(body.featured);

    const status = body.status === "inactive" ? "inactive" : "active";


    /*
    ----------------------------------------
    VALIDATION
    ----------------------------------------
    */

    if (!name) {

        return sendError(
            res,
            400,
            "Product name is required"
        );

    }


    if (
        price === null ||
        price < 0
    ) {

        return sendError(
            res,
            400,
            "A valid product price is required"
        );

    }


    if (
        stock === null ||
        stock < 0 ||
        !Number.isInteger(stock)
    ) {

        return sendError(
            res,
            400,
            "Stock must be a whole number"
        );

    }


    if (
        comparePrice !== null &&
        (
            comparePrice < 0 ||
            comparePrice < price
        )
    ) {

        return sendError(
            res,
            400,
            "Compare price must be greater than or equal to price"
        );

    }


    const slug =
        makeSlug(name);


    if (!slug) {

        return sendError(
            res,
            400,
            "Unable to generate product slug"
        );

    }


    try {

        /*
        ----------------------------------------
        CHECK SLUG
        ----------------------------------------
        */

        const existingSlug =
            await sql`
                SELECT id
                FROM products
                WHERE slug = ${slug}
                LIMIT 1
            `;


        if (existingSlug.length) {

            return sendError(
                res,
                409,
                "A product with this name already exists"
            );

        }


        /*
        ----------------------------------------
        CHECK SKU
        ----------------------------------------
        */

        if (sku) {

            const existingSku =
                await sql`
                    SELECT id
                    FROM products
                    WHERE sku = ${sku}
                    LIMIT 1
                `;


            if (existingSku.length) {

                return sendError(
                    res,
                    409,
                    "A product with this SKU already exists"
                );

            }

        }


        /*
        ----------------------------------------
        CREATE PRODUCT
        ----------------------------------------
        */

        const products =
            await sql`
                INSERT INTO products (
                    name,
                    slug,
                    description,
                    category_id,
                    price,
                    compare_price,
                    stock,
                    sku,
                    brand,
                    featured,
                    status
                )

                VALUES (
                    ${name},
                    ${slug},
                    ${description || null},
                    ${categoryId},
                    ${price},
                    ${comparePrice},
                    ${stock},
                    ${sku},
                    ${brand},
                    ${featured},
                    ${status}
                )

                RETURNING
                    id,
                    name,
                    slug,
                    description,
                    category_id,
                    price,
                    compare_price,
                    stock,
                    sku,
                    brand,
                    featured,
                    status,
                    created_at,
                    updated_at
            `;


        return res.status(201).json({

            success: true,

            message:
                "Product created successfully",

            product:
                products[0]

        });


    } catch (error) {

        console.error(
            "CREATE PRODUCT ERROR:",
            error
        );


        return sendError(
            res,
            500,
            "Unable to create product"
        );

    }

}


/*
========================================
UPDATE PRODUCT
========================================
*/

async function updateProduct(req, res) {

    const id =
        req.query?.id;


    if (!id) {

        return sendError(
            res,
            400,
            "Product ID is required"
        );

    }


    const body =
        req.body || {};


    try {

        const existing =
            await sql`
                SELECT *
                FROM products
                WHERE id = ${id}
                LIMIT 1
            `;


        if (!existing.length) {

            return sendError(
                res,
                404,
                "Product not found"
            );

        }


        const current =
            existing[0];


        const name =
            body.name !== undefined
                ? String(body.name).trim()
                : current.name;


        const description =
            body.description !== undefined
                ? String(body.description).trim()
                : current.description;


        const categoryId =
            body.category_id !== undefined
                ? body.category_id || null
                : current.category_id;


        const price =
            body.price !== undefined
                ? parseNumber(body.price)
                : Number(current.price);


        const comparePrice =
            body.compare_price !== undefined
                ? (
                    body.compare_price === "" ||
                    body.compare_price === null
                        ? null
                        : parseNumber(
                            body.compare_price
                        )
                )
                : current.compare_price;


        const stock =
            body.stock !== undefined
                ? parseNumber(body.stock)
                : Number(current.stock);


        const sku =
            body.sku !== undefined
                ? String(body.sku).trim() || null
                : current.sku;


        const brand =
            body.brand !== undefined
                ? String(body.brand).trim() || null
                : current.brand;


        const featured =
            body.featured !== undefined
                ? parseBoolean(body.featured)
                : current.featured;


        const status =
            body.status !== undefined
                ? String(body.status)
                : current.status;

        if (!["active", "inactive"].includes(status)) {
            return sendError(res, 400, "Product status must be active or inactive");
        }


        if (!name) {

            return sendError(
                res,
                400,
                "Product name is required"
            );

        }


        if (
            price === null ||
            price < 0
        ) {

            return sendError(
                res,
                400,
                "Invalid product price"
            );

        }


        if (
            stock === null ||
            stock < 0 ||
            !Number.isInteger(stock)
        ) {

            return sendError(
                res,
                400,
                "Stock must be a whole number"
            );

        }


        if (
            comparePrice !== null &&
            (
                comparePrice < 0 ||
                comparePrice < price
            )
        ) {

            return sendError(
                res,
                400,
                "Compare price must be greater than or equal to price"
            );

        }


        const slug =
            body.name !== undefined
                ? makeSlug(name)
                : current.slug;


        if (!slug) {

            return sendError(
                res,
                400,
                "Invalid product name"
            );

        }


        /*
        ----------------------------------------
        SLUG CONFLICT
        ----------------------------------------
        */

        const slugConflict =
            await sql`
                SELECT id
                FROM products
                WHERE slug = ${slug}
                AND id <> ${id}
                LIMIT 1
            `;


        if (slugConflict.length) {

            return sendError(
                res,
                409,
                "Another product already uses this name"
            );

        }


        /*
        ----------------------------------------
        SKU CONFLICT
        ----------------------------------------
        */

        if (sku) {

            const skuConflict =
                await sql`
                    SELECT id
                    FROM products
                    WHERE sku = ${sku}
                    AND id <> ${id}
                    LIMIT 1
                `;


            if (skuConflict.length) {

                return sendError(
                    res,
                    409,
                    "Another product already uses this SKU"
                );

            }

        }


        /*
        ----------------------------------------
        UPDATE
        ----------------------------------------
        */

        const products =
            await sql`
                UPDATE products

                SET
                    name = ${name},
                    slug = ${slug},
                    description = ${description || null},
                    category_id = ${categoryId},
                    price = ${price},
                    compare_price = ${comparePrice},
                    stock = ${stock},
                    sku = ${sku},
                    brand = ${brand},
                    featured = ${featured},
                    status = ${status},
                    updated_at = NOW()

                WHERE id = ${id}

                RETURNING
                    id,
                    name,
                    slug,
                    description,
                    category_id,
                    price,
                    compare_price,
                    stock,
                    sku,
                    brand,
                    featured,
                    status,
                    created_at,
                    updated_at
            `;


        return res.status(200).json({

            success: true,

            message:
                "Product updated successfully",

            product:
                products[0]

        });


    } catch (error) {

        console.error(
            "UPDATE PRODUCT ERROR:",
            error
        );


        return sendError(
            res,
            500,
            "Unable to update product"
        );

    }

}


/*
========================================
DELETE / DEACTIVATE PRODUCT
========================================
*/

async function deleteProduct(req, res) {

    const id =
        req.query?.id;


    if (!id) {

        return sendError(
            res,
            400,
            "Product ID is required"
        );

    }


    try {

        const products =
            await sql`
                UPDATE products

                SET
                    status = 'inactive',
                    updated_at = NOW()

                WHERE id = ${id}

                RETURNING
                    id,
                    name,
                    status
            `;


        if (!products.length) {

            return sendError(
                res,
                404,
                "Product not found"
            );

        }


        return res.status(200).json({

            success: true,

            message:
                "Product deactivated successfully",

            product:
                products[0]

        });


    } catch (error) {

        console.error(
            "DELETE PRODUCT ERROR:",
            error
        );


        return sendError(
            res,
            500,
            "Unable to deactivate product"
        );

    }

}


/*
========================================
MAIN HANDLER
========================================
*/

export default async function handler(req, res) {

    /*
    ----------------------------------------
    ADMIN AUTHENTICATION
    ----------------------------------------
    */

    const admin =
        await requireAdmin(
            req,
            res
        );


    if (!admin) {
        return;
    }


    /*
    ----------------------------------------
    ROUTING
    ----------------------------------------
    */

    try {

        switch (req.method) {

            case "GET":

                return await getProducts(
                    req,
                    res
                );


            case "POST":

                return await createProduct(
                    req,
                    res
                );


            case "PATCH":

            case "PUT":

                return await updateProduct(
                    req,
                    res
                );


            case "DELETE":

                return await deleteProduct(
                    req,
                    res
                );


            default:

                return sendError(
                    res,
                    405,
                    "Method not allowed"
                );

        }

    } catch (error) {

        console.error(
            "ADMIN PRODUCTS API ERROR:",
            error
        );


        return sendError(
            res,
            500,
            "Unable to process product request"
        );

    }

}
