import { applyCors } from "../_lib/cors.js";

export default function handler(req, res) {

    if (applyCors(req, res)) return;

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });

    }


    res.setHeader(
        "Set-Cookie",
        [
            "admin_session=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0",
            "customer_session=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0"
        ]
    );


    res.setHeader(
        "Cache-Control",
        "no-store"
    );


    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });

}
