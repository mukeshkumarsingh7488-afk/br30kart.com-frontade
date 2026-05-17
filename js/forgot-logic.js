//#region
const API_URL = window.API_BASE_URL + "/api/auth";

function togglePassword() {
  const pass = document.getElementById("newPassword");
  const btn = document.getElementById("toggleBtn");
  if (!pass || !btn) return;
  pass.type = pass.type === "password" ? "text" : "password";
  btn.textContent = pass.type === "password" ? "👁️" : "🙈";
}

async function handleRequestOTP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById("resetEmail");
  const email = emailInput.value.trim();
  const btn = document.getElementById("reqBtn");
  if (!email || !email.includes("@")) {
    return Swal.fire({
      icon: "warning",
      title: "Invalid Email",
      text: "Please enter a valid email address to receive the OTP.",
      background: "#0a0a0a",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
  }
  try {
    btn.innerText = "Sending...";
    btn.disabled = true;
    Swal.fire({
      title: "Sending OTP...",
      text: "Please check your inbox for the reset code.",
      allowOutsideClick: false,
      background: "#0a0a0a",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const apiBase = window.API_BASE_URL || "";
    const res = await fetch(apiBase + "/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "OTP Sent! ✅",
        text: "A reset code has been sent to your email successfully.",
        background: "#0a0a0a",
        color: "#fff",
        timer: 2000,
        showConfirmButton: false,
      });
      document.getElementById("request-section").style.display = "none";
      document.getElementById("reset-section").style.display = "block";
      if (typeof startTimer === "function") startTimer();
    } else {
      throw new Error(data.msg || "User not found or Server error.");
    }
  } catch (err) {
    console.error("OTP Request Error:", err);
    Swal.fire({
      icon: "error",
      title: "Request Failed",
      text: err.message || "Server connection failed. Please try again.",
      background: "#0a0a0a",
      color: "#fff",
      confirmButtonColor: "#d33",
    });
    btn.innerText = "Send Reset OTP";
    btn.disabled = false;
  }
}

async function handleResetPassword(e) {
  if (e) e.preventDefault();
  const email = document.getElementById("resetEmail").value;
  const otp = document.getElementById("resetOtp").value;
  const newPassword = document.getElementById("newPassword").value;
  const btn = document.getElementById("resetBtn");
  const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  if (!passRegex.test(newPassword)) {
    return Swal.fire({
      icon: "warning",
      title: "Weak Password",
      text: "Password must be at least 8 characters long and include at least one special character and a number.",
      background: "#0a0a0a",
      color: "#fff",
    });
  }
  if (otp.length < 6) {
    return Swal.fire({
      icon: "warning",
      title: "Invalid OTP",
      text: "Please enter the complete 6-digit verification code.",
      background: "#0a0a0a",
      color: "#fff",
    });
  }
  try {
    btn.innerText = "Updating...";
    btn.disabled = true;
    Swal.fire({
      title: "Resetting Password...",
      text: "Please wait while we update your security credentials.",
      allowOutsideClick: false,
      background: "#0a0a0a",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const res = await fetch(window.API_BASE_URL + "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Password Changed! 🚀",
        text: "Your password has been updated successfully. Redirecting to login...",
        background: "#0a0a0a",
        color: "#fff",
        timer: 2000,
        showConfirmButton: false,
      });
      window.location.href = "login.html";
    } else {
      throw new Error(data.msg || "Invalid OTP or Session Expired.");
    }
  } catch (err) {
    console.error("Reset Error:", err);
    Swal.fire({
      icon: "error",
      title: "Reset Failed",
      text: err.message || "Server connection error. Please try again.",
      background: "#0a0a0a",
      color: "#fff",
      confirmButtonColor: "#d33",
    });
    btn.innerText = "Update Password";
    btn.disabled = false;
  }
}
let timerId;

function startTimer() {
  let timeLeft = 30;
  const resendBtn = document.getElementById("resendBtn");
  const timerText = document.getElementById("timerText");
  const timerDisplay = document.getElementById("timer");
  if (resendBtn) resendBtn.style.display = "none";
  if (timerText) timerText.style.display = "block";
  console.log("%c[TIMER] OTP Resend cooldown started: 30s", "color: #fbbf24; font-weight: bold;");
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerId);
      if (resendBtn) resendBtn.style.display = "block";
      if (timerText) timerText.style.display = "none";
      console.log("%c[TIMER] Cooldown finished. Resend available.", "color: #28a745; font-weight: bold;");
    } else {
      if (timerDisplay) timerDisplay.innerText = timeLeft;
    }
    timeLeft--;
  }, 1000);
}

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const isResetVisible = document.getElementById("reset-section").style.display === "block";
    if (isResetVisible) document.getElementById("resetBtn").click();
    else document.getElementById("reqBtn").click();
  }
});
//#endregion
