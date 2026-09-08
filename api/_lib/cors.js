const defaultOrigins = ["https://onyilobenedictameh.github.io"];

function allowedOrigins() {
    const configured = String(process.env.FRONTEND_ORIGIN || "")
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean);
    return configured.length ? configured : defaultOrigins;
}

export function applyCors(req, res) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins().includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return true;
    }
    return false;
}
