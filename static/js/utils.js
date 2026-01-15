function showToast(message, type = "info", duration = 2500) {
    const toast = $(`<div class="toast ${type}">${message}</div>`);

    $("#toast-container").append(toast);

    setTimeout(() => {
        toast.css("animation", "toastOut 0.3s ease forwards");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
