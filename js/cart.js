// ============================================
// CART PAGE
// ============================================

import { CartApi, renderCartCount } from "./cart-api.js";

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

    async function loadCart() {
        try { cart = await CartApi.list(); }
        catch (error) {
            if (error.unauthorized) { window.location.href = "customer-auth.html"; return; }
            console.error("Error loading cart:", error); cart = [];
        }
    }


    // ========================================
    // SAVE CART
    // ========================================

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

        renderCartCount(cart);

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
                data-id="${item.cartItemId}"
            >

                <!-- PRODUCT -->

                <div class="cart-item-product">

                    <div class="cart-item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="bx bx-image"></i>'}

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
                            data-id="${item.cartItemId}"
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
                        data-id="${item.cartItemId}"
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
                        data-id="${item.cartItemId}"
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
            item => String(item.cartItemId) === String(id)
        );

    }


    // ========================================
    // CHANGE QUANTITY
    // ========================================

    async function changeQuantity(
        id,
        amount
    ) {

        const item =
            findItem(id);


        if (!item) {
            return;
        }


        try {
            const next = Number(item.quantity) + amount;
            cart = next <= 0 ? await CartApi.remove(item.cartItemId) : await CartApi.setQuantity(item.cartItemId, next);
            renderCart();
        } catch (error) { alert(error.message || "Unable to update cart"); }

    }


    // ========================================
    // REMOVE ITEM
    // ========================================

    async function removeItem(id) {
        const item = findItem(id);
        if (!item) return;
        try { cart = await CartApi.remove(item.cartItemId); renderCart(); }
        catch (error) { alert(error.message || "Unable to remove item"); }
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

    async function init() {

        await loadCart();

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
