// 🚫 Right Click Block
document.addEventListener("contextmenu", (e) => e.preventDefault());

// 🚫 DevTools Block
document.addEventListener("keydown", function (e) {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
    (e.ctrlKey && e.key === "U")
  ) {
    e.preventDefault();
  }
});

// 🚫 DevTools detect + redirect
setInterval(() => {
  if (window.outerWidth - window.innerWidth > 160) {
    window.location.href = "https://br-30-kart.vercel.app/";
  }
}, 1000);

// 🚫 Copy block
document.addEventListener("copy", (e) => e.preventDefault());

// 🚫 Text select block
document.addEventListener("selectstart", (e) => e.preventDefault());

// 🚫 Debugger trap
setInterval(() => {
  debugger;
}, 100);
// cleane consol
if (location.hostname !== "localhost") {
  console.log = function () {};
  console.warn = function () {};
  console.error = function () {};
}
