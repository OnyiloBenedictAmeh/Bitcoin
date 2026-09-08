const endpoint = "/api/cart";

async function request(url = endpoint, options = {}) {
    const response = await fetch(url, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
        const error = new Error("Please sign in to use your cart.");
        error.unauthorized = true;
        throw error;
    }
    if (!response.ok || !data.success) throw new Error(data.message || "Unable to update cart");
    return data.items || [];
}

export const CartApi = {
    list: () => request(),
    add: (productId, quantity, options = {}) => request(endpoint, { method: "POST", body: JSON.stringify({ productId, quantity, options }) }),
    setQuantity: (cartItemId, quantity) => request(endpoint, { method: "PATCH", body: JSON.stringify({ cartItemId, quantity }) }),
    remove: cartItemId => request(`${endpoint}?id=${encodeURIComponent(cartItemId)}`, { method: "DELETE" }),
    clear: () => request(`${endpoint}?all=true`, { method: "DELETE" })
};

export function renderCartCount(items) {
    const count = items.reduce((total, entry) => total + Number(entry.quantity || 0), 0);
    document.querySelectorAll(".cart-count").forEach(element => { element.textContent = count; });
}
