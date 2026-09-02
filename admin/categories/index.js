import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const sql = neon(process.env.DATABASE_URL);

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default async function handler(req, res) {

    // =========================
    // ADMIN AUTH
    // =========================

    const admin = await requireAdmin(req, res);

    if (!admin) {
        return;
    }

    // =========================
    // GET CATEGORIES
    // =========================

    if (req.method === "GET") {

        try {

            const categories = await sql`
                SELECT
                    c.id,
                    c.name,
                    c.slug,
                    c.description,
                    c.created_at,
                    c.updated_at,

                    COUNT(p.id)::integer AS product_count

                FROM categories c

                LEFT JOIN products p
                    ON p.category_id = c.id

                GROUP BY
                    c.id,
                    c.name,
                    c.slug,
                    c.description,
                    c.created_at,
                    c.updated_at

                ORDER BY c.created_at DESC
            `;

            return res.status(200).json({
                success: true,
                categories
            });

        } catch (error) {

            console.error(
                "ADMIN CATEGORIES GET ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load categories"
            });
        }
    }

    // =========================
    // CREATE CATEGORY
    // =========================

    if (req.method === "POST") {

        try {

            const {
                name,
                description = ""
            } = req.body || {};

            if (!name || !name.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Category name is required"
                });
            }

            const cleanName = name.trim();
            const slug = slugify(cleanName);

            if (!slug) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid category name"
                });
            }

            // Check duplicate name
            const existingName = await sql`
                SELECT id
                FROM categories
                WHERE LOWER(name) = LOWER(${cleanName})
                LIMIT 1
            `;

            if (existingName.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "A category with this name already exists"
                });
            }

            // Check duplicate slug
            const existingSlug = await sql`
                SELECT id
                FROM categories
                WHERE slug = ${slug}
                LIMIT 1
            `;

            if (existingSlug.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "A category with this slug already exists"
                });
            }

            const result = await sql`
                INSERT INTO categories (
                    name,
                    slug,
                    description
                )
                VALUES (
                    ${cleanName},
                    ${slug},
                    ${description.trim()}
                )
                RETURNING
                    id,
                    name,
                    slug,
                    description,
                    created_at,
                    updated_at
            `;

            return res.status(201).json({
                success: true,
                message: "Category created successfully",
                category: result[0]
            });

        } catch (error) {

            console.error(
                "ADMIN CATEGORIES POST ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to create category"
            });
        }
    }

    // =========================
    // UPDATE CATEGORY
    // =========================

    if (req.method === "PATCH" || req.method === "PUT") {

        try {

            const { id } = req.query;

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message: "Category ID is required"
                });
            }

            const {
                name,
                description = ""
            } = req.body || {};

            if (!name || !name.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Category name is required"
                });
            }

            const cleanName = name.trim();
            const slug = slugify(cleanName);

            if (!slug) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid category name"
                });
            }

            // Check category exists
            const existingCategory = await sql`
                SELECT id
                FROM categories
                WHERE id = ${id}
                LIMIT 1
            `;

            if (existingCategory.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            // Check duplicate name
            const duplicateName = await sql`
                SELECT id
                FROM categories
                WHERE LOWER(name) = LOWER(${cleanName})
                AND id != ${id}
                LIMIT 1
            `;

            if (duplicateName.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "Another category already uses this name"
                });
            }

            // Check duplicate slug
            const duplicateSlug = await sql`
                SELECT id
                FROM categories
                WHERE slug = ${slug}
                AND id != ${id}
                LIMIT 1
            `;

            if (duplicateSlug.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "Another category already uses this slug"
                });
            }

            const result = await sql`
                UPDATE categories

                SET
                    name = ${cleanName},
                    slug = ${slug},
                    description = ${description.trim()},
                    updated_at = NOW()

                WHERE id = ${id}

                RETURNING
                    id,
                    name,
                    slug,
                    description,
                    created_at,
                    updated_at
            `;

            return res.status(200).json({
                success: true,
                message: "Category updated successfully",
                category: result[0]
            });

        } catch (error) {

            console.error(
                "ADMIN CATEGORIES UPDATE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to update category"
            });
        }
    }

    // =========================
    // DELETE CATEGORY
    // =========================

    if (req.method === "DELETE") {

        try {

            const { id } = req.query;

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message: "Category ID is required"
                });
            }

            // Check category exists
            const existingCategory = await sql`
                SELECT id
                FROM categories
                WHERE id = ${id}
                LIMIT 1
            `;

            if (existingCategory.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            // Prevent deleting categories that still contain products
            const products = await sql`
                SELECT COUNT(*)::integer AS count
                FROM products
                WHERE category_id = ${id}
            `;

            const productCount = products[0].count;

            if (productCount > 0) {

                return res.status(409).json({
                    success: false,
                    message:
                        `Cannot delete this category because it contains ${productCount} product${productCount === 1 ? "" : "s"}.`
                });
            }

            await sql`
                DELETE FROM categories
                WHERE id = ${id}
            `;

            return res.status(200).json({
                success: true,
                message: "Category deleted successfully"
            });

        } catch (error) {

            console.error(
                "ADMIN CATEGORIES DELETE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to delete category"
            });
        }
    }

    // =========================
    // METHOD NOT ALLOWED
    // =========================

    return res.status(405).json({
        success: false,
        message: "Method not allowed"
    });
}