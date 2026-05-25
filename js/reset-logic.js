//#region
async function resetPassword(event) {
  if (event) event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const token = document.getElementById("token").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const btn = document.getElementById("resetBtn");
  if (!email || !token || !newPassword) {
    return Swal.fire({
      icon: "warning",
      title: "Missing Details",
      text: "Please fill in all the required fields to reset your password.",
      background: "#111827",
      color: "#fff",
    });
  }
  const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  if (!passRegex.test(newPassword)) {
    return Swal.fire({
      icon: "error",
      title: "Weak Password",
      text: "Password must be at least 8 characters long and include a number and a special character.",
      background: "#111827",
      color: "#fff",
    });
  }
  try {
    btn.innerText = "Updating... ⏳";
    btn.disabled = true;
    Swal.fire({
      title: "Processing...",
      text: "Updating your security credentials.",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const res = await fetch(window.API_BASE_URL + "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Password Updated! 🚀",
        text: "Your password has been changed successfully. Redirecting to login...",
        background: "#111827",
        color: "#fff",
        timer: 2000,
        showConfirmButton: false,
      });
      window.location.href = "/login";
    } else {
      throw new Error(data.msg || data.message || "Invalid OTP or Email verification failed.");
    }
  } catch (err) {
    console.error("Reset Error:", err);
    Swal.fire({
      icon: "error",
      title: "Reset Failed",
      text: err.message || "Server connection error. Please try again later.",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#d33",
    });
    btn.innerText = "Update Password";
    btn.disabled = false;
  }
}

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const activeElem = document.activeElement;
    if (activeElem.id === "email" || activeElem.id === "token" || activeElem.id === "newPassword") {
      resetPassword();
    }
  }
});
//#endregion
