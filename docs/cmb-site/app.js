const button = document.querySelector("#language");
let fa = false;
function applyLanguage() { document.documentElement.lang = fa ? "fa" : "en"; document.documentElement.dir = fa ? "rtl" : "ltr"; document.querySelectorAll("[data-en]").forEach((element) => { element.textContent = element.dataset[fa ? "fa" : "en"]; }); button.textContent = fa ? "English" : "فارسی"; button.setAttribute("aria-label", fa ? "Switch to English" : "Switch to Persian"); }
button.addEventListener("click", () => { fa = !fa; applyLanguage(); });
