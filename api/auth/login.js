import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const sql = neon(process.env.DATABASE_URL);

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {

    // ========================================
    // METHOD
    // ========================================

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        // ========================================
        // CHECK JWT SECRET
        // ========================================

        if (!JWT_SECRET) {

            console.error(
                "JWT_SECRET is not configured"
            );

            return res.status(500).json({
                success: false,
                message: "Server authentication is not configured"
            });

        }


        // ========================================
        // READ BODY
        // ========================================

        const {
            email,
            password
        } = req.body || {};


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // ========================================
        // FIND USER
        // ========================================

        const users = await sql`
            SELECT
                id,
                name,
                email,
                password_hash,
                role
            FROM users
            WHERE email = ${normalizedEmail}
            LIMIT 1
        `;


        if (!users.length) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        const user = users[0];


        // ========================================
        // VERIFY PASSWORD
        // ========================================

        const passwordValid =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!passwordValid) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // ========================================
        // ADMIN CHECK
        // ========================================

        if (user.role !== "admin") {

            return res.status(403).json({
                success: false,
                message: "Administrator access required"
            });

        }


        // ========================================
        // CREATE SESSION TOKEN
        // ========================================

        const secret =
            new TextEncoder().encode(
                JWT_SECRET
            );


        const token =
            await new SignJWT({

                userId: user.id,
                role: user.role

            })
                .setProtectedHeader({
                    alg: "HS256"
                })
                .setIssuedAt()
                .setExpirationTime("7d")
                .sign(secret);


        // ========================================
        // SET SECURE COOKIE
        // ========================================

        res.setHeader(
            "Set-Cookie",
            `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
        );


        // ========================================
        // SUCCESS
        // ========================================

        return res.status(200).json({

            success: true,

            message: "Login successful",

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        });


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to login"
        });

    }

}