const CONTAINER_ID = "toastNotifications";

function container() {
    let element = document.getElementById(CONTAINER_ID);
    if (element) return element;
    element = document.createElement("div");
    element.id = CONTAINER_ID;
    element.className = "toast-notifications";
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-atomic", "true");
    document.body.append(element);
    return element;
}

function ensureStyles() {
    if (document.getElementById("toastNotificationStyles")) return;
    const style = document.createElement("style");
    style.id = "toastNotificationStyles";
    style.textContent = ".toast-notifications{position:fixed;right:20px;bottom:20px;z-index:9999;display:grid;gap:10px;width:min(380px,calc(100vw - 32px))}.app-toast{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;border:1px solid #e5e5e5;border-radius:10px;background:#fff;color:#111;box-shadow:0 12px 30px rgba(0,0,0,.14);font:600 14px/1.4 system-ui,sans-serif;animation:toast-in .2s ease-out}.app-toast--error{border-color:#efb4b4}.app-toast--success{border-color:#a9d8b5}.app-toast i{font-size:19px}.app-toast button{margin-left:auto;border:0;background:transparent;color:inherit;font-size:20px;line-height:1;cursor:pointer}@keyframes toast-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}";
    document.head.append(style);
}

export function showToast(message, type = "error") {
    if (!message) return;
    ensureStyles();
    const toast = document.createElement("div");
    toast.className = `app-toast app-toast--${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    const icon = type === "success" ? "✓" : "!";
    toast.innerHTML = `<i aria-hidden="true">${icon}</i><span></span><button type="button" aria-label="Dismiss notification">×</button>`;
    toast.querySelector("span").textContent = String(message);
    const dismiss = () => toast.remove();
    toast.querySelector("button").addEventListener("click", dismiss);
    container().append(toast);
    window.setTimeout(dismiss, 5000);
}

window.showToast = showToast;

window.addEventListener("unhandledrejection", event => {
    const message = event.reason?.message || "Something went wrong. Please try again.";
    showToast(message);
});

window.addEventListener("error", event => {
    if (event.error?.message) showToast(event.error.message);
});
