// ============================================
// BITCOIN PAYMENT — MVP
// ============================================

const BitcoinPayment = (() => {

    let order = null;

    let remainingSeconds = 900;

    let timer = null;


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        payment:
            document.getElementById(
                "bitcoinPayment"
            ),

        success:
            document.getElementById(
                "paymentSuccess"
            ),

        usd:
            document.getElementById(
                "paymentUsd"
            ),

        btc:
            document.getElementById(
                "paymentBtc"
            ),

        address:
            document.getElementById(
                "bitcoinAddress"
            ),

        copy:
            document.getElementById(
                "copyAddress"
            ),

        timer:
            document.getElementById(
                "paymentTimer"
            ),

        simulate:
            document.getElementById(
                "simulateBitcoinPayment"
            ),

        orderId:
            document.getElementById(
                "successOrderId"
            )

    };


    // ========================================
    // LOAD ORDER
    // ========================================

    function loadOrder() {

        try {

            order = JSON.parse(
                localStorage.getItem(
                    "pendingOrder"
                )
            );

        } catch (error) {

            console.error(
                "Unable to load pending order:",
                error
            );

            order = null;

        }


        if (!order) {

            window.location.href =
                "cart.html";

            return false;

        }


        return true;

    }


    // ========================================
    // FORMAT USD
    // ========================================

    function formatUsd(amount) {

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD"
            }
        ).format(
            Number(amount) || 0
        );

    }


    // ========================================
    // MOCK BTC CONVERSION
    // ========================================

    function calculateBitcoin() {

        /*
         * DEMO ONLY.
         *
         * This will later be replaced by
         * a real BTC exchange rate/payment
         * provider.
         */

        const demoBtcRate = 70000;

        return (
            Number(order.total) /
            demoBtcRate
        );

    }


    // ========================================
    // RENDER PAYMENT
    // ========================================

    function renderPayment() {

        const btc =
            calculateBitcoin();


        if (elements.usd) {

            elements.usd.textContent =
                formatUsd(order.total);

        }


        if (elements.btc) {

            elements.btc.textContent =
                `${btc.toFixed(8)} BTC`;

        }

    }


    // ========================================
    // COPY ADDRESS
    // ========================================

    async function copyAddress() {

        if (!elements.address) {
            return;
        }


        const address =
            elements.address.textContent.trim();


        try {

            await navigator.clipboard.writeText(
                address
            );


            if (!elements.copy) {
                return;
            }


            const original =
                elements.copy.innerHTML;


            elements.copy.innerHTML =
                `<i class="bx bx-check"></i>`;


            setTimeout(
                () => {

                    elements.copy.innerHTML =
                        original;

                },
                1500
            );

        } catch (error) {

            console.error(
                "Unable to copy address:",
                error
            );

        }

    }


    // ========================================
    // TIMER
    // ========================================

    function startTimer() {

        timer =
            setInterval(
                () => {

                    remainingSeconds--;


                    if (
                        remainingSeconds <= 0
                    ) {

                        clearInterval(timer);


                        if (elements.timer) {

                            elements.timer.textContent =
                                "Expired";

                        }


                        if (elements.simulate) {

                            elements.simulate.disabled =
                                true;

                        }


                        return;

                    }


                    const minutes =
                        Math.floor(
                            remainingSeconds / 60
                        );


                    const seconds =
                        remainingSeconds % 60;


                    if (elements.timer) {

                        elements.timer.textContent =
                            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

                    }

                },
                1000
            );

    }


    // ========================================
    // GET ORDERS
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
    // UPDATE COMPLETED ORDER
    // ========================================

    function updateOrderAsPaid() {

        const orders =
            getOrders();


        const index =
            orders.findIndex(
                existingOrder =>
                    String(existingOrder.id) ===
                    String(order.id)
            );


        /*
         * Update the existing order rather
         * than creating a duplicate.
         */

        if (index !== -1) {

            orders[index] = {

                ...orders[index],

                ...order,

                status:
                    "paid",

                paymentStatus:
                    "Paid",

                payment: {

                    method:
                        "bitcoin",

                    status:
                        "paid",

                    demo:
                        true,

                    paidAt:
                        new Date().toISOString()

                }

            };

        } else {

            /*
             * Safety fallback in case the order
             * somehow isn't already in orders[].
             */

            orders.unshift({

                ...order,

                status:
                    "paid",

                paymentStatus:
                    "Paid",

                payment: {

                    method:
                        "bitcoin",

                    status:
                        "paid",

                    demo:
                        true,

                    paidAt:
                        new Date().toISOString()

                }

            });

        }


        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );


        /*
         * Get the final version from the array.
         */

        const completedOrder =
            orders.find(
                existingOrder =>
                    String(existingOrder.id) ===
                    String(order.id)
            );


        localStorage.setItem(
            "lastOrder",
            JSON.stringify(
                completedOrder || order
            )
        );

    }


    // ========================================
    // SIMULATE PAYMENT
    // ========================================

    function simulatePayment() {

        if (!order) {
            return;
        }


        if (
            elements.simulate?.disabled
        ) {
            return;
        }


        clearInterval(timer);


        /*
         * Mark the current order as paid.
         */

        order.status =
            "paid";

        order.paymentStatus =
            "Paid";


        order.payment = {

            method:
                "bitcoin",

            status:
                "paid",

            demo:
                true,

            paidAt:
                new Date().toISOString()

        };


        /*
         * Update the existing order
         * in order history.
         */

        updateOrderAsPaid();


        /*
         * Remove pending payment.
         */

        localStorage.removeItem(
            "pendingOrder"
        );


        /*
         * Clear cart after successful
         * payment.
         */

        localStorage.removeItem(
            "cart"
        );


        /*
         * Show success screen.
         */

        if (elements.payment) {

            elements.payment.hidden =
                true;

        }


        if (elements.success) {

            elements.success.hidden =
                false;

        }


        if (elements.orderId) {

            elements.orderId.textContent =
                `Order ${order.id}`;

        }

    }


    // ========================================
    // EVENTS
    // ========================================

    function initEvents() {

        elements.copy?.addEventListener(
            "click",
            copyAddress
        );


        elements.simulate?.addEventListener(
            "click",
            simulatePayment
        );

    }


    // ========================================
    // INIT
    // ========================================

    function init() {

        if (!loadOrder()) {
            return;
        }


        renderPayment();

        initEvents();

        startTimer();

    }


    // ========================================
    // CLEANUP
    // ========================================

    function cleanup() {

        if (timer) {

            clearInterval(timer);

            timer = null;

        }

    }


    window.addEventListener(
        "beforeunload",
        cleanup
    );


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    BitcoinPayment.init
);