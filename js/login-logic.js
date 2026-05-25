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

  if (!email || !validateEmail(email)) return showAlert("error", "Invalid Access", "Please enter a valid email address!");

  if (!password) return showAlert("error", "Security Check", "Password field cannot be empty!");

  let res, data;

  try {
    btn.innerText = "Authenticating... 🚀";
    btn.disabled = true;

    res = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    data = await res.json();
    console.log("RES:", res);
    console.log("STATUS:", res.status);
    console.log("DATA:", data);
    console.log("LOGIN RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.msg || "Login failed");
    }

    const role = (data.user?.role || "").toLowerCase().trim();

    localStorage.clear();
    localStorage.setItem("token", data.token);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userRole", role);
    localStorage.setItem("username", data.user.name);
    localStorage.setItem("userData", JSON.stringify(data.user));

    let welcomeMsg = "Accessing your profile...";

    if (role === "admin") {
      welcomeMsg = "Admin Verified. Opening Master Control Center...";
    } else if (role === "seller") {
      welcomeMsg = "Seller Verified. Preparing your Dashboard...";
    } else {
      welcomeMsg = "Student Login Successful. Opening Home...";
    }

    Swal.fire({
      icon: "success",
      title: "Authorized!",
      text: welcomeMsg,
      timer: 1500,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
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
    showAlert("error", "System Offline", "Server not reachable or slow response. Try again.");
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
