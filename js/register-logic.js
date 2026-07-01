//#region
const API_URL = window.API_BASE_URL + "/api/auth";
const TERMS_VERSION = "1.0";

function togglePassword() {
  const pass = document.getElementById("password");
  const btn = document.getElementById("toggleBtn");
  if (!pass || !btn) return;

  pass.type = pass.type === "password" ? "text" : "password";
  btn.textContent = pass.type === "password" ? "👁️" : "🙈";
}

function openTermsModal() {
  const modal = document.getElementById("termsModal");
  if (!modal) return;
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeTermsModal() {
  const modal = document.getElementById("termsModal");
  if (!modal) return;
  modal.classList.remove("show");
  document.body.style.overflow = "";
}

function agreeTerms() {
  const checkbox = document.getElementById("termsAccepted");
  if (checkbox) checkbox.checked = true;
  closeTermsModal();
}

function validateInput(name, email, pass) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;

  if (name.length < 3) return "Name must be at least 3 characters!";
  if (!emailRegex.test(email)) return "Please enter a valid email address!";
  if (!passRegex.test(pass)) return "Password needs 8+ chars with at least 1 special character!";

  return null;
}

let timerInterval;

function startTimer() {
  let timeLeft = 30;
  const resendBtn = document.getElementById("resendBtn");
  const timerText = document.getElementById("timerText");
  const timerDisplay = document.getElementById("timer");

  if (resendBtn) resendBtn.style.display = "none";
  if (timerText) timerText.style.display = "block";

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (resendBtn) resendBtn.style.display = "block";
      if (timerText) timerText.style.display = "none";
    } else {
      if (timerDisplay) timerDisplay.innerText = timeLeft;
    }

    timeLeft--;
  }, 1000);
}

async function handleRegister(e) {
  if (e) e.preventDefault();

  const regBtn = document.getElementById("regBtn");
  const termsAccepted = document.getElementById("termsAccepted");

  const name = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const error = validateInput(name, email, password);

  if (error) {
    return Swal.fire({
      icon: "warning",
      title: "Validation Error",
      text: error,
      background: "#111827",
      color: "#fff",
    });
  }

  if (!termsAccepted || !termsAccepted.checked) {
    return Swal.fire({
      icon: "warning",
      title: "Terms Required",
      text: "Please accept BR30 Kart Terms & Conditions to continue.",
      background: "#111827",
      color: "#fff",
    });
  }

  try {
    regBtn.disabled = true;
    regBtn.innerText = "Sending OTP... ⏳";

    Swal.fire({
      title: "Sending OTP...",
      text: "Please wait while we verify your email.",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        acceptTerms: true,
        termsVersion: TERMS_VERSION,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "OTP Sent! ✅",
        text: "A 6-digit verification code has been sent to your email.",
        timer: 2000,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      document.getElementById("register-section").style.display = "none";
      document.getElementById("otp-section").style.display = "block";
      startTimer();
    } else {
      throw new Error(data.msg || "Registration Failed!");
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
      background: "#111827",
      color: "#fff",
    });

    regBtn.disabled = false;
    regBtn.innerText = "Send OTP";
  }
}

async function handleVerify(e) {
  if (e) e.preventDefault();

  const verifyBtn = document.getElementById("verifyBtn");
  const otpInput = document.getElementById("otpInput");
  const emailInput = document.getElementById("email");

  const otp = otpInput ? otpInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";

  if (otp.length < 6) {
    return Swal.fire({
      icon: "warning",
      title: "Incomplete OTP",
      text: "Please enter the 6-digit code.",
      background: "#111827",
      color: "#fff",
    });
  }

  try {
    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying... ⏳";

    Swal.fire({
      title: "Verifying OTP...",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch(`${window.API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Account Verified! 🚀",
        text: "Your account is now active. Redirecting to login...",
        timer: 2000,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      window.location.replace("/login");
    } else {
      throw new Error(data.msg || "Verification Failed!");
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed",
      text: err.message,
      background: "#111827",
      color: "#fff",
    });

    verifyBtn.disabled = false;
    verifyBtn.innerText = "Verify & Register";
  }
}

function resendOTP() {
  handleRegister();
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("termsModal");
  if (modal && e.target === modal) closeTermsModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeTermsModal();
});

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const isOtpVisible = document.getElementById("otp-section")?.style.display === "block";
    if (isOtpVisible) handleVerify();
    else handleRegister();
  }
});

function redirectToSeller() {
  window.location.href = "/seller-register";
}

let currentRole = "student";

function setRole(role) {
  currentRole = role;
  document.getElementById("buyerTab").classList.add("active");
}
//#endregion
