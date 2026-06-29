//#region Navbar Authentication
document.addEventListener("DOMContentLoaded", () => {
  const navAccountBtn = document.getElementById("navAccountBtn");
  const loginRegisterLink = document.getElementById("loginRegisterLink");
  const logoutLink = document.getElementById("logoutLink");
  const sellerLink = document.getElementById("sellerDashLink");
  const adminDashLink = document.getElementById("adminDashLink");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

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

    if (adminDashLink && role?.toLowerCase() === "admin") {
      adminDashLink.style.display = "block";
    }

    if (sellerLink && role?.toLowerCase() === "seller") {
      sellerLink.style.display = "block";
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

    if (adminDashLink) {
      adminDashLink.style.display = "none";
    }

    if (sellerLink) {
      sellerLink.style.display = "none";
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
//#endregion
