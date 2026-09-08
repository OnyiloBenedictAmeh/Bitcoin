import { showToast } from "./toast.js";

(() => {
    let mode = "login";
    const form = document.getElementById("authForm");
    const nameField = document.getElementById("nameField");
    const title = document.getElementById("authTitle");
    const submit = document.getElementById("authSubmit");
    const message = document.getElementById("authMessage");
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");

    function setMode(nextMode) {
        mode = nextMode === "register" ? "register" : "login";
        document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("active", item.dataset.mode === mode));
        nameField.hidden = mode !== "register";
        title.textContent = mode === "register" ? "Create account" : "Sign in";
        submit.textContent = mode === "register" ? "Create account" : "Sign in";
        document.getElementById("authName").required = mode === "register";
        message.textContent = "";
    }

    if (params.get("mode")) setMode(params.get("mode"));

    document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));

    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.textContent = "";
        submit.disabled = true;
        const email = document.getElementById("authEmail").value.trim();
        const password = document.getElementById("authPassword").value;
        try {
            if (mode === "register") {
                const register = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: document.getElementById("authName").value.trim(), email, password }) });
                const result = await register.json();
                if (!register.ok || !result.success) throw new Error(result.message || "Unable to create account");
            }
            const login = await fetch("/api/auth/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
            const result = await login.json();
            if (!login.ok || !result.success) throw new Error(result.message || "Unable to sign in");
            const safeReturnTo = returnTo && /^[-a-zA-Z0-9_./?=&%]+$/.test(returnTo) && !returnTo.startsWith("//")
                ? returnTo
                : "account.html";
            window.location.href = result.user.role === "admin" ? "admin/dashboard.html" : safeReturnTo;
        } catch (error) {
            message.textContent = error.message || "Something went wrong";
            showToast(message.textContent);
            submit.disabled = false;
        }
    });
})();
