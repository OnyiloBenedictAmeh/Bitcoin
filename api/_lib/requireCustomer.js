import { jwtVerify } from "jose";

function getCookie(req, name) {
    const value = (req.headers.cookie || ";").split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${name}=`));
    return value ? decodeURIComponent(value.slice(name.length + 1)) : null;
}

export async function requireCustomer(req, res, { optional = false } = {}) {
    const token = getCookie(req, "customer_session");
    if (!token) {
        if (optional) return null;
        res.status(401).json({ success: false, message: "Customer login required" });
        return null;
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (!payload.userId || payload.role === "admin") throw new Error("Invalid customer session");
        return { id: payload.userId, role: payload.role };
    } catch {
        if (optional) return null;
        res.status(401).json({ success: false, message: "Invalid or expired session" });
        return null;
    }
}
