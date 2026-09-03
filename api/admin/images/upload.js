import { put } from "@vercel/blob";
import { requireAdmin } from "../../_lib/requireAdmin.js";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]);

export default async function handler(req, res) {

    /*
     * ==========================
     * ADMIN AUTHENTICATION
     * ==========================
     */

    const admin = await requireAdmin(req, res);

    if (!admin) {
        return;
    }


    /*
     * ==========================
     * METHOD CHECK
     * ==========================
     */

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    /*
     * ==========================
     * VALIDATE BLOB TOKEN
     * ==========================
     */

    if (!process.env.BLOB_READ_WRITE_TOKEN) {

        console.error(
            "BLOB_READ_WRITE_TOKEN is missing"
        );

        return res.status(500).json({
            success: false,
            message: "Image storage is not configured"
        });

    }


    try {

        /*
         * ==========================
         * READ MULTIPART FORM
         * ==========================
         */

        const formData =
            await req.formData();

        const file =
            formData.get("file");


        /*
         * ==========================
         * VALIDATE FILE
         * ==========================
         */

        if (!file || typeof file === "string") {

            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });

        }


        if (!ALLOWED_TYPES.has(file.type)) {

            return res.status(400).json({
                success: false,
                message:
                    "Unsupported image type. Use JPG, PNG, WebP, or GIF."
            });

        }


        if (file.size > MAX_FILE_SIZE) {

            return res.status(400).json({
                success: false,
                message:
                    "Image is too large. Maximum size is 8 MB."
            });

        }


        if (file.size === 0) {

            return res.status(400).json({
                success: false,
                message: "The uploaded image is empty"
            });

        }


        /*
         * ==========================
         * CREATE SAFE FILE PATH
         * ==========================
         */

        const extension =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase() || "jpg";

        const timestamp =
            Date.now();

        const random =
            Math.random()
                .toString(36)
                .slice(2, 10);

        const pathname =
            `products/${timestamp}-${random}.${extension}`;


        /*
         * ==========================
         * UPLOAD TO VERCEL BLOB
         * ==========================
         */

        const blob =
            await put(
                pathname,
                file,
                {
                    access: "public",
                    addRandomSuffix: true,
                    contentType: file.type
                }
            );


        /*
         * ==========================
         * RESPONSE
         * ==========================
         */

        return res.status(201).json({

            success: true,

            message:
                "Image uploaded successfully",

            image: {

                url: blob.url,

                pathname: blob.pathname,

                contentType: file.type,

                size: file.size,

                originalName: file.name

            }

        });

    } catch (error) {

        console.error(
            "IMAGE UPLOAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to upload image"
        });

    }

}