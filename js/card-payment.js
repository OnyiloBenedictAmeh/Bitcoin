import { showToast } from "./toast.js";

// ============================================
// CARD PAYMENT — MVP
// ============================================

const CardPayment = (() => {

    let order = null;


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        payment:
            document.getElementById(
                "cardPayment"
            ),

        success:
            document.getElementById(
                "cardPaymentSuccess"
            ),

        usd:
            document.getElementById(
                "paymentUsd"
            ),

        cardName:
            document.getElementById(
                "cardName"
            ),

        cardNumber:
            document.getElementById(
                "cardNumber"
            ),

        cardExpiry:
            document.getElementById(
                "cardExpiry"
            ),

        cardCvv:
            document.getElementById(
                "cardCvv"
            ),

        cardType:
            document.getElementById(
                "cardType"
            ),

        cardTypeIcon:
            document.getElementById(
                "cardTypeIcon"
            ),

        pay:
            document.getElementById(
                "payWithCard"
            ),

        error:
            document.getElementById(
                "cardPaymentError"
            ),

        orderId:
            document.getElementById(
                "successOrderId"
            ),

        viewOrder:
            document.getElementById(
                "viewOrder"
            )

    };


    // ========================================
    // CARD TYPE STATE
    // ========================================

    let detectedCardType = "unknown";


    // ========================================
    // LOAD ORDER
    // ========================================

    async function loadOrder() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        if (!id) return false;
        try {
            const response = await fetch(`/api/orders/detail?id=${encodeURIComponent(id)}`, { credentials: "include" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) return false;
            order = data.order;
            const sessionId = params.get("session_id");
            if (sessionId) {
                const verify = await fetch(`/api/payments/verify-checkout-session?id=${encodeURIComponent(id)}&session_id=${encodeURIComponent(sessionId)}`, { credentials: "include" });
                const verification = await verify.json().catch(() => ({}));
                if (verification.success && verification.paid) {
                    elements.payment.hidden = true;
                    elements.success.hidden = false;
                    elements.orderId.textContent = `Order #${id}`;
                    elements.viewOrder.href = `order.html?id=${encodeURIComponent(id)}`;
                    return true;
                }
            }
        } catch (error) { console.error("Unable to load order:", error); order = null; }


        if (!order) {

            window.location.href =
                "cart.html";

            return false;

        }


        return true;

    }


    // ========================================
    // FORMAT PRICE
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
    // RENDER PAYMENT
    // ========================================

    function renderPayment() {

        if (!elements.usd || !order) {
            return;
        }


        elements.usd.textContent =
            formatUsd(
                order.total
            );

    }


    // ========================================
    // SHOW ERROR
    // ========================================

    function showError(message) {

        showToast(message, "error");

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


    // ========================================
    // HIDE ERROR
    // ========================================

    function hideError() {

        if (elements.error) {

            elements.error.hidden =
                true;

        }

    }


    // ========================================
    // CARD TYPE DETECTION
    // ========================================

    function detectCardType(number) {

        const digits =
            String(number || "")
                .replace(/\D/g, "");


        if (!digits) {
            return "unknown";
        }


        // ====================================
        // VISA
        // Starts with 4
        // ====================================

        if (
            /^4/.test(digits)
        ) {

            return "visa";

        }


        // ====================================
        // MASTERCARD
        //
        // Old range:
        // 51 - 55
        //
        // New range:
        // 2221 - 2720
        // ====================================

        if (
            /^(5[1-5])/.test(digits) ||
            (
                digits.length >= 4 &&
                Number(
                    digits.slice(0, 4)
                ) >= 2221 &&
                Number(
                    digits.slice(0, 4)
                ) <= 2720
            )
        ) {

            return "mastercard";

        }


        // ====================================
        // AMERICAN EXPRESS
        // ====================================

        if (
            /^(34|37)/.test(digits)
        ) {

            return "amex";

        }


        // ====================================
        // DISCOVER
        // ====================================

        if (
            /^6(?:011|5|4[4-9]|22)/.test(
                digits
            )
        ) {

            return "discover";

        }


        // ====================================
        // JCB
        // ====================================

        if (
            /^(?:2131|1800|35)/.test(
                digits
            )
        ) {

            return "jcb";

        }


        // ====================================
        // UNIONPAY
        // ====================================

        if (
            /^62/.test(digits)
        ) {

            return "unionpay";

        }


        return "unknown";

    }


    // ========================================
    // CARD TYPE LABEL
    // ========================================

    function getCardTypeLabel(type) {

        const labels = {

            visa:
                "Visa",

            mastercard:
                "Mastercard",

            amex:
                "American Express",

            discover:
                "Discover",

            jcb:
                "JCB",

            unionpay:
                "UnionPay",

            unknown:
                "Card"

        };


        return (
            labels[type] ||
            "Card"
        );

    }


    // ========================================
    // CARD TYPE ICON
    // ========================================

    function getCardTypeIcon(type) {

        const icons = {

            visa:
                "VISA",

            mastercard:
                "MC",

            amex:
                "AMEX",

            discover:
                "DISCOVER",

            jcb:
                "JCB",

            unionpay:
                "UP",

            unknown:
                "<i class=\"bx bx-credit-card\"></i>"

        };


        return (
            icons[type] ||
            icons.unknown
        );

    }


    // ========================================
    // UPDATE CARD TYPE UI
    // ========================================

    function updateCardTypeUI() {

        if (!elements.cardType) {
            return;
        }


        const label =
            getCardTypeLabel(
                detectedCardType
            );


        elements.cardType.textContent =
            label;


        if (elements.cardTypeIcon) {

            elements.cardTypeIcon.innerHTML =
                getCardTypeIcon(
                    detectedCardType
                );

        }


        /*
         * Add the card type as a class.
         *
         * Example:
         *
         * card-type-visa
         * card-type-mastercard
         */

        if (
            elements.cardTypeIcon
        ) {

            elements.cardTypeIcon.classList.remove(

                "card-type-visa",

                "card-type-mastercard",

                "card-type-amex",

                "card-type-discover",

                "card-type-jcb",

                "card-type-unionpay",

                "card-type-unknown"

            );


            elements.cardTypeIcon.classList.add(
                `card-type-${detectedCardType}`
            );

        }

    }


    // ========================================
    // DETECT CARD FROM INPUT
    // ========================================

    function updateCardType() {

        if (!elements.cardNumber) {
            return;
        }


        const number =
            elements.cardNumber.value
                .replace(/\D/g, "");


        detectedCardType =
            detectCardType(
                number
            );


        updateCardTypeUI();


        /*
         * Automatically adjust CVV maxlength.
         *
         * American Express:
         * 4 digits
         *
         * Most other cards:
         * 3 digits
         */

        if (elements.cardCvv) {

            elements.cardCvv.maxLength =
                detectedCardType === "amex"
                    ? 4
                    : 3;


            const currentCvv =
                elements.cardCvv.value
                    .replace(/\D/g, "");


            elements.cardCvv.value =
                currentCvv.slice(
                    0,
                    detectedCardType === "amex"
                        ? 4
                        : 3
                );

        }

    }


    // ========================================
    // FORMAT CARD NUMBER
    // ========================================

    function formatCardNumber(value) {

        const digits =
            value
                .replace(/\D/g, "")
                .slice(0, 19);


        /*
         * American Express uses:
         *
         * 4 - 6 - 5
         *
         * Example:
         * 3782 822463 10005
         */

        if (
            detectedCardType === "amex"
        ) {

            return digits
                .replace(
                    /^(\d{4})(\d{0,6})(\d{0,5}).*/,
                    (
                        match,
                        first,
                        second,
                        third
                    ) =>
                        [
                            first,
                            second,
                            third
                        ]
                            .filter(Boolean)
                            .join(" ")
                );

        }


        /*
         * Most cards use groups of four.
         */

        return digits
            .replace(
                /(.{4})/g,
                "$1 "
            )
            .trim();

    }


    // ========================================
    // FORMAT EXPIRY
    // ========================================

    function formatExpiry(value) {

        const digits =
            value
                .replace(/\D/g, "")
                .slice(0, 4);


        if (
            digits.length <= 2
        ) {

            return digits;

        }


        return (
            digits.slice(0, 2) +
            "/" +
            digits.slice(2)
        );

    }


    // ========================================
    // LUHN CHECK
    // ========================================

    function passesLuhn(number) {

        const digits =
            String(number || "")
                .replace(/\D/g, "");


        if (!digits) {
            return false;
        }


        let sum = 0;

        let shouldDouble = false;


        for (
            let i =
                digits.length - 1;
            i >= 0;
            i--
        ) {

            let digit =
                Number(
                    digits[i]
                );


            if (
                shouldDouble
            ) {

                digit *= 2;


                if (
                    digit > 9
                ) {

                    digit -= 9;

                }

            }


            sum += digit;


            shouldDouble =
                !shouldDouble;

        }


        return (
            sum % 10 === 0
        );

    }


    // ========================================
    // CARD INPUT EVENTS
    // ========================================

    function initCardInputs() {

        elements.cardNumber?.addEventListener(
            "input",
            () => {

                /*
                 * Detect first so that Amex
                 * formatting can be applied.
                 */

                detectedCardType =
                    detectCardType(
                        elements.cardNumber.value
                    );


                elements.cardNumber.value =
                    formatCardNumber(
                        elements.cardNumber.value
                    );


                updateCardType();

                hideError();

            }
        );


        elements.cardExpiry?.addEventListener(
            "input",
            () => {

                elements.cardExpiry.value =
                    formatExpiry(
                        elements.cardExpiry.value
                    );


                hideError();

            }
        );


        elements.cardCvv?.addEventListener(
            "input",
            () => {

                const maxLength =
                    detectedCardType === "amex"
                        ? 4
                        : 3;


                elements.cardCvv.value =
                    elements.cardCvv.value
                        .replace(/\D/g, "")
                        .slice(
                            0,
                            maxLength
                        );


                hideError();

            }
        );

    }


    // ========================================
    // VALIDATE CARD
    // ========================================

    function validateCard() {

        hideError();


        const name =
            elements.cardName?.value.trim();


        const cardNumber =
            elements.cardNumber?.value
                .replace(/\s/g, "");


        const expiry =
            elements.cardExpiry?.value.trim();


        const cvv =
            elements.cardCvv?.value.trim();


        // ====================================
        // CARDHOLDER
        // ====================================

        if (!name) {

            showError(
                "Please enter the cardholder name."
            );


            elements.cardName?.focus();


            return false;

        }


        // ====================================
        // CARD TYPE
        // ====================================

        detectedCardType =
            detectCardType(
                cardNumber
            );


        if (
            detectedCardType ===
            "unknown"
        ) {

            showError(
                "We couldn't identify this card type. Please check the card number."
            );


            elements.cardNumber?.focus();


            return false;

        }


        // ====================================
        // CARD NUMBER LENGTH
        // ====================================

        const cardLengths = {

            visa:
                [13, 16, 19],

            mastercard:
                [16],

            amex:
                [15],

            discover:
                [16, 19],

            jcb:
                [16, 17, 18, 19],

            unionpay:
                [16, 17, 18, 19]

        };


        const validLengths =
            cardLengths[
                detectedCardType
            ] || [16];


        if (
            !validLengths.includes(
                cardNumber.length
            )
        ) {

            showError(
                `Please enter a valid ${getCardTypeLabel(
                    detectedCardType
                )} card number.`
            );


            elements.cardNumber?.focus();


            return false;

        }


        // ====================================
        // LUHN VALIDATION
        // ====================================

        if (
            !passesLuhn(
                cardNumber
            )
        ) {

            showError(
                "The card number appears to be invalid. Please check the number and try again."
            );


            elements.cardNumber?.focus();


            return false;

        }


        // ====================================
        // EXPIRY FORMAT
        // ====================================

        if (
            !/^\d{2}\/\d{2}$/.test(
                expiry
            )
        ) {

            showError(
                "Please enter a valid expiry date in MM/YY format."
            );


            elements.cardExpiry?.focus();


            return false;

        }


        const [
            month,
            year
        ] =
            expiry
                .split("/")
                .map(Number);


        // ====================================
        // EXPIRY MONTH
        // ====================================

        if (
            month < 1 ||
            month > 12
        ) {

            showError(
                "Please enter a valid expiry month."
            );


            elements.cardExpiry?.focus();


            return false;

        }


        // ====================================
        // CVV
        // ====================================

        const requiredCvvLength =
            detectedCardType === "amex"
                ? 4
                : 3;


        if (
            !new RegExp(
                `^\\d{${requiredCvvLength}}$`
            ).test(cvv)
        ) {

            showError(
                `Please enter the ${requiredCvvLength}-digit security code for your card.`
            );


            elements.cardCvv?.focus();


            return false;

        }


        // ====================================
        // CHECK EXPIRY
        // ====================================

        const now =
            new Date();


        const currentYear =
            now.getFullYear() % 100;


        const currentMonth =
            now.getMonth() + 1;


        if (
            year < currentYear ||
            (
                year === currentYear &&
                month < currentMonth
            )
        ) {

            showError(
                "This card has expired."
            );


            elements.cardExpiry?.focus();


            return false;

        }


        return true;

    }


    // ========================================
    // SAVE COMPLETED ORDER
    // ========================================

    // ========================================
    // PROCESS PAYMENT
    // ========================================

    async function processPayment() {
        if (!order || !elements.pay) return;
        hideError();
        elements.pay.disabled = true;
        elements.pay.classList.add("is-loading");
        try {
            const response = await fetch("/api/payments/create-checkout-session", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success || !data.url) throw new Error(data.message || "Unable to start secure checkout");
            window.location.assign(data.url);
        } catch (error) {
            showError(error.message || "Unable to start secure checkout.");
            elements.pay.disabled = false;
            elements.pay.classList.remove("is-loading");
        }

    }


    // ========================================
    // EVENTS
    // ========================================

    function initEvents() {

        elements.pay?.addEventListener(
            "click",
            processPayment
        );


        [
            elements.cardName,
            elements.cardNumber,
            elements.cardExpiry,
            elements.cardCvv
        ]
            .filter(Boolean)
            .forEach(
                input => {

                    input.addEventListener(
                        "input",
                        hideError
                    );

                }
            );

    }


    // ========================================
    // INIT
    // ========================================

    async function init() {

        if (!await loadOrder()) {
            return;
        }


        renderPayment();

        initCardInputs();

        initEvents();

        /*
         * Set initial state.
         */

        detectedCardType =
            "unknown";


        updateCardTypeUI();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    CardPayment.init
);
