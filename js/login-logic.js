// 1. Professional Alert Wrapper
const showAlert = (icon, title, text) => {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon,
      title,
      text,
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
  } else {
    alert(text);
  }
};

const API_URL = window.API_BASE_URL + "/api/auth";

// 2. Toggle Password Visibility
function togglePassword() {
  const pass = document.getElementById("password");
  const btn = document.getElementById("toggleBtn");
  if (!pass || !btn) return;
  pass.type = pass.type === "password" ? "text" : "password";
  btn.textContent = pass.type === "password" ? "👁️" : "🙈";
}

// 3. Email Regex Validation
function validateEmail(email) {
  return String(email)
    .toLowerCase()
    .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}

// 4. Main Login Function
async function handleLogin(e) {
  if (e) e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  // Validation
  if (!email || !validateEmail(email))
    return showAlert(
      "error",
      "Invalid Access",
      "Please enter a valid email address!",
    );
  if (!password)
    return showAlert(
      "error",
      "Security Check",
      "Password field cannot be empty!",
    );

  try {
    // UI State: Authenticating
    btn.innerText = "Authenticating... 🚀";
    btn.disabled = true;

    const res = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(
        "%c[AUTH] Login Successful",
        "color: #10b981; font-weight: bold;",
      );

      // CLEAR & SAVE DATA
      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("username", data.user.name);
      localStorage.setItem("userData", JSON.stringify(data.user));

      // Role-based Greetings
      let welcomeMsg = "Accessing your profile...";
      if (data.user.role === "admin")
        welcomeMsg = "Admin Verified. Opening Master Control Center...";
      if (data.user.role === "seller")
        welcomeMsg = "Seller Verified. Preparing your Dashboard...";

      Swal.fire({
        icon: "success",
        title: "Authorized!",
        text: welcomeMsg,
        timer: 1500,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      // Role-based Redirection
      setTimeout(() => {
        const role = data.user.role;
        if (role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (role === "seller") {
          window.location.href = "seller-dashboard.html";
        } else {
          window.location.href = "../index.html";
        }
      }, 1600);
    } else {
      console.warn("[AUTH] Login Failed:", data.msg);
      showAlert(
        "error",
        "Login Denied",
        data.msg || "Invalid email or password.",
      );
      btn.innerText = "Login to Account";
      btn.disabled = false;
    }
  } catch (err) {
    console.error("[AUTH] Server Error:", err);
    showAlert(
      "error",
      "System Offline",
      "Unable to reach the authentication server.",
    );
    btn.innerText = "Login to Account";
    btn.disabled = false;
  }
}

// 5. Enter Key Support
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const activeElem = document.activeElement;
    if (activeElem.id === "email" || activeElem.id === "password") {
      handleLogin();
    }
  }
});
