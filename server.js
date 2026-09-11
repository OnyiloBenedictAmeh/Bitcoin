import http from "node:http";
import { parse } from "node:url";

const PORT = process.env.PORT || 10000;

const routes = {
    "/api/auth/login": "./api/auth/login.js",
    "/api/auth/me": "./api/auth/me.js",
    "/api/auth/logout": "./api/auth/logout.js",

    "/api/products": "./api/products/index.js",

    "/api/admin/setup": "./api/admin/setup.js",
    "/api/admin/products": "./api/admin/products/index.js",
    "/api/admin/products/images": "./api/admin/products/images.js",
    "/api/admin/categories": "./api/admin/categories/index.js",
    "/api/admin/images/upload": "./api/admin/images/upload.js"
};

function setCors(req, res) {
    const origin = process.env.FRONTEND_ORIGIN;

    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type"
        );
        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,PATCH,PUT,DELETE,OPTIONS"
        );
    }
}

function parseCookies(cookieHeader = "") {
    const cookies = {};

    cookieHeader.split(";").forEach(part => {
        const index = part.indexOf("=");

        if (index === -1) return;

        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();

        cookies[key] = decodeURIComponent(value);
    });

    return cookies;
}

function createResponse(res) {
    return {
        status(code) {
            res.statusCode = code;
            return this;
        },

        setHeader(name, value) {
            res.setHeader(name, value);
        },

        json(data) {
            if (!res.headersSent) {
                res.setHeader(
                    "Content-Type",
                    "application/json; charset=utf-8"
                );
            }

            res.end(JSON.stringify(data));
        },

        end(data) {
            res.end(data);
        }
    };
}

async function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            if (!body.trim()) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    try {
        setCors(req, res);

        if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
        }

        const { pathname } = parse(req.url);

        const modulePath = routes[pathname];

        if (!modulePath) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(
                JSON.stringify({
                    success: false,
                    message: "API route not found"
                })
            );
            return;
        }

        /*
         * Multipart uploads must receive the original
         * request stream, so do not parse the body for them.
         */
        const contentType =
            req.headers["content-type"] || "";

        if (
            !contentType.startsWith("multipart/form-data")
        ) {
            try {
                req.body = await readJsonBody(req);
            } catch {
                res.statusCode = 400;
                res.setHeader(
                    "Content-Type",
                    "application/json"
                );
                res.end(
                    JSON.stringify({
                        success: false,
                        message: "Invalid JSON body"
                    })
                );
                return;
            }
        }

        req.cookies = parseCookies(
            req.headers.cookie
        );

        const module = await import(modulePath);

        const handler = module.default;

        if (typeof handler !== "function") {
            throw new Error(
                `Invalid API handler: ${modulePath}`
            );
        }

        await handler(
            req,
            createResponse(res)
        );

        if (!res.writableEnded) {
            res.end();
        }
    } catch (error) {
        console.error("SERVER ERROR:", error);

        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader(
                "Content-Type",
                "application/json"
            );
        }

        res.end(
            JSON.stringify({
                success: false,
                message: "Internal server error"
            })
        );
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        `S STORE API running on port ${PORT}`
    );
});