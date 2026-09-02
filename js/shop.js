// ============================================
// STORE SHOP
// ============================================

const ShopApp = (() => {

    // ========================================
    // STATE
    // ========================================

    const state = {

        products: [],

        filteredProducts: [],

        search: "",

        category: "all",

        minPrice: null,

        maxPrice: null,

        sort: "featured"

    };


    // ========================================
    // STORAGE KEY
    // ========================================

    /*
     * IMPORTANT:
     *
     * Your admin product system should save
     * products using this same key:
     *
     * "products"
     */

    const PRODUCTS_KEY = "products";


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        menuBtn:
            document.getElementById("menuBtn"),

        mainNav:
            document.getElementById("mainNav"),

        searchToggle:
            document.getElementById("searchToggle"),

        shopSearch:
            document.getElementById("shopSearch"),

        productSearch:
            document.getElementById("productSearch"),

        clearSearch:
            document.getElementById("clearSearch"),

        categoryFilters:
            document.getElementById("categoryFilters"),

        minPrice:
            document.getElementById("minPrice"),

        maxPrice:
            document.getElementById("maxPrice"),

        clearFilters:
            document.getElementById("clearFilters"),

        sortProducts:
            document.getElementById("sortProducts"),

        shopProducts:
            document.getElementById("shopProducts"),

        productResultCount:
            document.getElementById("productResultCount"),

        emptyProducts:
            document.getElementById("emptyProducts"),

        emptyClearButton:
            document.getElementById("emptyClearButton"),

        cartCount:
            document.querySelector(".cart-count"),

        currentYear:
            document.getElementById("currentYear")

    };


    // ========================================
    // LOAD PRODUCTS
    // ========================================

    async function loadProducts() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error(
                `Product API returned ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.products)) {
            throw new Error(
                "Invalid product API response"
            );
        }

        state.products = data.products.filter(product => {

            return (
                product &&
                product.status === "active"
            );

        });

        state.filteredProducts = [
            ...state.products
        ];

        renderCategoryFilters();

        applyFilters();

    } catch (error) {

        console.error(
            "Unable to load products from API:",
            error
        );

        state.products = [];

        state.filteredProducts = [];

        renderCategoryFilters();

        renderProducts();

    }

}

    // ========================================
    // NORMALIZE PRICE
    // ========================================

    function getProductPrice(product) {

        if (!product) {
            return 0;
        }


        /*
         * Supports:
         *
         * price: 129
         * price: "129"
         * price: "$129.00"
         */

        const value =
            String(
                product.price ?? 0
            )
                .replace(/[^0-9.-]/g, "");


        return Number(value) || 0;

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
    // ESCAPE HTML
    // ========================================

    function escapeHtml(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ========================================
    // GET PRODUCT IMAGE
    // ========================================

    function getProductImage(product) {

        /*
         * Supports common image property names
         * so the admin doesn't have to follow
         * one extremely strict structure.
         */

        if (
            product.image &&
            typeof product.image === "string"
        ) {

            return product.image;

        }


        if (
            product.imageUrl &&
            typeof product.imageUrl === "string"
        ) {

            return product.imageUrl;

        }


        if (
    Array.isArray(product.images) &&
    product.images.length
) {

    const firstImage = product.images[0];

    if (typeof firstImage === "string") {
        return firstImage;
    }

    if (
        firstImage &&
        typeof firstImage.url === "string"
    ) {
        return firstImage.url;
    }

}


        return "";

    }


    // ========================================
    // RENDER PRODUCT IMAGE
    // ========================================

    function renderProductImage(product) {

        const image =
            getProductImage(product);


        if (image) {

            return `

                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(
                        product.name || "Product"
                    )}"
                    loading="lazy"
                >

            `;

        }


        return `

            <div class="product-image-placeholder">

                <i class="bx bx-image"></i>

            </div>

        `;

    }


    // ========================================
    // RENDER PRODUCTS
    // ========================================

    function renderProducts() {

        if (!elements.shopProducts) {
            return;
        }


        const products =
            state.filteredProducts;


        if (elements.productResultCount) {

            elements.productResultCount.textContent =
                products.length;

        }


        if (!products.length) {

            elements.shopProducts.innerHTML = "";


            if (elements.emptyProducts) {

                elements.emptyProducts.hidden =
                    false;

            }


            return;

        }


        if (elements.emptyProducts) {

            elements.emptyProducts.hidden =
                true;

        }


        elements.shopProducts.innerHTML =
            products.map(product => {

                const id =
                    product.id ??
                    product.productId ??
                    "";


                const name =
                    product.name ||
                    "Unnamed Product";


                const category =
                    product.category ||
                    "Product";


                const price =
                    getProductPrice(product);


                return `

                    <article
                        class="product-card"
                        data-product-id="${escapeHtml(id)}"
                    >

                        <a
                            href="product.html?id=${encodeURIComponent(
                                id
                            )}"
                        >

                            <div class="product-image">

                                ${renderProductImage(
                                    product
                                )}

                            </div>


                            <div class="product-info">

                                <span
                                    class="product-category"
                                >
                                    ${escapeHtml(
                                        category
                                    )}
                                </span>


                                <h3
                                    class="product-name"
                                >
                                    ${escapeHtml(
                                        name
                                    )}
                                </h3>


                                <span
                                    class="product-price"
                                >
                                    ${formatPrice(
                                        price
                                    )}
                                </span>

                            </div>

                        </a>

                    </article>

                `;

            }).join("");

    }


    // ========================================
    // GET CATEGORIES
    // ========================================

    function getCategories() {

        const categories =
            state.products
                .map(product =>
                    product.category
                )
                .filter(Boolean)
                .map(category =>
                    String(category).trim()
                )
                .filter(Boolean);


        return [
            ...new Set(categories)
        ]
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );

    }


    // ========================================
    // RENDER CATEGORY FILTERS
    // ========================================

    function renderCategoryFilters() {

        if (!elements.categoryFilters) {
            return;
        }


        const categories =
            getCategories();


        elements.categoryFilters.innerHTML = `

            <label class="category-filter">

                <input
                    type="radio"
                    name="category"
                    value="all"
                    ${
                        state.category === "all"
                            ? "checked"
                            : ""
                    }
                >

                <span>All Products</span>

            </label>

        `;


        categories.forEach(category => {

            const checked =
                state.category === category
                    ? "checked"
                    : "";


            elements.categoryFilters.insertAdjacentHTML(
                "beforeend",
                `

                    <label class="category-filter">

                        <input
                            type="radio"
                            name="category"
                            value="${escapeHtml(
                                category
                            )}"
                            ${checked}
                        >

                        <span>
                            ${escapeHtml(
                                category
                            )}
                        </span>

                    </label>

                `
            );

        });


        elements.categoryFilters
            .querySelectorAll(
                'input[name="category"]'
            )
            .forEach(input => {

                input.addEventListener(
                    "change",
                    () => {

                        state.category =
                            input.value;

                        applyFilters();

                    }
                );

            });

    }


    // ========================================
    // APPLY FILTERS
    // ========================================

    function applyFilters() {

        let products =
            [...state.products];


        // ====================================
        // SEARCH
        // ====================================

        const search =
            state.search
                .trim()
                .toLowerCase();


        if (search) {

            products =
                products.filter(product => {

                    const searchableText = [

                        product.name,

                        product.category,

                        product.description,

                        product.shortDescription,

                        product.brand,

                        product.sku,

                        ...(Array.isArray(
                            product.tags
                        )
                            ? product.tags
                            : [])

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText
                        .includes(search);

                });

        }


        // ====================================
        // CATEGORY
        // ====================================

        if (
            state.category &&
            state.category !== "all"
        ) {

            products =
                products.filter(product => {

                    return String(
                        product.category || ""
                    ).trim() ===
                    state.category;

                });

        }


        // ====================================
        // MIN PRICE
        // ====================================

        if (
            state.minPrice !== null &&
            !Number.isNaN(
                state.minPrice
            )
        ) {

            products =
                products.filter(product => {

                    return getProductPrice(
                        product
                    ) >= state.minPrice;

                });

        }


        // ====================================
        // MAX PRICE
        // ====================================

        if (
            state.maxPrice !== null &&
            !Number.isNaN(
                state.maxPrice
            )
        ) {

            products =
                products.filter(product => {

                    return getProductPrice(
                        product
                    ) <= state.maxPrice;

                });

        }


        // ====================================
        // SORT
        // ====================================

        switch (
            state.sort
        ) {

            case "price-low":

                products.sort(
                    (a, b) =>
                        getProductPrice(a) -
                        getProductPrice(b)
                );

                break;


            case "price-high":

                products.sort(
                    (a, b) =>
                        getProductPrice(b) -
                        getProductPrice(a)
                );

                break;


            case "name":

                products.sort(
                    (a, b) =>
                        String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            )
                        )
                );

                break;


            case "featured":

            default:

                /*
                 * Keep original admin order.
                 */

                break;

        }


        state.filteredProducts =
            products;


        renderProducts();

    }


    // ========================================
    // SEARCH
    // ========================================

    function handleSearch() {

        state.search =
            elements.productSearch?.value
                .trim() || "";


        applyFilters();

    }


    // ========================================
    // CLEAR SEARCH
    // ========================================

    function clearSearch() {

        if (
            elements.productSearch
        ) {

            elements.productSearch.value =
                "";

        }


        state.search =
            "";


        applyFilters();

    }


    // ========================================
    // SEARCH TOGGLE
    // ========================================

    function initSearchToggle() {

        if (
            !elements.searchToggle ||
            !elements.shopSearch
        ) {

            return;

        }


        elements.searchToggle.addEventListener(
            "click",
            () => {

                elements.shopSearch
                    .classList.toggle(
                        "is-open"
                    );


                if (
                    elements.shopSearch
                        .classList.contains(
                            "is-open"
                        )
                ) {

                    setTimeout(
                        () => {

                            elements.productSearch
                                ?.focus();

                        },
                        100
                    );

                }

            }
        );

    }


    // ========================================
    // PRICE FILTERS
    // ========================================

    function initPriceFilters() {

        elements.minPrice?.addEventListener(
            "input",
            () => {

                const value =
                    parseFloat(
                        elements.minPrice.value
                    );


                state.minPrice =
                    Number.isFinite(value)
                        ? value
                        : null;


                applyFilters();

            }
        );


        elements.maxPrice?.addEventListener(
            "input",
            () => {

                const value =
                    parseFloat(
                        elements.maxPrice.value
                    );


                state.maxPrice =
                    Number.isFinite(value)
                        ? value
                        : null;


                applyFilters();

            }
        );

    }


    // ========================================
    // SORT
    // ========================================

    function initSort() {

        elements.sortProducts?.addEventListener(
            "change",
            () => {

                state.sort =
                    elements.sortProducts.value;


                applyFilters();

            }
        );

    }


    // ========================================
    // CLEAR FILTERS
    // ========================================

    function clearFilters() {

        state.search = "";

        state.category = "all";

        state.minPrice = null;

        state.maxPrice = null;


        if (
            elements.productSearch
        ) {

            elements.productSearch.value =
                "";

        }


        if (
            elements.minPrice
        ) {

            elements.minPrice.value =
                "";

        }


        if (
            elements.maxPrice
        ) {

            elements.maxPrice.value =
                "";

        }


        if (
            elements.sortProducts
        ) {

            elements.sortProducts.value =
                "featured";

        }


        state.sort =
            "featured";


        renderCategoryFilters();

        applyFilters();

    }


    // ========================================
    // MOBILE NAVIGATION
    // ========================================

    function initNavigation() {

        if (
            !elements.menuBtn ||
            !elements.mainNav
        ) {

            return;

        }


        elements.menuBtn.addEventListener(
            "click",
            () => {

                elements.mainNav.classList.toggle(
                    "is-open"
                );

            }
        );

    }


    // ========================================
    // CART COUNT
    // ========================================

    function updateCartCount() {

        if (!elements.cartCount) {
            return;
        }


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


        if (!Array.isArray(cart)) {

            cart = [];

        }


        const count =
            cart.reduce(
                (total, item) => {

                    return total +
                        (
                            Number(
                                item.quantity
                            ) || 1
                        );

                },
                0
            );


        elements.cartCount.textContent =
            count;

    }


    // ========================================
    // CURRENT YEAR
    // ========================================

    function setCurrentYear() {

        if (
            elements.currentYear
        ) {

            elements.currentYear.textContent =
                new Date().getFullYear();

        }

    }


    // ========================================
    // STORAGE CHANGES
    // ========================================

   function initStorageListener() {

    window.addEventListener(
        "storage",
        event => {

            if (event.key === "cart") {

                updateCartCount();

            }

        }
    );

}


    // ========================================
    // EVENTS
    // ========================================

    function initEvents() {

        elements.productSearch?.addEventListener(
            "input",
            handleSearch
        );


        elements.clearSearch?.addEventListener(
            "click",
            clearSearch
        );


        elements.clearFilters?.addEventListener(
            "click",
            clearFilters
        );


        elements.emptyClearButton?.addEventListener(
            "click",
            clearFilters
        );

    }


    // ========================================
    // INIT
    // ========================================

    async function init() {

    await loadProducts();

    initSearchToggle();

    initPriceFilters();

    initSort();

    initEvents();

    initNavigation();

    initStorageListener();

    updateCartCount();

    setCurrentYear();

}


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    () => {

        ShopApp.init();

    }
);