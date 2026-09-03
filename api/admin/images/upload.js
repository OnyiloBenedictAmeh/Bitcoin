import { put } from "@vercel/blob";
import Busboy from "busboy";
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
         * PARSE MULTIPART REQUEST
         * ==========================
         */

        const file = await parseMultipart(req);


        /*
         * ==========================
         * VALIDATE FILE
         * ==========================
         */

        if (!file) {

            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });

        }


        if (!ALLOWED_TYPES.has(file.mimeType)) {

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

        const originalName =
            file.originalName || "image.jpg";

        const extension =
            originalName
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
                file.buffer,
                {
                    access: "public",
                    addRandomSuffix: true,
                    contentType: file.mimeType
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

                url:
                    blob.url,

                pathname:
                    blob.pathname,

                contentType:
                    file.mimeType,

                size:
                    file.size,

                originalName:
                    originalName

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


/*
 * ========================================
 * MULTIPART FORM PARSER
 * ========================================
 */

function parseMultipart(req) {

    return new Promise((resolve, reject) => {

        let uploadedFile = null;

        let fileTooLarge = false;

        const busboy =
            Busboy({
                headers: req.headers,

                limits: {
                    files: 1,
                    fileSize: MAX_FILE_SIZE
                }
            });


        busboy.on(
            "file",
            (
                fieldname,
                file,
                info
            ) => {

                const {
                    filename,
                    mimeType
                } = info;


                /*
                 * Only accept the field named "file"
                 */

                if (fieldname !== "file") {

                    file.resume();

                    return;

                }


                const chunks = [];

                let totalSize = 0;


                file.on(
                    "data",
                    chunk => {

                        totalSize +=
                            chunk.length;

                        chunks.push(chunk);

                    }
                );


                file.on(
                    "limit",
                    () => {

                        fileTooLarge = true;

                    }
                );


                file.on(
                    "end",
                    () => {

                        if (fileTooLarge) {
                            return;
                        }


                        uploadedFile = {

                            buffer:
                                Buffer.concat(
                                    chunks
                                ),

                            originalName:
                                filename,

                            mimeType:
                                mimeType,

                            size:
                                totalSize

                        };

                    }
                );

            }
        );


        busboy.on(
            "finish",
            () => {

                if (fileTooLarge) {

                    reject(
                        new Error(
                            "Image is too large. Maximum size is 8 MB."
                        )
                    );

                    return;

                }

                resolve(
                    uploadedFile
                );

            }
        );


        busboy.on(
            "error",
            error => {

                reject(error);

            }
        );


        req.pipe(busboy);

    });

}