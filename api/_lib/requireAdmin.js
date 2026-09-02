import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;


function getCookie(req, name) {

    const cookies = req.headers.cookie || "";

    const match = cookies
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie =>
            cookie.startsWith(`${name}=`)
        );

    if (!match) {
        return null;
    }

    return decodeURIComponent(
        match.substring(name.length + 1)
    );
}


export async function requireAdmin(req, res) {

    /*
    ============================
    CHECK JWT SECRET
    ============================
    */

    if (!JWT_SECRET) {

        console.error(
            "JWT_SECRET is not configured"
        );

        res.status(500).json({
            success: false,
            message:
                "Server authentication is not configured"
        });

        return null;
    }


    /*
    ============================
    GET SESSION COOKIE
    ============================
    */

    const token =
        getCookie(
            req,
            "admin_session"
        );


    if (!token) {

        res.status(401).json({
            success: false,
            message: "Authentication required"
        });

        return null;
    }


    /*
    ============================
    VERIFY JWT
    ============================
    */

    try {

        const secret =
            new TextEncoder().encode(
                JWT_SECRET
            );


        const { payload } =
            await jwtVerify(
                token,
                secret
            );


        /*
        ============================
        VERIFY ADMIN ROLE
        ============================
        */

        if (
            payload.role !== "admin" ||
            !payload.userId
        ) {

            res.status(403).json({
                success: false,
                message:
                    "Administrator access required"
            });

            return null;
        }


        /*
        ============================
        RETURN AUTHENTICATED ADMIN
        ============================
        */

        return {
            userId: payload.userId,
            role: payload.role
        };


    } catch (error) {

        console.error(
            "ADMIN JWT VERIFICATION ERROR:",
            error
        );


        res.status(401).json({
            success: false,
            message:
                "Invalid or expired session"
        });


        return null;
    }

}