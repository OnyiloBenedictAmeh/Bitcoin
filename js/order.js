// ============================================
// ORDER DETAILS PAGE
// ============================================

const OrderPage = (() => {

    let order = null;


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        header:
            document.getElementById(
                "orderHeader"
            ),

        layout:
            document.getElementById(
                "orderLayout"
            ),

        items:
            document.getElementById(
                "orderItems"
            ),

        customer:
            document.getElementById(
                "orderCustomer"
            ),

        payment:
            document.getElementById(
                "orderPayment"
            ),

        subtotal:
            document.getElementById(
                "orderSubtotal"
            ),

        shipping:
            document.getElementById(
                "orderShipping"
            ),

        total:
            document.getElementById(
                "orderTotal"
            ),

        notFound:
            document.getElementById(
                "orderNotFound"
            ),

        menuBtn:
            document.getElementById(
                "menuBtn"
            ),

        mainNav:
            document.getElementById(
                "mainNav"
            ),

        currentYear:
            document.getElementById(
                "currentYear"
            )

    };


    // ========================================
    // GET ORDER ID
    // ========================================

    function getOrderId() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return params.get("id");

    }


    // ========================================
    // LOAD ORDER
    // ========================================

    function loadOrder() {

        const orderId =
            getOrderId();


        if (!orderId) {
            return;
        }


        let orders = [];


        try {

            orders = JSON.parse(
                localStorage.getItem(
                    "orders"
                ) || "[]"
            );

        } catch (error) {

            console.error(
                "Unable to load orders:",
                error
            );

            return;

        }


        order =
            orders.find(
                item =>
                    String(item.id) ===
                    String(orderId)
            );

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
        ).format(
            Number(price) || 0
        );

    }


    // ========================================
    // FORMAT DATE
    // ========================================

    function formatDate(date) {

        if (!date) {
            return "Unknown date";
        }


        return new Intl.DateTimeFormat(
            "en-US",
            {
                dateStyle: "long",
                timeStyle: "short"
            }
        ).format(
            new Date(date)
        );

    }


    // ========================================
    // FORMAT STATUS
    // ========================================

    function formatStatus(status) {

        if (!status) {
            return "Pending";
        }


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
    // RENDER HEADER
    // ========================================

    function renderHeader() {

        if (!elements.header) {
            return;
        }


        elements.header.innerHTML = `

            <div>

                <span class="eyebrow">
                    ORDER DETAILS
                </span>

                <h1>
                    Order ${order.id}
                </h1>

                <p>
                    Placed ${formatDate(
                        order.createdAt
                    )}
                </p>

            </div>


            <div class="order-status-wrap">

                <span class="order-status ${
                    order.status || "pending"
                }">

                    ${formatStatus(
                        order.status
                    )}

                </span>

            </div>

        `;

    }


    // ========================================
    // RENDER ITEMS
    // ========================================

    function renderItems() {

        if (!elements.items) {
            return;
        }


        const items =
            Array.isArray(
                order.items
            )
                ? order.items
                : [];


        elements.items.innerHTML =
            items.map(
                item => `

                    <article
                        class="order-item"
                    >

                        <div
                            class="order-item-image"
                        >

                            <i
                                class="bx bx-image"
                            ></i>

                        </div>


                        <div
                            class="order-item-info"
                        >

                            <h3>
                                ${item.name}
                            </h3>


                            ${
                                item.options
                                    ? Object.entries(
                                        item.options
                                    ).map(
                                        ([key, value]) => `

                                            <span>
                                                ${key}: ${value}
                                            </span>

                                        `
                                    ).join("")
                                    : ""
                            }


                            <span>
                                Quantity:
                                ${item.quantity}
                            </span>

                        </div>


                        <strong
                            class="order-item-price"
                        >

                            ${formatPrice(
                                Number(item.price) *
                                Number(item.quantity)
                            )}

                        </strong>

                    </article>

                `
            ).join("");

    }


    // ========================================
    // RENDER CUSTOMER
    // ========================================

    function renderCustomer() {

        if (!elements.customer) {
            return;
        }


        const customer =
            order.customer ||
            order.shipping ||
            {};


        elements.customer.innerHTML = `

            <div class="customer-detail">

                <i class="bx bx-user"></i>

                <div>

                    <strong>
                        Customer
                    </strong>

                    <span>
                        ${
                            customer.firstName || ""
                        }
                        ${
                            customer.lastName || ""
                        }
                    </span>

                </div>

            </div>


            <div class="customer-detail">

                <i class="bx bx-envelope"></i>

                <div>

                    <strong>
                        Email
                    </strong>

                    <span>
                        ${customer.email || "—"}
                    </span>

                </div>

            </div>


            <div class="customer-detail">

                <i class="bx bx-phone"></i>

                <div>

                    <strong>
                        Phone
                    </strong>

                    <span>
                        ${customer.phone || "—"}
                    </span>

                </div>

            </div>


            <div class="customer-detail">

                <i class="bx bx-map"></i>

                <div>

                    <strong>
                        Delivery address
                    </strong>

                    <span>
                        ${customer.address || ""}
                    </span>

                    <span>
                        ${customer.city || ""}
                        ${
                            customer.state
                                ? ", " +
                                  customer.state
                                : ""
                        }
                    </span>

                    <span>
                        ${
                            customer.country ||
                            ""
                        }
                    </span>

                </div>

            </div>

        `;

    }


    // ========================================
    // RENDER PAYMENT
    // ========================================

    function renderPayment() {

        if (!elements.payment) {
            return;
        }


        const method =
            order.paymentMethod ||
            "bitcoin";


        const isBitcoin =
            method === "bitcoin";


        elements.payment.innerHTML = `

            <div class="payment-detail">

                <span class="payment-detail-icon">

                    ${
                        isBitcoin
                            ? "₿"
                            : "💳"
                    }

                </span>


                <div>

                    <strong>
                        ${
                            isBitcoin
                                ? "Bitcoin"
                                : "Card"
                        }
                    </strong>

                    <span>
                        ${
                            order.paymentStatus ||
                            "Payment pending"
                        }
                    </span>

                </div>

            </div>

        `;

    }


    // ========================================
    // RENDER SUMMARY
    // ========================================

    function renderSummary() {

        const subtotal =
            Number(
                order.subtotal ??
                order.total ??
                0
            );


        const shipping =
            Number(
                order.shippingCost ??
                0
            );


        const total =
            Number(
                order.total ??
                subtotal + shipping
            );


        elements.subtotal.textContent =
            formatPrice(
                subtotal
            );


        elements.shipping.textContent =
            shipping > 0
                ? formatPrice(shipping)
                : "Free";


        elements.total.textContent =
            formatPrice(
                total
            );

    }


    // ========================================
    // CART COUNT
    // ========================================

    function updateCartCount() {

        let cart = [];


        try {

            cart = JSON.parse(
                localStorage.getItem(
                    "cart"
                ) || "[]"
            );

        } catch {

            cart = [];

        }


        const count =
            cart.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.quantity
                    ),
                0
            );


        document
            .querySelectorAll(
                ".cart-count"
            )
            .forEach(
                element => {

                    element.textContent =
                        count;

                }
            );

    }


    // ========================================
    // NOT FOUND
    // ========================================

    function showNotFound() {

        elements.layout.hidden =
            true;

        elements.header.hidden =
            true;

        elements.notFound.hidden =
            false;

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

    function init() {

        loadOrder();

        updateCartCount();

        initMenu();

        setYear();


        if (!order) {

            showNotFound();

            return;

        }


        renderHeader();

        renderItems();

        renderCustomer();

        renderPayment();

        renderSummary();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    OrderPage.init
);