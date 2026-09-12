import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

const routes = {
    "/api/health": "./api/health.js",

    "/api/auth/login": "./api/auth/login.js",
    "/api/auth/register": "./api/auth/register.js",
    "/api/auth/me": "./api/auth/me.js",
    "/api/auth/logout": "./api/auth/logout.js",

    "/api/products": "./api/products/index.js",
    "/api/cart": "./api/cart/index.js",

    "/api/customer/me": "./api/customer/me.js",
    "/api/customer/profile": "./api/customer/profile.js",

    "/api/orders": "./api/orders/index.js",
    "/api/orders/detail": "./api/orders/detail.js",
    "/api/orders/payment": "./api/orders/payment.js",

    "/api/payments/create-checkout-session": "./api/payments/create-checkout-session.js",
    "/api/payments/verify-checkout-session": "./api/payments/verify-checkout-session.js",

    "/api/admin/setup": "./api/admin/setup.js",
    "/api/admin/products": "./api/admin/products/index.js",
    "/api/admin/products/images": "./api/admin/products/images.js",
    "/api/admin/categories": "./api/admin/categories/index.js",
    "/api/admin/images/upload": "./api/admin/images/upload.js",
    "/api/admin/images/cleanup": "./api/admin/images/cleanup.js",
    "/api/admin/orders": "./api/admin/orders/index.js",
    "/api/admin/customers": "./api/admin/customers/index.js",
};

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

function setCors(req, res) {
    const origin = process.env.FRONTEND_ORIGIN;

    if (origin) {
        res.setHeader(
            "Access-Control-Allow-Origin",
            origin
        );

        res.setHeader(
            "Access-Control-Allow-Credentials",
            "true"
        );

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

        const key = part
            .slice(0, index)
            .trim();

        const value = part
            .slice(index + 1)
            .trim();

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

function readJsonBody(req) {
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

function serveStaticFile(req, res, pathname) {
    let requestedPath = pathname;

    if (requestedPath === "/") {
        requestedPath = "/index.html";
    }

    const decodedPath = decodeURIComponent(
        requestedPath
    );

    const filePath = path.resolve(
        __dirname,
        "." + decodedPath
    );

    /*
     * Prevent requests from escaping the project directory.
     */
    if (
        filePath !== __dirname &&
        !filePath.startsWith(__dirname + path.sep)
    ) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (!statError && stats.isDirectory()) {
            const indexPath = path.join(
                filePath,
                "index.html"
            );

            fs.readFile(
                indexPath,
                (error, data) => {
                    if (error) {
                        res.statusCode = 404;
                        res.end("Not Found");
                        return;
                    }

                    res.statusCode = 200;
                    res.setHeader(
                        "Content-Type",
                        "text/html; charset=utf-8"
                    );

                    res.end(data);
                }
            );

            return;
        }

        fs.readFile(
            filePath,
            (error, data) => {
                if (error) {
                    res.statusCode = 404;
                    res.end("Not Found");
                    return;
                }

                const extension =
                    path.extname(filePath)
                        .toLowerCase();

                res.statusCode = 200;

                res.setHeader(
                    "Content-Type",
                    mimeTypes[extension] ||
                        "application/octet-stream"
                );

                res.end(data);
            }
        );
    });
}

const server = http.createServer(
    async (req, res) => {
        try {
            setCors(req, res);

            const { pathname, query } = parse(req.url, true);
            req.query = query || {};

            /*
             * CORS preflight
             */
            if (req.method === "OPTIONS") {
                res.statusCode = 204;
                res.end();
                return;
            }

            /*
             * API routes
             */
            if (pathname.startsWith("/api/")) {
                const modulePath =
                    routes[pathname];

                if (!modulePath) {
                    res.statusCode = 404;

                    res.setHeader(
                        "Content-Type",
                        "application/json"
                    );

                    res.end(
                        JSON.stringify({
                            success: false,
                            message:
                                "API route not found"
                        })
                    );

                    return;
                }

                const contentType =
                    req.headers["content-type"] ||
                    "";

                /*
                 * Do NOT consume multipart requests.
                 * Busboy needs the original request stream.
                 */
                if (
                    !contentType.startsWith(
                        "multipart/form-data"
                    )
                ) {
                    try {
                        req.body =
                            await readJsonBody(req);
                    } catch {
                        res.statusCode = 400;

                        res.setHeader(
                            "Content-Type",
                            "application/json"
                        );

                        res.end(
                            JSON.stringify({
                                success: false,
                                message:
                                    "Invalid JSON body"
                            })
                        );

                        return;
                    }
                }

                req.cookies =
                    parseCookies(
                        req.headers.cookie
                    );

                const module =
                    await import(modulePath);

                const handler =
                    module.default;

                if (
                    typeof handler !==
                    "function"
                ) {
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

                return;
            }

            /*
             * Everything else is a frontend file.
             */
            serveStaticFile(
                req,
                res,
                pathname
            );
        } catch (error) {
            console.error(
                "SERVER ERROR:",
                error
            );

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
                    message:
                        "Internal server error"
                })
            );
        }
    }
);

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `S STORE running on port ${PORT}`
        );
    }
);