console.log("DASHBOARD JS LOADED");


/*
========================================
AUTH ELEMENTS
========================================
*/

const loading =
    document.getElementById(
        "dashboardLoading"
    );

const dashboard =
    document.getElementById(
        "adminDashboard"
    );

const userName =
    document.getElementById(
        "adminUserName"
    );

const userRole =
    document.getElementById(
        "adminUserRole"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/*
========================================
PRODUCT STATE
========================================
*/

let adminProducts = [];

let editingProductId = null;


/*
========================================
AUTHENTICATION
========================================
*/

async function checkAdminSession() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.authenticated
        ) {

            window.location.href =
                "/admin/";

            return;

        }


        userName.textContent =
            data.user.name;

        userRole.textContent =
            data.user.role.toUpperCase();


        loading.style.display =
            "none";

        dashboard.hidden =
            false;


        initializeDashboard();


    } catch (error) {

        console.error(
            "Dashboard authentication error:",
            error
        );

        window.location.href =
            "/admin/";

    }

}


/*
========================================
NAVIGATION
========================================
*/

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".admin-nav-item"
        );


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const section =
                    item.dataset.section;


                navItems.forEach(nav => {

                    nav.classList.remove(
                        "active"
                    );

                });


                item.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".admin-section"
                    )
                    .forEach(sectionElement => {

                        sectionElement.hidden =
                            true;

                    });


                const target =
                    document.getElementById(
                        `section-${section}`
                    );


                if (target) {

                    target.hidden =
                        false;

                }


                if (
                    section === "products"
                ) {

                    loadAdminProducts();

                }

            }
        );

    });

}


/*
========================================
LOAD PRODUCTS
========================================
*/

async function loadAdminProducts() {

    const table =
        document.getElementById(
            "adminProductsTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;padding:40px;">
                Loading products...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                "/api/admin/products",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load products"
            );

        }


        adminProducts =
            Array.isArray(data.products)
                ? data.products
                : [];


        renderAdminProducts();

        updateProductCount();


    } catch (error) {

        console.error(
            "ADMIN PRODUCTS ERROR:",
            error
        );


        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;">
                    Unable to load products.
                </td>
            </tr>
        `;

    }

}


/*
========================================
RENDER PRODUCTS
========================================
*/

function renderAdminProducts() {

    const table =
        document.getElementById(
            "adminProductsTable"
        );

    const empty =
        document.getElementById(
            "productsEmpty"
        );

    const search =
        (
            document.getElementById(
                "adminProductSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const statusFilter =
        document.getElementById(
            "adminProductStatus"
        )?.value || "all";


    let products =
        [...adminProducts];


    /*
    SEARCH
    */

    if (search) {

        products =
            products.filter(product => {

                return (

                    String(
                        product.name || ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        product.sku || ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        product.brand || ""
                    )
                    .toLowerCase()
                    .includes(search)

                );

            });

    }


    /*
    STATUS
    */

    if (statusFilter !== "all") {

        products =
            products.filter(
                product =>
                    product.status ===
                    statusFilter
            );

    }


    if (!products.length) {

        table.innerHTML = "";

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    table.innerHTML =
        products
            .map(product => {

                const price =
                    Number(
                        product.price || 0
                    );


                const comparePrice =
                    product.compare_price !== null
                        ? Number(
                            product.compare_price
                        )
                        : null;


                return `

                    <tr>

                        <td>

                            <div class="product-name">
                                ${escapeHtml(
                                    product.name
                                )}
                            </div>

                            ${
                                product.brand
                                    ? `
                                        <div class="product-description">
                                            ${escapeHtml(
                                                product.brand
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                        </td>


                        <td>
                            ${escapeHtml(
                                product.sku || "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                product.category || "Uncategorized"
                            )}
                        </td>


                        <td>

                            $${price.toFixed(2)}

                            ${
                                comparePrice !== null
                                    ? `
                                        <div class="product-description">
                                            $${comparePrice.toFixed(2)}
                                        </div>
                                      `
                                    : ""
                            }

                        </td>


                        <td>
                            ${product.stock}
                        </td>


                        <td>

                            <span
                                class="product-status ${product.status}"
                            >
                                ${escapeHtml(
                                    product.status
                                )}
                            </span>

                        </td>


                        <td>

                            <div class="product-actions">

                                <button
                                    class="product-action"
                                    type="button"
                                    title="Edit"
                                    data-edit-product="${product.id}"
                                >
                                    <i class="bx bx-edit"></i>
                                </button>


                                ${
                                    product.status === "active"
                                        ? `
                                            <button
                                                class="product-action"
                                                type="button"
                                                title="Deactivate"
                                                data-delete-product="${product.id}"
                                            >
                                                <i class="bx bx-trash"></i>
                                            </button>
                                          `
                                        : ""
                                }

                            </div>

                        </td>

                    </tr>

                `;

            })
            .join("");


    /*
    EDIT BUTTONS
    */

    table
        .querySelectorAll(
            "[data-edit-product]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openEditProduct(
                        button.dataset.editProduct
                    );

                }
            );

        });


    /*
    DELETE BUTTONS
    */

    table
        .querySelectorAll(
            "[data-delete-product]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deactivateProduct(
                        button.dataset.deleteProduct
                    );

                }
            );

        });

}


/*
========================================
PRODUCT COUNT
========================================
*/

function updateProductCount() {

    const element =
        document.getElementById(
            "totalProducts"
        );


    if (!element) {
        return;
    }


    element.textContent =
        adminProducts.filter(
            product =>
                product.status === "active"
        ).length;

}


/*
========================================
OPEN ADD PRODUCT
========================================
*/

function openAddProduct() {

    editingProductId =
        null;


    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Add Product";


    document.getElementById(
        "productForm"
    ).reset();


    document.getElementById(
        "productId"
    ).value = "";


    clearProductFormMessage();


    document.getElementById(
        "productModal"
    ).hidden = false;

}


/*
========================================
OPEN EDIT PRODUCT
========================================
*/

function openEditProduct(id) {

    const product =
        adminProducts.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!product) {
        return;
    }


    editingProductId =
        product.id;


    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Edit Product";


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name || "";


    document.getElementById(
        "productDescription"
    ).value =
        product.description || "";


    document.getElementById(
        "productPrice"
    ).value =
        product.price ?? "";


    document.getElementById(
        "productComparePrice"
    ).value =
        product.compare_price ?? "";


    document.getElementById(
        "productStock"
    ).value =
        product.stock ?? "";


    document.getElementById(
        "productSku"
    ).value =
        product.sku || "";


    document.getElementById(
        "productBrand"
    ).value =
        product.brand || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.category_id || "";


    document.getElementById(
        "productFeatured"
    ).checked =
        Boolean(
            product.featured
        );


    clearProductFormMessage();


    document.getElementById(
        "productModal"
    ).hidden = false;

}


/*
========================================
CLOSE PRODUCT MODAL
========================================
*/

function closeProductModal() {

    document.getElementById(
        "productModal"
    ).hidden = true;


    editingProductId =
        null;

}


/*
========================================
SAVE PRODUCT
========================================
*/

async function saveProduct(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveProductButton"
        );


    const message =
        document.getElementById(
            "productFormMessage"
        );


    const payload = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),

        category_id:
            document.getElementById(
                "productCategory"
            ).value.trim() ||
            null,

        price:
            document.getElementById(
                "productPrice"
            ).value,

        compare_price:
            document.getElementById(
                "productComparePrice"
            ).value,

        stock:
            document.getElementById(
                "productStock"
            ).value,

        sku:
            document.getElementById(
                "productSku"
            ).value.trim(),

        brand:
            document.getElementById(
                "productBrand"
            ).value.trim(),

        featured:
            document.getElementById(
                "productFeatured"
            ).checked

    };


    button.disabled =
        true;

    button.textContent =
        editingProductId
            ? "Updating..."
            : "Saving...";


    clearProductFormMessage();


    try {

        const url =
            editingProductId
                ? `/api/admin/products?id=${encodeURIComponent(
                    editingProductId
                )}`
                : "/api/admin/products";


        const response =
            await fetch(
                url,
                {
                    method:
                        editingProductId
                            ? "PATCH"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to save product"
            );

        }


        showProductFormMessage(
            editingProductId
                ? "Product updated successfully."
                : "Product created successfully.",
            "success"
        );


        await loadAdminProducts();


        setTimeout(
            () => {

                closeProductModal();

            },
            600
        );


    } catch (error) {

        console.error(
            "SAVE PRODUCT ERROR:",
            error
        );


        showProductFormMessage(
            error.message ||
            "Unable to save product.",
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            "Save Product";

    }

}


/*
========================================
DEACTIVATE PRODUCT
========================================
*/

async function deactivateProduct(id) {

    const product =
        adminProducts.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!product) {
        return;
    }


    const confirmed =
        window.confirm(
            `Deactivate "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/products?id=${encodeURIComponent(
                    id
                )}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to deactivate product"
            );

        }


        await loadAdminProducts();


    } catch (error) {

        console.error(
            "DEACTIVATE PRODUCT ERROR:",
            error
        );


        showProductsMessage(
            error.message ||
            "Unable to deactivate product.",
            "error"
        );

    }

}


/*
========================================
SEARCH + FILTER
========================================
*/

function initializeProductFilters() {

    const search =
        document.getElementById(
            "adminProductSearch"
        );

    const status =
        document.getElementById(
            "adminProductStatus"
        );


    search?.addEventListener(
        "input",
        renderAdminProducts
    );


    status?.addEventListener(
        "change",
        renderAdminProducts
    );

}


/*
========================================
MESSAGES
========================================
*/

function showProductFormMessage(
    text,
    type
) {

    const element =
        document.getElementById(
            "productFormMessage"
        );


    element.textContent =
        text;


    element.className =
        `form-message ${type}`;

}


function clearProductFormMessage() {

    const element =
        document.getElementById(
            "productFormMessage"
        );


    element.textContent =
        "";


    element.className =
        "form-message";

}


function showProductsMessage(
    text,
    type
) {

    const element =
        document.getElementById(
            "productsMessage"
        );


    element.textContent =
        text;


    element.className =
        `products-message ${type}`;

}


/*
========================================
HTML ESCAPE
========================================
*/

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/*
========================================
INITIALIZE DASHBOARD
========================================
*/

function initializeDashboard() {

    initializeNavigation();

    initializeProductFilters();


    document
        .getElementById(
            "addProductButton"
        )
        ?.addEventListener(
            "click",
            openAddProduct
        );


    document
        .getElementById(
            "closeProductModal"
        )
        ?.addEventListener(
            "click",
            closeProductModal
        );


    document
        .getElementById(
            "cancelProductButton"
        )
        ?.addEventListener(
            "click",
            closeProductModal
        );


    document
        .getElementById(
            "productForm"
        )
        ?.addEventListener(
            "submit",
            saveProduct
        );


    document
        .getElementById(
            "productModal"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "productModal"
                ) {

                    closeProductModal();

                }

            }
        );


    logoutButton?.addEventListener(
        "click",
        logoutAdmin
    );


    /*
    Load products immediately
    so the dashboard count is real.
    */

    loadAdminProducts();

}


/*
========================================
LOGOUT
========================================
*/

async function logoutAdmin() {

    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "/admin/";

}


/*
========================================
START
========================================
*/

checkAdminSession();