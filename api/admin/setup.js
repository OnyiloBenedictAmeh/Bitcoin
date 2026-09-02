import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {

    // Only allow POST
    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }

    try {

        // ========================================
        // VERIFY SETUP SECRET
        // ========================================

        const setupSecret =
            req.headers["x-admin-setup-secret"];

        if (
            !setupSecret ||
            setupSecret !==
                process.env.ADMIN_SETUP_SECRET
        ) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        // ========================================
        // READ REQUEST BODY
        // ========================================

        const {
            name,
            email,
            password
        } = req.body || {};


        // ========================================
        // VALIDATE INPUT
        // ========================================

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        if (
            !normalizedEmail.includes("@")
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid email address"
            });

        }


        if (
            String(password).length < 8
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters"
            });

        }


        // ========================================
        // CHECK EXISTING USER
        // ========================================

        const existingUser =
            await sql`
                SELECT id
                FROM users
                WHERE email = ${normalizedEmail}
                LIMIT 1
            `;


        if (existingUser.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "A user with this email already exists"
            });

        }


        // ========================================
        // HASH PASSWORD
        // ========================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        // ========================================
        // CREATE ADMIN
        // ========================================

        const result =
            await sql`
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    role
                )
                VALUES (
                    ${String(name).trim()},
                    ${normalizedEmail},
                    ${passwordHash},
                    'admin'
                )
                RETURNING
                    id,
                    name,
                    email,
                    role,
                    created_at
            `;


        // ========================================
        // SUCCESS
        // ========================================

        return res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            user: result[0]
        });


    } catch (error) {

        console.error(
            "ADMIN SETUP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create admin account"
        });

    }

}