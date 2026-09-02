import { neon } from "@neondatabase/serverless";
import { jwtVerify } from "jose";

const sql = neon(process.env.DATABASE_URL);

const JWT_SECRET = process.env.JWT_SECRET;


function getCookie(req, name) {

    const cookies = req.headers.cookie || "";

    const match = cookies
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${name}=`));

    if (!match) {
        return null;
    }

    return decodeURIComponent(
        match.substring(name.length + 1)
    );
}


export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    try {

        if (!JWT_SECRET) {

            console.error(
                "JWT_SECRET is not configured"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server authentication is not configured"
            });

        }


        const token =
            getCookie(
                req,
                "admin_session"
            );


        if (!token) {

            return res.status(401).json({
                success: false,
                authenticated: false,
                message: "Not authenticated"
            });

        }


        const secret =
            new TextEncoder().encode(
                JWT_SECRET
            );


        const { payload } =
            await jwtVerify(
                token,
                secret
            );


        if (
            payload.role !== "admin" ||
            !payload.userId
        ) {

            return res.status(403).json({
                success: false,
                authenticated: false,
                message:
                    "Administrator access required"
            });

        }


        const users = await sql`
            SELECT
                id,
                name,
                email,
                role,
                created_at
            FROM users
            WHERE id = ${payload.userId}
            LIMIT 1
        `;


        if (!users.length) {

            return res.status(401).json({
                success: false,
                authenticated: false,
                message:
                    "Administrator account no longer exists"
            });

        }


        const user = users[0];


        if (user.role !== "admin") {

            return res.status(403).json({
                success: false,
                authenticated: false,
                message:
                    "Administrator access required"
            });

        }


        res.setHeader(
            "Cache-Control",
            "no-store"
        );


        return res.status(200).json({

            success: true,

            authenticated: true,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }

        });

    } catch (error) {

        console.error(
            "AUTH ME ERROR:",
            error
        );

        return res.status(401).json({
            success: false,
            authenticated: false,
            message: "Invalid or expired session"
        });

    }

}