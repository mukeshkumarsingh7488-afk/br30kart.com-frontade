const sellerLink = document.getElementById("sellerDashLink");
const adminDashLink = document.getElementById("adminDashLink");
const logoutLink = document.getElementById("logoutLink");
const loginLink = document.getElementById("loginLink");

const role = localStorage.getItem("userRole");
const token = localStorage.getItem("token");

if (loginLink && token) loginLink.style.display = "none";

if (adminDashLink && role?.toLowerCase() === "admin") {
  adminDashLink.style.display = "block";
}

if (sellerLink && role?.toLowerCase() === "seller") {
  sellerLink.style.display = "block";
}

if (logoutLink && token) {
  logoutLink.style.display = "block";
}

if (logoutLink) {
  logoutLink.addEventListener("click", function (e) {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");
    localStorage.removeItem("userEmail");

    window.location.href = "/login";
  });
}
