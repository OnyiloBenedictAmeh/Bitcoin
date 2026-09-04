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

let adminCategories = [];
let editingCategoryId = null;
let productImages = [];
let unsavedUploadedImageUrls = new Set();
let adminOrders = [];
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


                if (section === "products") {
    loadAdminProducts();
}

if (section === "categories") {
    loadAdminCategories();
}

if (section === "orders") {
    loadAdminOrders();
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

    editingProductId = null;

    productImages = [];
    unsavedUploadedImageUrls = new Set();

    renderProductImagePreview();

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

    document.getElementById("productEditorStatus").value = "active";


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

    unsavedUploadedImageUrls = new Set();


    /*
    ========================================
    LOAD EXISTING PRODUCT IMAGES
    ========================================
    */

    productImages =
        Array.isArray(product.images)
            ? product.images
                .sort(
                    (a, b) =>
                        Number(a.sortOrder || 0) -
                        Number(b.sortOrder || 0)
                )
                .map((image, index) => ({
                    url:
                        image.url || "",

                    pathname:
                        image.pathname || "",

                    originalName:
                        image.alt ||
                        "Product image",

                    sortOrder:
                        index,

                    primary:
                        index === 0
                }))
            : [];


    renderProductImagePreview();


    /*
    ========================================
    PRODUCT FORM
    ========================================
    */

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

    document.getElementById("productEditorStatus").value =
        product.status === "inactive" ? "inactive" : "active";


    clearProductFormMessage();


    document.getElementById(
        "productImageMessage"
    ).textContent =
        "";


    document.getElementById(
        "productImageMessage"
    ).className =
        "form-message";


    document.getElementById(
        "productModal"
    ).hidden = false;

}

/*
========================================
CLOSE PRODUCT MODAL
========================================
*/

function closeProductModal({ discardUploads = true } = {}) {

    document.getElementById(
        "productModal"
    ).hidden = true;


    editingProductId =
        null;

    if (discardUploads) cleanupUnsavedProductImages();

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
            ).checked,

        status: document.getElementById("productEditorStatus").value

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
            
        )
        
        {

            throw new Error(
                data.message ||
                "Unable to save product"
            );

        }
const savedProductId =
    data.product?.id || editingProductId;

if (!savedProductId) {
    throw new Error(
        "Product was saved but no product ID was returned"
    );
}
// Save product images
const orderedImages = getOrderedProductImages();

const imageResponse = await fetch(
    "/api/admin/products/images",
    {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            productId: savedProductId,
            images: orderedImages.map((image, index) => ({
                url: image.url,
                altText: image.originalName || "",
                sortOrder: index
            }))
        })
    }
);

const imageData =
    await imageResponse.json();

if (!imageResponse.ok) {
    throw new Error(
        imageData.message ||
        "Product saved, but images could not be saved"
    );
}
unsavedUploadedImageUrls = new Set();
        showProductFormMessage(
            editingProductId
                ? "Product updated successfully."
                : "Product created successfully.",
            "success"
        );


        await loadAdminProducts();


        setTimeout(
            () => {

                closeProductModal({ discardUploads: false });

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
CATEGORY EVENTS
========================================
*/

function initializeCategoryManagement() {

    document
        .getElementById("addCategoryButton")
        ?.addEventListener(
            "click",
            openAddCategory
        );

    document
        .getElementById("closeCategoryModal")
        ?.addEventListener(
            "click",
            closeCategoryModal
        );

    document
        .getElementById("cancelCategoryButton")
        ?.addEventListener(
            "click",
            closeCategoryModal
        );

    document
        .getElementById("categoryForm")
        ?.addEventListener(
            "submit",
            saveCategory
        );

    document
        .getElementById("adminCategorySearch")
        ?.addEventListener(
            "input",
            renderAdminCategories
        );

    document
        .getElementById("categoryModal")
        ?.addEventListener(
            "click",
            event => {

                if (event.target.id === "categoryModal") {
                    closeCategoryModal();
                }

            }
        );
}
/*
========================================
INITIALIZE DASHBOARD
========================================
*/

function initializeDashboard() {

    initializeNavigation();
    initializeProductFilters();
    initializeCategoryManagement();
    initializeProductImageUpload();
    populateProductCategories();

    document.getElementById("addProductButton")?.addEventListener("click", openAddProduct);

    document.getElementById("closeProductModal")?.addEventListener("click", closeProductModal);

    document.getElementById("cancelProductButton")?.addEventListener("click", closeProductModal);

    document.getElementById("productForm")?.addEventListener("submit", saveProduct);

    document.getElementById("productModal")?.addEventListener("click", event => {

        if (event.target.id === "productModal") {
            closeProductModal();
        }

    });

    logoutButton?.addEventListener("click", logoutAdmin);

    loadAdminProducts();
    loadAdminCategories();

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

// ========================================
// CATEGORIES
// ========================================

async function loadAdminCategories() {

    try {

        const response = await fetch(
            "/api/admin/categories",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load categories"
            );
        }

        adminCategories = data.categories || [];

        renderAdminCategories();

    } catch (error) {

        console.error(
            "LOAD CATEGORIES ERROR:",
            error
        );

        showCategoryMessage(
            error.message,
            "error"
        );
    }
}


function renderAdminCategories() {

    const table =
        document.getElementById(
            "adminCategoriesTable"
        );

    const empty =
        document.getElementById(
            "categoriesEmpty"
        );

    const searchInput =
        document.getElementById(
            "adminCategorySearch"
        );

    if (!table) {
        return;
    }


    const search =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";


    const filtered =
        adminCategories.filter(category => {

            return (
                String(category.name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                String(category.slug || "")
                    .toLowerCase()
                    .includes(search)

                ||

                String(category.description || "")
                    .toLowerCase()
                    .includes(search)
            );

        });


    table.innerHTML = "";


    if (!filtered.length) {

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    table.innerHTML =
        filtered
            .map(category => {

                const created =
                    category.created_at
                        ? new Date(
                            category.created_at
                        ).toLocaleDateString()
                        : "—";


                return `
                    <tr>

                        <td>
                            <div class="product-name">
                                ${escapeHtml(
                                    category.name
                                )}
                            </div>
                        </td>


                        <td>
                            <code>
                                ${escapeHtml(
                                    category.slug
                                )}
                            </code>
                        </td>


                        <td>
                            <div class="product-description">
                                ${escapeHtml(
                                    category.description || "—"
                                )}
                            </div>
                        </td>


                        <td>
                            ${Number(
                                category.product_count || 0
                            )}
                        </td>


                        <td>
                            ${created}
                        </td>


                        <td>

                            <div class="product-actions">

                                <button
                                    class="product-action"
                                    type="button"
                                    title="Edit"
                                    data-edit-category="${category.id}"
                                >
                                    <i class="bx bx-edit"></i>
                                </button>


                                <button
                                    class="product-action"
                                    type="button"
                                    title="Delete"
                                    data-delete-category="${category.id}"
                                >
                                    <i class="bx bx-trash"></i>
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            })
            .join("");


    /*
    ========================================
    EDIT CATEGORY BUTTONS
    ========================================
    */

    table
        .querySelectorAll(
            "[data-edit-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openEditCategory(
                        button.dataset.editCategory
                    );

                }
            );

        });


    /*
    ========================================
    DELETE CATEGORY BUTTONS
    ========================================
    */

    table
        .querySelectorAll(
            "[data-delete-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCategory(
                        button.dataset.deleteCategory
                    );

                }
            );

        });

}


function openAddCategory() {

    editingCategoryId =
        null;


    const form =
        document.getElementById(
            "categoryForm"
        );


    if (!form) {
        return;
    }


    form.reset();


    document.getElementById(
        "categoryId"
    ).value = "";


    document.getElementById(
        "categoryModalTitle"
    ).textContent =
        "Add Category";


    clearCategoryMessage();


    document.getElementById(
        "categoryModal"
    ).hidden = false;


    document.getElementById(
        "categoryName"
    ).focus();

}


function openEditCategory(id) {

    const category =
        adminCategories.find(
            item => item.id === id
        );

    if (!category) return;

    editingCategoryId = id;

    document.getElementById(
        "categoryId"
    ).value = category.id;

    document.getElementById(
        "categoryName"
    ).value = category.name || "";

    document.getElementById(
        "categoryDescription"
    ).value =
        category.description || "";

    document.getElementById(
        "categoryModalTitle"
    ).textContent = "Edit Category";

    clearCategoryMessage();

    document.getElementById(
        "categoryModal"
    ).hidden = false;
}

async function populateProductCategories() {

    const select =
        document.getElementById("productCategory");

    if (!select) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/admin/categories",
                {
                    method: "GET",
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
                "Unable to load categories"
            );
        }

        const currentValue =
            select.value;

        select.innerHTML = `
            <option value="">
                Select a category
            </option>
        `;

        data.categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value =
                category.id;

            option.textContent =
                category.name;

            select.appendChild(option);

        });

        if (currentValue) {
            select.value = currentValue;
        }

    } catch (error) {

        console.error(
            "LOAD PRODUCT CATEGORIES ERROR:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load categories
            </option>
        `;

    }

}
function initializeProductImageUpload() {

    const dropzone =
        document.getElementById(
            "productImageDropzone"
        );

    const input =
        document.getElementById(
            "productImageInput"
        );

    if (!dropzone || !input) {
        return;
    }

    dropzone.addEventListener(
        "click",
        () => input.click()
    );

    input.addEventListener(
        "change",
        event => {

            handleProductImages(
                event.target.files
            );

            input.value = "";

        }
    );

    dropzone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            dropzone.classList.add(
                "dragover"
            );

        }
    );

    dropzone.addEventListener(
        "dragleave",
        () => {

            dropzone.classList.remove(
                "dragover"
            );

        }
    );

    dropzone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            dropzone.classList.remove(
                "dragover"
            );

            handleProductImages(
                event.dataTransfer.files
            );

        }
    );

}
async function handleProductImages(files) {

    const fileList = Array.from(files);

    if (
        productImages.length + fileList.length > 20
    ) {
        showProductImageMessage(
            "You can upload a maximum of 20 images per product.",
            "error"
        );
        return;
    }

    if (!fileList.length) {
        return;
    }

    const message =
        document.getElementById(
            "productImageMessage"
        );

    for (const file of fileList) {

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ].includes(file.type)
        ) {

            message.textContent =
                `${file.name} is not a supported image.`;

            message.className =
                "form-message error";

            continue;
        }

        if (file.size > 8 * 1024 * 1024) {

            message.textContent =
                `${file.name} is larger than 8 MB.`;

            message.className =
                "form-message error";

            continue;
        }

        try {

            message.textContent =
                `Uploading ${file.name}...`;

            message.className =
                "form-message";

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            const response =
                await fetch(
                    "/api/admin/images/upload",
                    {
                        method: "POST",
                        credentials: "include",
                        body: formData
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
                    "Upload failed"
                );

            }

            productImages.push({

                url:
                    data.image.url,

                pathname:
                    data.image.pathname,

                originalName:
                    data.image.originalName,

                sortOrder:
                    productImages.length,

                primary:
                    productImages.length === 0

            });

            unsavedUploadedImageUrls.add(data.image.url);

            renderProductImagePreview();

            message.textContent =
                "Image uploaded successfully.";

            message.className =
                "form-message success";

        } catch (error) {

            console.error(
                "PRODUCT IMAGE UPLOAD ERROR:",
                error
            );

            message.textContent =
                error.message ||
                "Unable to upload image.";

            message.className =
                "form-message error";
        }
    }
}
function showProductImageMessage(
    text,
    type = "info"
) {

    const element =
        document.getElementById(
            "productImageMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        text;

    element.className =
        `form-message ${type}`;
}
function renderProductImagePreview() {

    const container =
        document.getElementById(
            "productImagePreview"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        productImages
            .map((image, index) => {

                return `
                    <div
                        class="product-image-item ${image.primary ? "primary" : ""}"
                        data-image-index="${index}"
                    >

                        <img
                            src="${escapeHtml(image.url)}"
                            alt="${escapeHtml(
                                image.originalName || "Product image"
                            )}"
                        >

                        ${
                            image.primary
                                ? `
                                    <span class="product-image-primary">
                                        Primary
                                    </span>
                                `
                                : ""
                        }

                        <div class="product-image-actions">

                            ${
                                !image.primary
                                    ? `
                                        <button
                                            type="button"
                                            class="set-primary"
                                            data-primary-image="${index}"
                                        >
                                            <i class="bx bx-star"></i>
                                            Primary
                                        </button>
                                    `
                                    : ""
                            }

                            <button
                                type="button"
                                class="remove-image"
                                data-remove-image="${index}"
                            >
                                <i class="bx bx-trash"></i>
                                Remove
                            </button>

                        </div>

                    </div>
                `;

            })
            .join("");


    container
        .querySelectorAll(
            "[data-primary-image]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setPrimaryProductImage(
                        Number(
                            button.dataset.primaryImage
                        )
                    );

                }
            );

        });


    container
        .querySelectorAll(
            "[data-remove-image]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    removeProductImage(
                        Number(
                            button.dataset.removeImage
                        )
                    );

                }
            );

        });

}
function setPrimaryProductImage(index) {
    const selected = productImages[index];
    if (!selected) return;

    productImages = [selected, ...productImages.filter((_, imageIndex) => imageIndex !== index)]
        .map((image, imageIndex) => ({ ...image, primary: imageIndex === 0, sortOrder: imageIndex }));

    renderProductImagePreview();

}
function removeProductImage(index) {
    const [removedImage] = productImages.splice(
        index,
        1
    );

    if (removedImage && unsavedUploadedImageUrls.has(removedImage.url)) {
        unsavedUploadedImageUrls.delete(removedImage.url);
        cleanupProductImages([removedImage.url]);
    }

    if (
        productImages.length &&
        !productImages.some(
            image => image.primary
        )
    ) {

        productImages[0].primary = true;

    }

    productImages =
        productImages.map(
            (image, imageIndex) => ({
                ...image,
                sortOrder: imageIndex
            })
        );

    renderProductImagePreview();

}

async function loadAdminOrders() {
    const table = document.getElementById("adminOrdersTable");
    if (!table) return;
    table.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Loading orders...</td></tr>';
    try {
        const response = await fetch("/api/admin/orders", { credentials: "include", cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load orders");
        adminOrders = data.orders || [];
        renderAdminOrders();
    } catch (error) {
        table.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Unable to load orders.</td></tr>';
        console.error("ADMIN ORDERS ERROR:", error);
    }
}

function renderAdminOrders() {
    const table = document.getElementById("adminOrdersTable");
    if (!table) return;
    if (!adminOrders.length) {
        table.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">No orders yet.</td></tr>';
        return;
    }
    table.innerHTML = adminOrders.map(order => `
        <tr>
          <td><strong>${escapeHtml(String(order.id).slice(0, 8).toUpperCase())}</strong><div class="product-description">${new Date(order.created_at).toLocaleString()}</div></td>
          <td>${escapeHtml(order.customer_name || "Guest")}<div class="product-description">${escapeHtml(order.customer_email || "")}</div></td>
          <td>$${Number(order.total || 0).toFixed(2)}</td>
          <td><span class="product-status ${escapeHtml(order.payment_status)}">${escapeHtml(order.payment_status)}</span>${order.bitcoin_txid ? '<div class="product-description">TX submitted</div>' : ''}</td>
          <td><span class="product-status ${escapeHtml(order.status)}">${escapeHtml(order.status)}</span></td>
          <td><div class="table-actions">
            ${order.payment_status === 'submitted' ? `<button class="secondary-button btn-small" data-order-payment="${order.id}">Confirm payment</button>` : ''}
            ${order.status !== 'fulfilled' && order.payment_status === 'confirmed' ? `<button class="secondary-button btn-small" data-order-status="${order.id}">Mark fulfilled</button>` : ''}
          </div></td>
        </tr>`).join("");
    table.querySelectorAll("[data-order-payment]").forEach(button => button.addEventListener("click", () => updateAdminOrder(button.dataset.orderPayment, { payment_status: "confirmed" })));
    table.querySelectorAll("[data-order-status]").forEach(button => button.addEventListener("click", () => updateAdminOrder(button.dataset.orderStatus, { status: "fulfilled" })));
}

async function updateAdminOrder(id, update) {
    try {
        const response = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
            method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update)
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to update order");
        await loadAdminOrders();
    } catch (error) {
        showProductsMessage(error.message || "Unable to update order", "error");
    }
}

function getOrderedProductImages() {
    const primaryIndex = productImages.findIndex(image => image.primary);
    if (primaryIndex > 0) setPrimaryProductImage(primaryIndex);
    return productImages;
}

function cleanupUnsavedProductImages() {
    const urls = [...unsavedUploadedImageUrls];
    unsavedUploadedImageUrls = new Set();
    cleanupProductImages(urls);
}

async function cleanupProductImages(urls) {
    if (!urls.length) return;
    try {
        await fetch("/api/admin/images/cleanup", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls })
        });
    } catch (error) {
        console.error("UNSAVED IMAGE CLEANUP ERROR:", error);
    }
}
function closeCategoryModal() {

    document.getElementById(
        "categoryModal"
    ).hidden = true;

    editingCategoryId = null;
}


async function saveCategory(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "categoryName"
        ).value.trim();


    const description =
        document.getElementById(
            "categoryDescription"
        ).value.trim();


    const button =
        document.getElementById(
            "saveCategoryButton"
        );


    const message =
        document.getElementById(
            "categoryFormMessage"
        );


    if (!name) {

        message.textContent =
            "Category name is required.";

        message.className =
            "form-message error";

        return;
    }


    const isEditing =
        Boolean(editingCategoryId);


    button.disabled =
        true;

    button.textContent =
        isEditing
            ? "Updating..."
            : "Saving...";


    message.textContent =
        "";

    message.className =
        "form-message";


    try {

        const url =
            isEditing
                ? `/api/admin/categories?id=${encodeURIComponent(
                    editingCategoryId
                )}`
                : "/api/admin/categories";


        const response =
            await fetch(
                url,
                {
                    method:
                        isEditing
                            ? "PATCH"
                            : "POST",

                    credentials:
                        "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            name,
                            description
                        })
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
                "Unable to save category"
            );

        }


        message.textContent =
            isEditing
                ? "Category updated successfully."
                : "Category created successfully.";


        message.className =
            "form-message success";


        await loadAdminCategories();
        await populateProductCategories();

        setTimeout(
            () => {

                closeCategoryModal();

            },
            700
        );


    } catch (error) {

        console.error(
            "SAVE CATEGORY ERROR:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to save category.";


        message.className =
            "form-message error";


    } finally {

        button.disabled =
            false;

        button.textContent =
            "Save Category";

    }

}


async function deleteCategory(id) {

    const category =
        adminCategories.find(
            item => item.id === id
        );

    if (!category) return;

    const confirmed =
        confirm(
            `Delete "${category.name}"?`
        );

    if (!confirmed) return;

    try {

        const response =
            await fetch(
                `/api/admin/categories?id=${encodeURIComponent(id)}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to delete category"
            );
        }

        await loadAdminCategories();

        showCategoryMessage(
            "Category deleted successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "DELETE CATEGORY ERROR:",
            error
        );

        showCategoryMessage(
            error.message,
            "error"
        );
    }
}


function showCategoryMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "categoriesMessage"
        );

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `products-message ${type}`;

}


function clearCategoryMessage() {

    const categoryMessage =
        document.getElementById(
            "categoriesMessage"
        );

    const formMessage =
        document.getElementById(
            "categoryFormMessage"
        );


    if (categoryMessage) {

        categoryMessage.textContent =
            "";

        categoryMessage.className =
            "products-message";

    }


    if (formMessage) {

        formMessage.textContent =
            "";

        formMessage.className =
            "form-message";

    }

}
/*
========================================
START
========================================
*/

checkAdminSession();
