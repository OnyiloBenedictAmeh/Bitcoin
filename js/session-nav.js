async function syncCustomerNavigation() {
    const authActions = document.querySelectorAll("[data-session-nav]");

    if (!authActions.length) return;

    try {
        const response = await fetch("/api/customer/me", {
            credentials: "include",
            cache: "no-store"
        });

        if (response.ok) {
            authActions.forEach(container => {
                container.innerHTML = `
                    <a href="account.html" class="auth-login" aria-label="My account">
                        <i class="bx bx-user"></i>
                        Account
                    </a>
                `;
            });
        }
    } catch (error) {
        console.warn("CUSTOMER SESSION CHECK ERROR:", error);
    } finally {
        authActions.forEach(container => container.removeAttribute("data-session-nav"));
    }
}

syncCustomerNavigation();
