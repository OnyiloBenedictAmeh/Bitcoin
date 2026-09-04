// ============================================
// ACCOUNT PAGE
// ============================================

const AccountPage = (() => {

    let account = null;

    let orders = [];


    // ========================================
    // ELEMENTS
    // ========================================

    const elements = {

        // Profile
        name:
            document.getElementById(
                "accountName"
            ),

        firstName:
            document.getElementById(
                "accountFirstName"
            ),

        lastName:
            document.getElementById(
                "accountLastName"
            ),

        email:
            document.getElementById(
                "accountEmail"
            ),

        phone:
            document.getElementById(
                "accountPhone"
            ),

        form:
            document.getElementById(
                "profileForm"
            ),

        message:
            document.getElementById(
                "profileMessage"
            ),


        // Orders
        orders:
            document.getElementById(
                "accountOrders"
            ),


        // Address
        address:
            document.getElementById(
                "savedAddress"
            ),

        editAddress:
            document.getElementById(
                "editAddress"
            ),

        addressForm:
            document.getElementById(
                "addressForm"
            ),

        cancelAddress:
            document.getElementById(
                "cancelAddress"
            ),

        addressFirstName:
            document.getElementById(
                "addressFirstName"
            ),

        addressLastName:
            document.getElementById(
                "addressLastName"
            ),

        addressStreet:
            document.getElementById(
                "addressStreet"
            ),

        addressCity:
            document.getElementById(
                "addressCity"
            ),

        addressState:
            document.getElementById(
                "addressState"
            ),

        addressPostalCode:
            document.getElementById(
                "addressPostalCode"
            ),

        addressCountry:
            document.getElementById(
                "addressCountry"
            ),


        // Settings
        orderUpdates:
            document.getElementById(
                "orderUpdates"
            ),

        marketingEmails:
            document.getElementById(
                "marketingEmails"
            ),


        // Account
        signOut:
            document.getElementById(
                "signOut"
            ),


        // General
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
    // STORAGE
    // ========================================

    function loadData() {

        try {

            account = JSON.parse(
                localStorage.getItem(
                    "account"
                )
            );

        } catch {

            account = null;

        }


        try {

            orders = JSON.parse(
                localStorage.getItem(
                    "orders"
                ) || "[]"
            );

        } catch {

            orders = [];

        }


        /*
         * Create a demo account automatically
         * if none exists yet.
         */

        if (!account) {

            account = {

                firstName: "Customer",

                lastName: "",

                email: "",

                phone: "",

                address: null

            };


            localStorage.setItem(
                "account",
                JSON.stringify(account)
            );

        }

    }

    async function loadRemoteData() {
        const [profileResponse, ordersResponse] = await Promise.all([
            fetch("/api/customer/profile", { credentials: "include" }),
            fetch("/api/orders", { credentials: "include" })
        ]);
        if (!profileResponse.ok) throw new Error("Please sign in to view your account");
        const profile = await profileResponse.json();
        const remoteOrders = ordersResponse.ok ? await ordersResponse.json() : { orders: [] };
        const nameParts = String(profile.user.name || "").trim().split(/\s+/);
        account = {
            firstName: nameParts.shift() || "Customer", lastName: nameParts.join(" "),
            email: profile.user.email || "", phone: profile.user.phone || "", address: null
        };
        orders = (remoteOrders.orders || []).map(order => ({
            id: order.id, subtotal: order.subtotal, total: order.total, status: order.status,
            paymentStatus: order.payment_status, paymentMethod: order.payment_method, createdAt: order.created_at, items: []
        }));
    }


    // ========================================
    // RENDER PROFILE
    // ========================================

    function renderProfile() {

        if (elements.name) {

            elements.name.textContent =
                account.firstName ||
                "Customer";

        }


        if (elements.firstName) {

            elements.firstName.value =
                account.firstName || "";

        }


        if (elements.lastName) {

            elements.lastName.value =
                account.lastName || "";

        }


        if (elements.email) {

            elements.email.value =
                account.email || "";

        }


        if (elements.phone) {

            elements.phone.value =
                account.phone || "";

        }

    }


    // ========================================
    // RENDER ORDERS
    // ========================================

    function renderOrders() {

        if (!elements.orders) {
            return;
        }


        if (!orders.length) {

            elements.orders.innerHTML = `

                <div class="account-empty">

                    <i class="bx bx-package"></i>

                    <h3>
                        No orders yet
                    </h3>

                    <p>
                        Your purchases will appear here.
                    </p>

                    <a
                        href="shop.html"
                        class="btn btn-primary"
                    >
                        Start Shopping
                    </a>

                </div>

            `;

            return;

        }


        elements.orders.innerHTML =
            orders
                .slice(0, 3)
                .map(
                    order => `

                        <a
                            href="order.html?id=${encodeURIComponent(order.id)}"
                            class="account-order"
                        >

                            <div>

                                <strong>
                                    ${order.id}
                                </strong>

                                <span>
                                    ${formatDate(order.createdAt)}
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${formatPrice(order.subtotal)}
                                </strong>

                                <span
                                    class="order-status ${order.status}"
                                >
                                    ${formatStatus(order.status)}
                                </span>

                            </div>

                        </a>

                    `
                )
                .join("");

    }


    // ========================================
    // RENDER ADDRESS
    // ========================================

    function renderAddress() {

        if (!elements.address) {
            return;
        }


        /*
         * No saved address
         */

        if (!account.address) {

            elements.address.innerHTML = `

                <i class="bx bx-map"></i>

                <div>

                    <strong>
                        No saved address
                    </strong>

                    <p>
                        Your saved delivery address
                        will appear here.
                    </p>

                </div>

            `;


            if (elements.editAddress) {

                elements.editAddress.innerHTML = `

                    <i class="bx bx-edit"></i>

                    Add Address

                `;

            }


            return;

        }


        /*
         * Saved address exists
         */

        const address =
            account.address;


        elements.address.innerHTML = `

            <i class="bx bx-map"></i>

            <div>

                <strong>
                    ${escapeHtml(address.firstName)}
                    ${escapeHtml(address.lastName)}
                </strong>

                <p>

                    ${escapeHtml(address.address)}
                    <br>

                    ${escapeHtml(address.city)},
                    ${escapeHtml(address.state)}

                    ${
                        address.postalCode
                            ? `<br>${escapeHtml(address.postalCode)}`
                            : ""
                    }

                    <br>

                    ${escapeHtml(address.country)}

                </p>

            </div>

        `;


        if (elements.editAddress) {

            elements.editAddress.innerHTML = `

                <i class="bx bx-edit"></i>

                Edit Address

            `;

        }

    }


    // ========================================
    // OPEN ADDRESS FORM
    // ========================================

    function openAddressForm() {

        if (!elements.addressForm) {
            return;
        }


        /*
         * If an address already exists,
         * load it into the form.
         */

        if (account.address) {

            const address =
                account.address;


            if (elements.addressFirstName) {

                elements.addressFirstName.value =
                    address.firstName || "";

            }


            if (elements.addressLastName) {

                elements.addressLastName.value =
                    address.lastName || "";

            }


            if (elements.addressStreet) {

                elements.addressStreet.value =
                    address.address || "";

            }


            if (elements.addressCity) {

                elements.addressCity.value =
                    address.city || "";

            }


            if (elements.addressState) {

                elements.addressState.value =
                    address.state || "";

            }


            if (elements.addressPostalCode) {

                elements.addressPostalCode.value =
                    address.postalCode || "";

            }


            if (elements.addressCountry) {

                elements.addressCountry.value =
                    address.country || "";

            }

        }


        /*
         * Show the form
         */

        elements.addressForm.hidden =
            false;


        /*
         * Change button text
         */

        if (elements.editAddress) {

            elements.editAddress.innerHTML = `

                <i class="bx bx-edit"></i>

                ${
                    account.address
                        ? "Edit Address"
                        : "Add Address"
                }

            `;

        }

    }


    // ========================================
    // CLOSE ADDRESS FORM
    // ========================================

    function closeAddressForm() {

        if (!elements.addressForm) {
            return;
        }


        elements.addressForm.hidden =
            true;


        /*
         * Reset form fields only when
         * cancelling.
         */

        elements.addressForm.reset();


        /*
         * Restore button text
         */

        if (elements.editAddress) {

            elements.editAddress.innerHTML = `

                <i class="bx bx-edit"></i>

                ${
                    account.address
                        ? "Edit Address"
                        : "Add Address"
                }

            `;

        }

    }


    // ========================================
    // SAVE ADDRESS
    // ========================================

    function saveAddress(event) {

        event.preventDefault();


        /*
         * Make sure all required elements exist.
         */

        if (
            !elements.addressFirstName ||
            !elements.addressLastName ||
            !elements.addressStreet ||
            !elements.addressCity ||
            !elements.addressState ||
            !elements.addressCountry
        ) {

            return;

        }


        /*
         * Save address
         */

        account.address = {

            firstName:
                elements.addressFirstName.value.trim(),

            lastName:
                elements.addressLastName.value.trim(),

            address:
                elements.addressStreet.value.trim(),

            city:
                elements.addressCity.value.trim(),

            state:
                elements.addressState.value.trim(),

            postalCode:
                elements.addressPostalCode?.value.trim() || "",

            country:
                elements.addressCountry.value

        };


        /*
         * Save account to localStorage.
         */

        localStorage.setItem(
            "account",
            JSON.stringify(account)
        );


        /*
         * Update address display.
         */

        renderAddress();


        /*
         * Hide form.
         */

        elements.addressForm.hidden =
            true;


        /*
         * Show success message.
         */

        showAddressMessage(
            "Your delivery address has been saved."
        );


        /*
         * Clear the form after saving.
         */

        elements.addressForm.reset();

    }


    // ========================================
    // ADDRESS SUCCESS MESSAGE
    // ========================================

    function showAddressMessage(message) {

        /*
         * Remove an existing message first.
         */

        const existing =
            document.querySelector(
                ".address-success-message"
            );


        if (existing) {
            existing.remove();
        }


        const messageElement =
            document.createElement("div");


        messageElement.className =
            "account-message address-success-message";


        messageElement.textContent =
            message;


        if (elements.address) {

            elements.address.insertAdjacentElement(
                "afterend",
                messageElement
            );

        }


        setTimeout(
            () => {

                messageElement.remove();

            },
            2500
        );

    }


    // ========================================
    // SAVE PROFILE
    // ========================================

    async function saveProfile(event) {

        event.preventDefault();


        account.firstName =
            elements.firstName.value.trim();


        account.lastName =
            elements.lastName.value.trim();


        account.email =
            elements.email.value.trim();


        account.phone =
            elements.phone.value.trim();


        try {
            const response = await fetch("/api/customer/profile", {
                method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `${account.firstName} ${account.lastName}`.trim(), email: account.email, phone: account.phone })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Unable to save profile");
        } catch (error) {
            if (elements.message) { elements.message.textContent = error.message; elements.message.hidden = false; }
            return;
        }


        renderProfile();


        if (elements.message) {

            elements.message.textContent =
                "Your profile has been saved.";


            elements.message.hidden =
                false;


            setTimeout(
                () => {

                    elements.message.hidden =
                        true;

                },
                2500
            );

        }

    }


    // ========================================
    // NAVIGATION
    // ========================================

    function initNavigation() {

        const buttons =
            document.querySelectorAll(
                ".account-nav-item[data-section]"
            );


        const sections =
            document.querySelectorAll(
                ".account-section"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            button.dataset.section;


                        buttons.forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item === button
                                );

                            }
                        );


                        sections.forEach(
                            section => {

                                section.classList.toggle(
                                    "active",
                                    section.id ===
                                        `${target}Section`
                                );

                            }
                        );

                    }
                );

            }
        );

    }


    // ========================================
    // SIGN OUT
    // ========================================

    async function signOut() {

        /*
         * MVP only.
         *
         * Later this will call the real
         * authentication service.
         */

        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        localStorage.removeItem("account");


        window.location.href =
            "index.html";

    }


    // ========================================
    // CART COUNT
    // ========================================

    function updateCartCount() {

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


        const count =
            cart.reduce(
                (total, item) =>
                    total + Number(item.quantity),
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
    // HELPERS
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


    function formatDate(date) {

        return new Intl.DateTimeFormat(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        ).format(
            new Date(date)
        );

    }


    function formatStatus(status) {

        return String(status)
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            );

    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

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
    // SETTINGS
    // ========================================

    function loadSettings() {

        const settings =
            account.settings || {};


        if (elements.orderUpdates) {

            elements.orderUpdates.checked =
                settings.orderUpdates !== false;

        }


        if (elements.marketingEmails) {

            elements.marketingEmails.checked =
                settings.marketingEmails === true;

        }

    }


    function saveSettings() {

        account.settings = {

            orderUpdates:
                elements.orderUpdates?.checked ?? true,

            marketingEmails:
                elements.marketingEmails?.checked ?? false

        };


        localStorage.setItem(
            "account",
            JSON.stringify(account)
        );

    }


    // ========================================
    // EVENTS
    // ========================================

    function initEvents() {

        /*
         * Profile
         */

        elements.form?.addEventListener(
            "submit",
            saveProfile
        );


        /*
         * Sign out
         */

        elements.signOut?.addEventListener(
            "click",
            signOut
        );


        /*
         * Address
         */

        elements.editAddress?.addEventListener(
            "click",
            openAddressForm
        );


        elements.cancelAddress?.addEventListener(
            "click",
            closeAddressForm
        );


        elements.addressForm?.addEventListener(
            "submit",
            saveAddress
        );


        /*
         * Settings
         */

        elements.orderUpdates?.addEventListener(
            "change",
            saveSettings
        );


        elements.marketingEmails?.addEventListener(
            "change",
            saveSettings
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
    // INIT
    // ========================================

    async function init() {

        loadData();

        try {
            await loadRemoteData();
        } catch (error) {
            console.error("ACCOUNT LOAD ERROR:", error);
            window.location.href = "customer-auth.html";
            return;
        }

        renderProfile();

        renderOrders();

        renderAddress();

        loadSettings();

        initNavigation();

        initEvents();

        initMenu();

        updateCartCount();

        setYear();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    AccountPage.init
);
