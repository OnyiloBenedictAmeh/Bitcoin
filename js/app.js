// ============================================
// STORE APPLICATION
// ============================================

import { products } from "./products.js";


const StoreApp = (() => {

    // ========================================
    // STATE
    // ========================================

    const state = {

        cartCount: 0,

        searchQuery: ""

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
        productList = products
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

                            <div class="product-image">

                                ${
                                    product.image

                                        ? `
                                            <img
                                                src="${escapeHtml(
                                                    product.image
                                                )}"
                                                alt="${escapeHtml(
                                                    product.name
                                                )}"
                                            >
                                        `

                                        : `
                                            <i
                                                class="bx bx-image"
                                            ></i>
                                        `
                                }

                            </div>


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


                                <span
                                    class="product-price"
                                >
                                    ${formatPrice(
                                        product.price
                                    )}
                                </span>

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

            return products;

        }


        const results =
            products.filter(product => {

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

        const searchButton =
            document.querySelector(
                '[aria-label="Search"]'
            );


        if (!searchButton) {
            return;
        }


        searchButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    `shop.html?search=${encodeURIComponent(
                        state.searchQuery
                    )}`;

            }
        );

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
    // INITIALIZE
    // ========================================

    function init() {

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