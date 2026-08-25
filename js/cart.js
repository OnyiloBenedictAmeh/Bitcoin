// ============================================
// CART PAGE
// ============================================

const CartPage = (() => {

    // ========================================
    // STATE
    // ========================================

    let cart = [];


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        cartItems:
            document.getElementById("cartItems"),

        cartLayout:
            document.getElementById("cartLayout"),

        emptyCart:
            document.getElementById("emptyCart"),

        subtotal:
            document.getElementById("cartSubtotal"),

        total:
            document.getElementById("cartTotal"),

        cartCount:
            document.getElementById("headerCartCount"),

        checkoutButton:
            document.getElementById("checkoutButton"),

        currentYear:
            document.getElementById("currentYear"),

        menuBtn:
            document.getElementById("menuBtn"),

        mainNav:
            document.getElementById("mainNav")

    };


    // ========================================
    // LOAD CART
    // ========================================

    function loadCart() {

        try {

            cart = JSON.parse(
                localStorage.getItem("cart") || "[]"
            );

        } catch (error) {

            console.error(
                "Error loading cart:",
                error
            );

            cart = [];

        }

    }


    // ========================================
    // SAVE CART
    // ========================================

    function saveCart() {

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
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
        ).format(price);

    }


    // ========================================
    // CART COUNT
    // ========================================

    function updateCartCount() {

        const count = cart.reduce(
            (total, item) =>
                total + Number(item.quantity || 0),
            0
        );


        if (elements.cartCount) {

            elements.cartCount.textContent =
                count;

        }


        // Also update any cart badges
        // that might exist on the page.

        document
            .querySelectorAll(".cart-count")
            .forEach(element => {

                element.textContent =
                    count;

            });

    }


    // ========================================
    // GET SUBTOTAL
    // ========================================

    function getSubtotal() {

        return cart.reduce(
            (total, item) => {

                const price =
                    Number(item.price) || 0;

                const quantity =
                    Number(item.quantity) || 0;

                return total +
                    (price * quantity);

            },
            0
        );

    }


    // ========================================
    // RENDER CART
    // ========================================

    function renderCart() {

        updateCartCount();


        // -------------------------------
        // EMPTY CART
        // -------------------------------

        if (cart.length === 0) {

            elements.cartLayout.hidden =
                true;

            elements.emptyCart.hidden =
                false;

            return;

        }


        // -------------------------------
        // CART HAS ITEMS
        // -------------------------------

        elements.cartLayout.hidden =
            false;

        elements.emptyCart.hidden =
            true;


        elements.cartItems.innerHTML =
            cart
                .map(
                    item =>
                        renderCartItem(item)
                )
                .join("");


        updateSummary();

    }


    // ========================================
    // RENDER ITEM
    // ========================================

    function renderCartItem(item) {

        const options =
            Object.entries(
                item.options || {}
            );


        const optionsHTML =
            options.length

                ? `

                    <div class="cart-item-options">

                        ${options
                            .map(
                                ([name, value]) => `

                                    <span>
                                        ${name}: ${value}
                                    </span>

                                `
                            )
                            .join("")}

                    </div>

                `

                : "";


        return `

            <article
                class="cart-item"
                data-id="${item.id}"
            >

                <!-- PRODUCT -->

                <div class="cart-item-product">

                    <div class="cart-item-image">

                        <i class="bx bx-image"></i>

                    </div>


                    <div class="cart-item-info">

                        <span class="cart-item-category">
                            Product
                        </span>

                        <h3>
                            ${item.name}
                        </h3>

                        ${optionsHTML}


                        <button
                            type="button"
                            class="remove-item"
                            data-action="remove"
                            data-id="${item.id}"
                        >

                            Remove

                        </button>

                    </div>

                </div>


                <!-- QUANTITY -->

                <div class="cart-item-quantity">

                    <button
                        type="button"
                        data-action="decrease"
                        data-id="${item.id}"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>


                    <span>
                        ${item.quantity}
                    </span>


                    <button
                        type="button"
                        data-action="increase"
                        data-id="${item.id}"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>


                <!-- PRICE -->

                <strong class="cart-item-price">

                    ${formatPrice(
                        Number(item.price) *
                        Number(item.quantity)
                    )}

                </strong>

            </article>

        `;

    }


    // ========================================
    // UPDATE SUMMARY
    // ========================================

    function updateSummary() {

        const subtotal =
            getSubtotal();


        elements.subtotal.textContent =
            formatPrice(subtotal);


        elements.total.textContent =
            formatPrice(subtotal);

    }


    // ========================================
    // FIND ITEM
    // ========================================

    function findItem(id) {

        return cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    }


    // ========================================
    // CHANGE QUANTITY
    // ========================================

    function changeQuantity(
        id,
        amount
    ) {

        const item =
            findItem(id);


        if (!item) {
            return;
        }


        item.quantity =
            Number(item.quantity) +
            amount;


        // Remove if quantity reaches zero

        if (item.quantity <= 0) {

            cart =
                cart.filter(
                    cartItem =>
                        Number(cartItem.id) !==
                        Number(id)
                );

        }


        saveCart();

        renderCart();

    }


    // ========================================
    // REMOVE ITEM
    // ========================================

    function removeItem(id) {

        cart =
            cart.filter(
                item =>
                    Number(item.id) !==
                    Number(id)
            );


        saveCart();

        renderCart();

    }


    // ========================================
    // HANDLE CART ACTIONS
    // ========================================

    function handleCartAction(event) {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.action;


        const id =
            button.dataset.id;


        switch (action) {

            case "increase":

                changeQuantity(
                    id,
                    1
                );

                break;


            case "decrease":

                changeQuantity(
                    id,
                    -1
                );

                break;


            case "remove":

                removeItem(id);

                break;

        }

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
    // EVENTS
    // ========================================

    function initEvents() {

        elements.cartItems?.addEventListener(
            "click",
            handleCartAction
        );

    }


    // ========================================
    // INITIALIZE
    // ========================================

    function init() {

        loadCart();

        renderCart();

        initEvents();

        initMenu();

        setYear();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    CartPage.init
);