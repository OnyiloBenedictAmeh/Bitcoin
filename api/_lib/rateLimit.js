const requests = new Map();

export function rateLimit(req, res, { limit = 20, windowMs = 60_000 } = {}) {
    const key = `${req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown"}:${req.url?.split("?")[0] || ""}`;
    const now = Date.now();
    const recent = (requests.get(key) || []).filter(time => now - time < windowMs);
    recent.push(now);
    requests.set(key, recent);
    if (recent.length > limit) {
        res.status(429).json({ success: false, message: "Too many requests. Please try again shortly." });
        return false;
    }
    return true;
}
