//#region
window.API_BASE_URL = "https://br30kart-api.onrender.com";
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

function togglePassword() {
  const pass = document.getElementById("password");
  const btn = document.getElementById("toggleBtn");
  if (!pass || !btn) return;
  pass.type = pass.type === "password" ? "text" : "password";
  btn.textContent = pass.type === "password" ? "👁️" : "🙈";
}

function validateEmail(email) {
  return String(email)
    .toLowerCase()
    .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  if (!email || !validateEmail(email)) {
    return showAlert("error", "Invalid Access", "Please enter a valid email address!");
  }

  if (!password) {
    return showAlert("error", "Security Check", "Password field cannot be empty!");
  }

  btn.innerText = "Authenticating... 🚀";
  btn.disabled = true;

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data;

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    console.log("LOGIN RESPONSE:", data);

    if (!res.ok || !data || !data.user) {
      throw new Error(data?.msg || "Login failed");
    }

    const role = String(data.user.role || "")
      .toLowerCase()
      .trim();

    if (!role) {
      throw new Error("Role missing in response");
    }

    localStorage.clear();
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userData", JSON.stringify(data.user));

    let msg = "Login Successful";

    if (role === "admin") msg = "Admin Verified 🚀";
    else if (role === "seller") msg = "Seller Verified 🚀";
    else msg = "Student Login Successful 🚀";

    Swal.fire({
      icon: "success",
      title: "Authorized!",
      text: msg,
      timer: 1500,
      showConfirmButton: false,
    });

    setTimeout(() => {
      if (role === "admin") {
        window.location.replace("/admin-dashboard");
      } else if (role === "seller") {
        window.location.replace("/seller-dashboard");
      } else {
        window.location.replace("/");
      }
    }, 1200);
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    showAlert("error", "System Offline", err.message || "Server not reachable");

    btn.innerText = "Login to Account";
    btn.disabled = false;
  }
}

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const activeElem = document.activeElement;
    if (activeElem.id === "email" || activeElem.id === "password") {
      handleLogin();
    }
  }
});
//#endregion
