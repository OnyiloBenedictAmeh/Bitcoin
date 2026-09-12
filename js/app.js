// ============================================
// STORE APPLICATION
// ============================================

import { CartApi, renderCartCount } from "./cart-api.js";
import "./toast.js";


const StoreApp = (() => {

    // ========================================
    // STATE
    // ========================================

    const state = {

        cartCount: 0,

        searchQuery: "",
        products: []

    };


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        menuBtn:
            document.getElementById(
                "menuBtn"
            ),

        mainNav:
            document.getElementById(
                "mainNav"
            ),

        cartCount:
            document.querySelector(
                ".cart-count"
            ),

        currentYear:
            document.getElementById(
                "currentYear"
            ),

        featuredProducts:
            document.getElementById(
                "featuredProducts"
            )

    };


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

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ========================================
    // RENDER FEATURED PRODUCTS
    // ========================================

    function renderFeaturedProducts(
        productList = state.products
    ) {

        if (!elements.featuredProducts) {
            return;
        }


        if (!productList.length) {

            elements.featuredProducts.innerHTML = `

                <div class="search-empty">

                    <i class="bx bx-search-alt"></i>

                    <h3>
                        No products found
                    </h3>

                    <p>
                        Try searching for something else.
                    </p>

                </div>

            `;

            return;

        }


        elements.featuredProducts.innerHTML =

            productList
                .map(product => `

                    <article
                        class="product-card"
                    >

                        <a
                            href="product.html?id=${encodeURIComponent(
                                product.id
                            )}"
                        >

                            <div class="product-info">

                                <span
                                    class="product-category"
                                >
                                    ${escapeHtml(
                                        product.category
                                    )}
                                </span>


                                <h3
                                    class="product-name"
                                >
                                    ${escapeHtml(
                                        product.name
                                    )}
                                </h3>


                                <p
                                    class="product-description"
                                >
                                    ${escapeHtml(
                                        product.description
                                    )}
                                </p>

                            </div>

                        </a>

                    </article>

                `)
                .join("");

    }


    // ========================================
    // SEARCH PRODUCTS
    // ========================================

    function searchProducts(query) {

        const search =
            String(query || "")
                .trim()
                .toLowerCase();


        state.searchQuery =
            search;


        if (!search) {

            renderFeaturedProducts();

            return state.products;

        }


        const results =
            state.products.filter(product => {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();


                const category =
                    String(
                        product.category || ""
                    ).toLowerCase();


                const description =
                    String(
                        product.description || ""
                    ).toLowerCase();


                return (

                    name.includes(search) ||

                    category.includes(search) ||

                    description.includes(search)

                );

            });


        renderFeaturedProducts(
            results
        );


        return results;

    }


    // ========================================
    // SEARCH BAR
    // ========================================

    function initSearch() {
        const searchButton = document.getElementById("searchToggle");
        const searchPanel = document.getElementById("homeSearch");
        const searchInput = document.getElementById("homeProductSearch");
        const searchForm = document.getElementById("homeSearchForm");
        const clearButton = document.getElementById("homeClearSearch");

        if (!searchButton || !searchPanel || !searchInput) {
            return;
        }

        searchButton.addEventListener("click", () => {
            const open = searchPanel.hidden;
            searchPanel.hidden = !open;
            searchPanel.classList.toggle("is-visible", open);
            if (open) searchInput.focus();
        });
        searchInput.addEventListener("input", () => searchProducts(searchInput.value));
        clearButton?.addEventListener("click", () => {
            searchInput.value = "";
            searchProducts("");
            searchInput.focus();
        });
        searchForm?.addEventListener("submit", event => {
            event.preventDefault();
            const query = searchInput.value.trim();
            window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        });

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
    // YEAR
    // ========================================

    function setCurrentYear() {

        if (elements.currentYear) {

            elements.currentYear.textContent =
                new Date().getFullYear();

        }

    }


    // ========================================
    // CUSTOMER SESSION
    // ========================================

    async function syncAccountNavigation() {

        const authActions =
            document.querySelector(
                ".auth-actions"
            );

        if (!authActions) {
            return;
        }

        try {

            const response = await fetch(
                "/api/customer/me",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                return;
            }

            authActions.innerHTML = `
                <a
                    href="account.html"
                    class="auth-login"
                    aria-label="My account"
                >
                    <i class="bx bx-user"></i>
                    Account
                </a>
            `;

        } catch (error) {

            // Leave the guest links visible when the session check is unavailable.
            console.warn(
                "CUSTOMER SESSION CHECK ERROR:",
                error
            );

        }

    }


    // ========================================
    // INITIALIZE
    // ========================================

    async function init() {

        await syncAccountNavigation();

        try {
            const response = await fetch("/api/products");
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Unable to load products");
            state.products = (data.products || []).map(product => ({
                ...product,
                image: product.images?.[0]?.url || ""
            }));
        } catch (error) {
            console.error("PRODUCT LOAD ERROR:", error);
        }

        try { renderCartCount(await CartApi.list()); } catch (error) { if (!error.unauthorized) console.error("CART LOAD ERROR:", error); }

        renderFeaturedProducts();

        initSearch();

        initNavigation();

        setCurrentYear();

    }


    return {

        init,

        searchProducts

    };

})();


document.addEventListener(
    "DOMContentLoaded",
    () => {

        StoreApp.init();

    }
);
