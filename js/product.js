// ============================================
// PRODUCT PAGE
// ============================================

const ProductPage = (() => {

    // ========================================
    // PRODUCT DATA
    // ========================================

    let products = [

        {
            id: 1,

            name: "Modern Wireless Headphones",

            category: "Electronics",

            price: 129,

            featured: true,

            description:
                "A comfortable pair of wireless headphones designed for everyday listening.",

            images: [
                "assets/images/product-placeholder.jpg",
                "assets/images/product-placeholder.jpg",
                "assets/images/product-placeholder.jpg"
            ],

            options: {
                Color: [
                    "Black",
                    "White"
                ]
            }
        },


        {
            id: 2,

            name: "Premium Everyday Backpack",

            category: "Fashion",

            price: 89,

            featured: true,

            description:
                "A versatile everyday backpack designed for work, travel and daily use.",

            images: [
                "assets/images/product-placeholder.jpg",
                "assets/images/product-placeholder.jpg"
            ],

            options: {
                Color: [
                    "Black",
                    "Brown"
                ]
            }
        },


        {
            id: 3,

            name: "Minimal Desk Lamp",

            category: "Home",

            price: 64,

            featured: false,

            description:
                "A clean and modern desk lamp designed to bring comfortable lighting to your workspace.",

            images: [
                "assets/images/product-placeholder.jpg"
            ],

            options: {}
        },


        {
            id: 4,

            name: "Smart Watch",

            category: "Electronics",

            price: 179,

            featured: true,

            description:
                "A modern smartwatch with a clean design for everyday activity and notifications.",

            images: [
                "assets/images/product-placeholder.jpg"
            ],

            options: {
                Color: [
                    "Black",
                    "Silver"
                ]
            }
        },


        {
            id: 5,

            name: "Classic Sneakers",

            category: "Fashion",

            price: 110,

            featured: false,

            description:
                "Classic everyday sneakers combining comfort with a clean timeless design.",

            images: [
                "assets/images/product-placeholder.jpg"
            ],

            options: {
                Size: [
                    "40",
                    "41",
                    "42",
                    "43",
                    "44"
                ]
            }
        }

    ];


    // ========================================
    // STATE
    // ========================================

    const state = {

        product: null,

        quantity: 1,

        selectedOptions: {},

        activeImage: 0

    };


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        detail:
            document.getElementById(
                "productDetail"
            ),

        related:
            document.getElementById(
                "relatedProducts"
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
    // GET PRODUCT ID
    // ========================================

    function getProductId() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return Number(
            params.get("id")
        );

    }


    // ========================================
    // FIND PRODUCT
    // ========================================

    function findProduct(id) {

        return products.find(
            product =>
                String(product.id) === String(id)
        );

    }

    async function loadProducts() {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.products)) {
            throw new Error(data.message || "Unable to load product");
        }

        products = data.products.map(product => ({
            ...product,
            images: Array.isArray(product.images)
                ? product.images.map(image => typeof image === "string" ? image : image.url).filter(Boolean)
                : []
        }));
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
    // RENDER PRODUCT
    // ========================================

    function renderProduct() {

        const product =
            state.product;


        if (!product) {

            elements.detail.innerHTML = `

                <div class="product-not-found">

                    <i class="bx bx-package"></i>

                    <h1>
                        Product not found
                    </h1>

                    <p>
                        The product you're looking
                        for doesn't exist.
                    </p>

                    <a
                        href="shop.html"
                        class="btn btn-primary"
                    >
                        Back to Shop
                    </a>

                </div>

            `;

            return;

        }


        const optionsHTML =
            Object.entries(
                product.options || {}
            ).map(
                ([name, values]) => `

                    <div class="product-option">

                        <h3>
                            ${name}
                        </h3>

                        <div
                            class="option-list"
                            data-option="${name}"
                        >

                            ${values.map(
                                (value, index) => `

                                    <button
                                        type="button"
                                        class="option-btn ${
                                            index === 0
                                                ? "active"
                                                : ""
                                        }"
                                        data-value="${value}"
                                    >
                                        ${value}
                                    </button>

                                `
                            ).join("")}

                        </div>

                    </div>

                `
            ).join("");


        // Default options

        Object.entries(
            product.options || {}
        ).forEach(
            ([name, values]) => {

                state.selectedOptions[name] =
                    values[0];

            }
        );


        elements.detail.innerHTML = `

            <div class="product-gallery">

                <div class="product-main-image">

                    <img
                        id="mainProductImage"
                        src="${product.images[0]}"
                        alt="${product.name}"
                    >

                </div>


                <div class="product-thumbnails">

                    ${product.images.map(
                        (image, index) => `

                            <button
                                type="button"
                                class="product-thumbnail ${
                                    index === 0
                                        ? "active"
                                        : ""
                                }"
                                data-index="${index}"
                            >

                                <img
                                    src="${image}"
                                    alt="${product.name}"
                                >

                            </button>

                        `
                    ).join("")}

                </div>

            </div>


            <div class="product-content">

                <span class="product-category">
                    ${product.category}
                </span>


                <h1>
                    ${product.name}
                </h1>


                <div class="product-rating">

                    <span class="stars">
                        ★★★★★
                    </span>

                    <span>
                        4.9
                    </span>

                </div>


                <div class="product-detail-price">

                    ${formatPrice(product.price)}

                </div>


                <p class="product-description">

                    ${product.description}

                </p>


                <div class="product-options">

                    ${optionsHTML}

                </div>


                <div class="quantity-control">

                    <button
                        type="button"
                        id="decreaseQuantity"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span id="quantity">
                        1
                    </span>

                    <button
                        type="button"
                        id="increaseQuantity"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>


                <button
                    type="button"
                    class="btn btn-primary add-to-cart-btn"
                    id="addToCart"
                >

                    <i class="bx bx-shopping-bag"></i>

                    Add to Cart

                </button>


                <div class="product-meta">

                    <div>

                        <i class="bx bx-check-shield"></i>

                        Secure checkout

                    </div>

                    <div>

                        <i class="bx bx-package"></i>

                        Fast delivery

                    </div>

                    <div>

                        <i class="bx bx-refresh"></i>

                        Easy returns

                    </div>

                </div>

            </div>

        `;


        initProductEvents();

    }


    // ========================================
    // IMAGE SWITCHING
    // ========================================

    function changeImage(index) {

        if (!state.product) {
            return;
        }

        const image =
            state.product.images[index];

        const mainImage =
            document.getElementById(
                "mainProductImage"
            );

        if (!mainImage || !image) {
            return;
        }

        mainImage.src = image;

        state.activeImage = index;


        document
            .querySelectorAll(
                ".product-thumbnail"
            )
            .forEach(
                thumbnail => {

                    thumbnail.classList.toggle(
                        "active",
                        Number(
                            thumbnail.dataset.index
                        ) === index
                    );

                }
            );

    }


    // ========================================
    // QUANTITY
    // ========================================

    function updateQuantity(amount) {

        state.quantity += amount;

        if (state.quantity < 1) {
            state.quantity = 1;
        }

        const stock = Number(state.product?.stock);
        const maximum = Number.isFinite(stock) ? stock : 99;

        if (state.quantity > maximum) {
            state.quantity = Math.max(maximum, 1);
        }


        const quantity =
            document.getElementById(
                "quantity"
            );

        if (quantity) {

            quantity.textContent =
                state.quantity;

        }

    }


    // ========================================
    // OPTIONS
    // ========================================

    function selectOption(event) {

        const button =
            event.target.closest(
                ".option-btn"
            );

        if (!button) {
            return;
        }


        const option =
            button.closest(
                ".option-list"
            );


        const optionName =
            option.dataset.option;


        state.selectedOptions[optionName] =
            button.dataset.value;


        option
            .querySelectorAll(
                ".option-btn"
            )
            .forEach(
                item => {

                    item.classList.toggle(
                        "active",
                        item === button
                    );

                }
            );

    }


    // ========================================
    // ADD TO CART
    // ========================================

    function addToCart() {

        if (Number(state.product.stock) <= 0) return;

        const cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                ) || "[]"
            );


        const selectedOptions = JSON.stringify(state.selectedOptions);
        const existing = cart.find(item =>
            String(item.id) === String(state.product.id) &&
            JSON.stringify(item.options || {}) === selectedOptions
        );


        if (existing) {

            existing.quantity = Math.min(
                Number(state.product.stock),
                existing.quantity + state.quantity
            );

        } else {

            cart.push({

                id:
                    state.product.id,

                name:
                    state.product.name,

                price:
                    state.product.price,

                image:
                    state.product.images?.[0] || "",

                quantity:
                    state.quantity,

                stock: Number(state.product.stock),

                options:
                    {
                        ...state.selectedOptions
                    }

            });

        }


        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );


        updateCartCount();


        const button =
            document.getElementById(
                "addToCart"
            );


        if (button) {

            const original =
                button.innerHTML;


            button.innerHTML =
                `<i class="bx bx-check"></i>
                 Added to Cart`;


            button.disabled = true;


            setTimeout(
                () => {

                    button.innerHTML =
                        original;

                    button.disabled =
                        false;

                },
                1500
            );

        }

    }


    // ========================================
    // CART COUNT
    // ========================================

    function updateCartCount() {

        const cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                ) || "[]"
            );


        const count =
            cart.reduce(
                (total, item) =>
                    total + item.quantity,
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
    // RELATED PRODUCTS
    // ========================================

    function renderRelatedProducts() {

        if (
            !state.product ||
            !elements.related
        ) {
            return;
        }


        const related =
            products
                .filter(
                    product =>
                        product.category ===
                            state.product.category &&
                        product.id !==
                            state.product.id
                )
                .slice(0, 3);


        elements.related.innerHTML =
            related.map(
                product => `

                    <article class="product-card">

                        <a
                            href="product.html?id=${product.id}"
                            class="product-link"
                        >

                            <div class="product-image">

                                <i class="bx bx-image"></i>

                            </div>


                            <div class="product-info">

                                <span class="product-category">
                                    ${product.category}
                                </span>

                                <h3 class="product-name">
                                    ${product.name}
                                </h3>

                                <span class="product-price">
                                    ${formatPrice(product.price)}
                                </span>

                            </div>

                        </a>

                    </article>

                `
            ).join("");

    }


    // ========================================
    // PRODUCT EVENTS
    // ========================================

    function initProductEvents() {

        document
            .querySelectorAll(
                ".product-thumbnail"
            )
            .forEach(
                thumbnail => {

                    thumbnail.addEventListener(
                        "click",
                        () =>
                            changeImage(
                                Number(
                                    thumbnail.dataset.index
                                )
                            )
                    );

                }
            );


        document
            .querySelectorAll(
                ".option-list"
            )
            .forEach(
                list => {

                    list.addEventListener(
                        "click",
                        selectOption
                    );

                }
            );


        document
            .getElementById(
                "decreaseQuantity"
            )
            ?.addEventListener(
                "click",
                () =>
                    updateQuantity(-1)
            );


        document
            .getElementById(
                "increaseQuantity"
            )
            ?.addEventListener(
                "click",
                () =>
                    updateQuantity(1)
            );


        document
            .getElementById(
                "addToCart"
            )
            ?.addEventListener(
                "click",
                addToCart
            );

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
    // INITIALIZE
    // ========================================

    async function init() {

        try {
            await loadProducts();
        } catch (error) {
            console.error("PRODUCT LOAD ERROR:", error);
            products = [];
        }

        const id = getProductId();


        state.product =
            findProduct(id);


        renderProduct();

        renderRelatedProducts();

        updateCartCount();

        initMenu();

        setYear();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    ProductPage.init
);
