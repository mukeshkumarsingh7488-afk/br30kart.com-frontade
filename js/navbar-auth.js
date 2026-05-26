document.addEventListener("DOMContentLoaded", () => {
  const navAccountBtn = document.getElementById("navAccountBtn");
  const loginRegisterLink = document.getElementById("loginRegisterLink");
  const logoutLink = document.getElementById("logoutLink");

  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const userName = userData.name || userData.fullName || "Account";

  if (token) {
    if (navAccountBtn) {
      navAccountBtn.innerHTML = `👤 ${userName} <span class="triangle-icon">▼</span>`;
    }

    if (loginRegisterLink) {
      loginRegisterLink.style.display = "none";
    }

    if (logoutLink) {
      logoutLink.style.display = "block";
    }
  } else {
    if (navAccountBtn) {
      navAccountBtn.innerHTML = `👤 Account <span class="triangle-icon">▼</span>`;
    }

    if (loginRegisterLink) {
      loginRegisterLink.style.display = "block";
    }

    if (logoutLink) {
      logoutLink.style.display = "none";
    }
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.clear();

      window.location.href = "/";
    });
  }
});
