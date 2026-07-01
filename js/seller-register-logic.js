//#region
if (localStorage.getItem("sellerId")) {
  window.location.href = "/seller-dashboard";
}

let isEmailVerified = false;

const TERMS_VERSION = "v1.0";
const submitBtn = document.getElementById("submitBtn");

submitBtn.disabled = true;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

async function sendOTP() {
  const email = document.getElementById("email").value.trim();
  const sendBtn = document.getElementById("sendOtpBtn");

  if (!isValidEmail(email)) {
    return alert("❌ Enter valid email!");
  }

  sendBtn.innerText = "Sending...";
  sendBtn.disabled = true;

  try {
    const res = await fetch(CONFIG.BASE_API_URL + "/auth/seller/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ " + data.msg);
      document.getElementById("otpSection").style.display = "block";
    } else {
      alert("❌ " + (data.msg || "OTP send failed"));
    }
  } catch (err) {
    alert("⚠️ Network Error!");
  }

  sendBtn.innerText = "Resend OTP";
  sendBtn.disabled = false;
}

async function verifyOTP() {
  const otp = document.getElementById("otpInput").value.trim();
  const email = document.getElementById("email").value.trim();

  if (otp.length !== 6) {
    return alert("Enter valid 6 digit OTP");
  }

  try {
    const res = await fetch(CONFIG.BASE_API_URL + "/auth/seller/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Email Verified!");

      isEmailVerified = true;
      document.getElementById("otpSection").style.display = "none";
      document.getElementById("email").readOnly = true;

      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
    } else {
      alert("❌ " + (data.msg || "Invalid OTP"));
    }
  } catch (err) {
    alert("⚠️ Verification Error!");
  }
}

function updateFileName(inputId, textId) {
  const input = document.getElementById(inputId);
  const text = document.getElementById(textId);

  if (input.files.length > 0) {
    text.innerText = "✅ " + input.files[0].name;
    text.style.color = "#a020f0";
  }
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("termsModal");

  if (modal && e.target === modal) {
    closeTermsModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeTermsModal();
  }
});

const API_URL = CONFIG.BASE_API_URL + "/auth/seller/register";

document.getElementById("sellerRegForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("submitBtn");
  const termsAccepted = document.getElementById("termsAccepted");

  if (btn.disabled) return;

  if (!isEmailVerified) {
    return alert("Please verify your email first!");
  }

  if (!termsAccepted || !termsAccepted.checked) {
    return alert("Please accept BR30 Kart Terms & Conditions.");
  }

  if (!document.getElementById("aadharFront").files[0] || !document.getElementById("aadharBack").files[0] || !document.getElementById("bankDoc").files[0]) {
    return alert("❌ Upload all documents!");
  }

  btn.innerHTML = "Processing... ⏳";
  btn.disabled = true;

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value.trim());
  formData.append("email", document.getElementById("email").value.trim());
  formData.append("password", document.getElementById("password").value);
  formData.append("aadharNo", document.getElementById("aadharNo").value.trim());
  formData.append("bankName", document.getElementById("bankName").value.trim());
  formData.append("accountNo", document.getElementById("accountNo").value.trim());
  formData.append("ifscCode", document.getElementById("ifscCode").value.trim().toUpperCase());

  formData.append("aadharFront", document.getElementById("aadharFront").files[0]);
  formData.append("aadharBack", document.getElementById("aadharBack").files[0]);
  formData.append("bankDoc", document.getElementById("bankDoc").files[0]);

  formData.append("acceptTerms", "true");
  formData.append("termsVersion", TERMS_VERSION);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("sellerId", data.sellerId || "");
      localStorage.setItem("userName", data.name || "");
      localStorage.setItem("userEmail", data.email || "");
      localStorage.setItem("isSeller", "true");

      btn.innerHTML = "Success ✅";

      alert("🎉 Application Submitted!");
      window.location.href = "/seller-dashboard";
    } else {
      alert("❌ " + (data.msg || data.error || "Registration failed"));

      btn.innerHTML = "Submit Application";
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);

    alert("⚠️ Server Error!");

    btn.innerHTML = "Submit Application";
    btn.disabled = false;
  }
});
//#endregion
