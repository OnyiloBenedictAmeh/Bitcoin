// ============================================
// CHECKOUT PAGE
// ============================================

const CheckoutPage = (() => {

    // ========================================
    // STATE
    // ========================================

    let cart = [];

    let paymentMethod = "bitcoin";


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        layout:
            document.getElementById(
                "checkoutLayout"
            ),

        empty:
            document.getElementById(
                "checkoutEmpty"
            ),

        items:
            document.getElementById(
                "checkoutItems"
            ),

        subtotal:
            document.getElementById(
                "checkoutSubtotal"
            ),

        shipping:
            document.getElementById(
                "checkoutShipping"
            ),

        total:
            document.getElementById(
                "checkoutTotal"
            ),

        placeOrder:
            document.getElementById(
                "placeOrder"
            ),

        error:
            document.getElementById(
                "checkoutError"
            )

    };


    // ========================================
    // LOAD CART
    // ========================================

    function loadCart() {

        try {

            cart = JSON.parse(
                localStorage.getItem(
                    "cart"
                ) || "[]"
            );

        } catch (error) {

            console.error(
                "Unable to load cart:",
                error
            );

            cart = [];

        }

    }


    // ========================================
    // LOAD ACCOUNT
    // ========================================

    function loadAccount() {

        let account = null;

        try {

            account = JSON.parse(
                localStorage.getItem(
                    "account"
                )
            );

        } catch (error) {

            console.error(
                "Unable to load account:",
                error
            );

        }


        if (!account) {
            return;
        }


        /*
         * PROFILE
         */

        setFieldValue(
            "email",
            account.email
        );

        setFieldValue(
            "firstName",
            account.firstName
        );

        setFieldValue(
            "lastName",
            account.lastName
        );

        setFieldValue(
            "phone",
            account.phone
        );


        /*
         * SAVED ADDRESS
         */

        const address =
            account.address;


        if (!address) {
            return;
        }


        setFieldValue(
            "address",
            address.address
        );

        setFieldValue(
            "city",
            address.city
        );

        setFieldValue(
            "state",
            address.state
        );

        setFieldValue(
            "postalCode",
            address.postalCode
        );


        setFieldValue(
            "country",
            address.country
        );


        /*
         * Address name takes priority
         * over profile name.
         */

        setFieldValue(
            "firstName",
            address.firstName ||
            account.firstName
        );

        setFieldValue(
            "lastName",
            address.lastName ||
            account.lastName
        );

    }


    // ========================================
    // SET FIELD VALUE
    // ========================================

    function setFieldValue(
        id,
        value
    ) {

        const field =
            document.getElementById(id);


        if (!field || value == null) {
            return;
        }


        field.value = value;

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
    // SUBTOTAL
    // ========================================

    function getSubtotal() {

        return cart.reduce(
            (
                total,
                item
            ) => {

                return total +
                    (
                        Number(item.price) *
                        Number(item.quantity)
                    );

            },
            0
        );

    }


    // ========================================
    // RENDER ITEMS
    // ========================================

    function renderItems() {

        if (!elements.items) {
            return;
        }


        elements.items.innerHTML =
            cart.map(
                item => {

                    const itemTotal =
                        Number(item.price) *
                        Number(item.quantity);


                    return `

                        <div
                            class="checkout-item"
                        >

                            <div
                                class="checkout-item-image"
                            >

                                ${
                                    item.image
                                        ? `
                                            <img
                                                src="${item.image}"
                                                alt="${item.name}"
                                            >
                                        `
                                        : `
                                            <i
                                                class="bx bx-image"
                                            ></i>
                                        `
                                }

                            </div>


                            <div
                                class="checkout-item-info"
                            >

                                <strong>
                                    ${item.name}
                                </strong>

                                <span>
                                    Qty: ${item.quantity}
                                </span>

                            </div>


                            <strong
                                class="checkout-item-price"
                            >

                                ${formatPrice(
                                    itemTotal
                                )}

                            </strong>

                        </div>

                    `;

                }
            ).join("");

    }


    // ========================================
    // RENDER SUMMARY
    // ========================================

    function renderSummary() {

        const subtotal =
            getSubtotal();


        if (elements.subtotal) {

            elements.subtotal.textContent =
                formatPrice(subtotal);

        }


        if (elements.shipping) {

            elements.shipping.textContent =
                "Calculated";

        }


        if (elements.total) {

            elements.total.textContent =
                formatPrice(subtotal);

        }

    }


    // ========================================
    // EMPTY CART
    // ========================================

    function handleEmptyCart() {

        if (cart.length > 0) {

            if (elements.layout) {
                elements.layout.hidden = false;
            }

            if (elements.empty) {
                elements.empty.hidden = true;
            }

            return;

        }


        if (elements.layout) {
            elements.layout.hidden = true;
        }

        if (elements.empty) {
            elements.empty.hidden = false;
        }

    }


    // ========================================
    // PAYMENT METHODS
    // ========================================

    function initPaymentMethods() {

        const radios =
            document.querySelectorAll(
                'input[name="paymentMethod"]'
            );


        radios.forEach(
            radio => {

                radio.addEventListener(
                    "change",
                    () => {

                        paymentMethod =
                            radio.value;

                        updatePaymentUI();

                    }
                );

            }
        );


        const checked =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (checked) {

            paymentMethod =
                checked.value;

        }


        updatePaymentUI();

    }


    // ========================================
    // UPDATE PAYMENT UI
    // ========================================

    function updatePaymentUI() {

        const methods =
            document.querySelectorAll(
                ".payment-method"
            );


        methods.forEach(
            method => {

                const radio =
                    method.querySelector(
                        'input[name="paymentMethod"]'
                    );


                method.classList.toggle(
                    "active",
                    radio?.checked
                );

            }
        );


        if (!elements.placeOrder) {
            return;
        }


        if (
            paymentMethod ===
            "bitcoin"
        ) {

            elements.placeOrder.innerHTML = `

                <i class="bx bx-lock-alt"></i>

                Continue to Bitcoin Payment

            `;

        } else {

            elements.placeOrder.innerHTML = `

                <i class="bx bx-lock-alt"></i>

                Continue to Card Payment

            `;

        }

    }


    // ========================================
    // ERROR
    // ========================================

    function showError(message) {

        if (!elements.error) {
            return;
        }


        const span =
            elements.error.querySelector(
                "span"
            );


        if (span) {

            span.textContent =
                message;

        }


        elements.error.hidden =
            false;

    }


    function hideError() {

        if (elements.error) {

            elements.error.hidden =
                true;

        }

    }


    // ========================================
    // FORM VALIDATION
    // ========================================

    function validateCheckout() {

        hideError();


        const requiredFields = [

            "email",

            "firstName",

            "lastName",

            "address",

            "city",

            "state",

            "country"

        ];


        for (
            const fieldId
            of requiredFields
        ) {

            const field =
                document.getElementById(
                    fieldId
                );


            if (
                !field ||
                !field.value.trim()
            ) {

                showError(
                    "Please complete all required fields."
                );


                field?.focus();


                return false;

            }

        }


        const email =
            document.getElementById(
                "email"
            );


        if (
            email &&
            !email.checkValidity()
        ) {

            showError(
                "Please enter a valid email address."
            );


            email.focus();


            return false;

        }


        return true;

    }


    // ========================================
    // GET EXISTING ORDERS
    // ========================================

    function getOrders() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "orders"
                ) || "[]"
            );

        } catch (error) {

            console.error(
                "Unable to load orders:",
                error
            );

            return [];

        }

    }


    // ========================================
    // SAVE ORDER
    // ========================================

    function saveOrder(order) {

        const orders =
            getOrders();


        orders.unshift(
            order
        );


        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );

    }


    // ========================================
    // PLACE ORDER
    // ========================================

    function placeOrder() {

        if (!validateCheckout()) {
            return;
        }


        if (!cart.length) {

            showError(
                "Your cart is empty."
            );

            return;

        }


        const subtotal =
            getSubtotal();


        const customer = {

            email:
                document.getElementById(
                    "email"
                ).value.trim(),

            firstName:
                document.getElementById(
                    "firstName"
                ).value.trim(),

            lastName:
                document.getElementById(
                    "lastName"
                ).value.trim(),

            address:
                document.getElementById(
                    "address"
                ).value.trim(),

            city:
                document.getElementById(
                    "city"
                ).value.trim(),

            state:
                document.getElementById(
                    "state"
                ).value.trim(),

            postalCode:
                document.getElementById(
                    "postalCode"
                ).value.trim(),

            country:
                document.getElementById(
                    "country"
                ).value,

            phone:
                document.getElementById(
                    "phone"
                )?.value.trim() || ""

        };


        const order = {

            id:
                `ORD-${Date.now()}`,

            items:
                cart.map(
                    item => ({
                        ...item
                    })
                ),

            subtotal,

            shippingCost:
                0,

            total:
                subtotal,

            currency:
                "USD",

            paymentMethod,

            paymentStatus:
                "Payment pending",

            customer,

            notes:
                document.getElementById(
                    "orderNotes"
                )?.value.trim() || "",

            status:
                "pending_payment",

            createdAt:
                new Date().toISOString()

        };


        /*
         * Save as the active order.
         */

        localStorage.setItem(
            "pendingOrder",
            JSON.stringify(order)
        );


        /*
         * Also save to order history.
         */

        saveOrder(
            order
        );


        console.log(
            "Order created:",
            order
        );


        /*
         * Continue to payment.
         */

        if (
            paymentMethod ===
            "bitcoin"
        ) {

            window.location.href =
                "bitcoin-payment.html";

        } else {

            window.location.href =
                "card-payment.html";

        }

    }


    // ========================================
    // EVENTS
    // ========================================

    function initEvents() {

        elements.placeOrder?.addEventListener(
            "click",
            placeOrder
        );

    }


    // ========================================
    // INITIALIZE
    // ========================================

    function init() {

        loadCart();

        handleEmptyCart();


        if (!cart.length) {
            return;
        }


        /*
         * Load customer profile/address
         * before rendering the checkout.
         */

        loadAccount();

        renderItems();

        renderSummary();

        initPaymentMethods();

        initEvents();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    CheckoutPage.init
);