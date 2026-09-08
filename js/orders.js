// ============================================
// ORDERS PAGE
// ============================================

import { CartApi, renderCartCount } from "./cart-api.js";

const OrdersPage = (() => {

    let orders = [];


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        list:
            document.getElementById(
                "ordersList"
            ),

        empty:
            document.getElementById(
                "ordersEmpty"
            ),

        currentYear:
            document.getElementById(
                "currentYear"
            ),

        menuBtn:
            document.getElementById(
                "menuBtn"
            ),

        mainNav:
            document.getElementById(
                "mainNav"
            )

    };


    // ========================================
    // LOAD ORDERS
    // ========================================

    async function loadOrders() {
        const response = await fetch("/api/orders", { credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { window.location.href = "customer-auth.html"; return; }
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load orders");
        orders = data.orders || [];
    }


    // ========================================
    // FORMAT PRICE
    // ========================================

    function formatPrice(price) {

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD"
            }
        ).format(price);

    }


    // ========================================
    // FORMAT DATE
    // ========================================

    function formatDate(date) {

        return new Intl.DateTimeFormat(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        ).format(
            new Date(date)
        );

    }


    // ========================================
    // FORMAT STATUS
    // ========================================

    function formatStatus(status) {

        return String(status)
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            );

    }


    // ========================================
    // RENDER
    // ========================================

    function renderOrders() {

        if (!elements.list) {
            return;
        }


        if (!orders.length) {

            elements.list.hidden =
                true;

            elements.empty.hidden =
                false;

            return;

        }


        elements.list.hidden =
            false;

        elements.empty.hidden =
            true;


        elements.list.innerHTML =
            orders.map(
                order => {

                    const itemCount =
                        order.item_count ?? (order.items?.reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                Number(
                                    item.quantity
                                ),
                            0
                        ) || 0);


                    return `

                        <article
                            class="order-card"
                        >

                            <div
                                class="order-card-main"
                            >

                                <div
                                    class="order-card-icon"
                                >

                                    <i
                                        class="bx bx-package"
                                    ></i>

                                </div>


                                <div
                                    class="order-card-info"
                                >

                                    <strong>
                                        ${order.id}
                                    </strong>

                                    <span>
                                        ${formatDate(
                                            order.created_at || order.createdAt
                                        )}
                                    </span>

                                    <span>
                                        ${itemCount}
                                        ${
                                            itemCount === 1
                                                ? "item"
                                                : "items"
                                        }
                                    </span>

                                </div>

                            </div>


                            <div
                                class="order-card-payment"
                            >

                                <span>
                                    ${
                                        (order.payment_method || order.paymentMethod) ===
                                        "bitcoin"
                                            ? "₿ Bitcoin"
                                            : "💳 Card"
                                    }
                                </span>

                                <strong>
                                    ${formatPrice(
                                        order.subtotal
                                    )}
                                </strong>

                            </div>


                            <div
                                class="order-card-status"
                            >

                                <span
                                    class="order-status ${order.status}"
                                >
                                    ${formatStatus(
                                        order.status
                                    )}
                                </span>

                            </div>


                            <a
                                href="order.html?id=${encodeURIComponent(
                                    order.id
                                )}"
                                class="order-card-action"
                            >

                                View Order

                                <i
                                    class="bx bx-right-arrow-alt"
                                ></i>

                            </a>

                        </article>

                    `;

                }
            ).join("");

    }


    // ========================================
    // CART COUNT
    // ========================================

    async function updateCartCount() {
        try { renderCartCount(await CartApi.list()); } catch (error) { if (!error.unauthorized) console.error("CART LOAD ERROR:", error); }
    }


    // ========================================
    // MOBILE MENU
    // ========================================

    function initMenu() {

        elements.menuBtn?.addEventListener(
            "click",
            () => {

                elements.mainNav?.classList.toggle(
                    "is-open"
                );

            }
        );

    }


    // ========================================
    // YEAR
    // ========================================

    function setYear() {

        if (elements.currentYear) {

            elements.currentYear.textContent =
                new Date().getFullYear();

        }

    }


    // ========================================
    // INIT
    // ========================================

    async function init() {

        try { await loadOrders(); } catch (error) { console.error("ORDER LOAD ERROR:", error); }

        renderOrders();

        await updateCartCount();

        initMenu();

        setYear();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    OrdersPage.init
);
import "./toast.js";
