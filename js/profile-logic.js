//#region
const API_URL = window.API_BASE_URL + "/api/auth";

window.onload = async function () {
  const savedRole = localStorage.getItem("role");
  if (savedRole) {
    updateUserStatus({ role: savedRole });
  }
  const token = localStorage.getItem("token");
  console.log("🛑 Checking Token Status:", token ? "Active" : "Missing");
  if (!token) {
    await Swal.fire({
      icon: "error",
      title: "Authentication Required",
      text: "Please login to access your profile.",
      background: "#111827",
      color: "#fff",
    });
    window.location.href = "/login";
    return;
  }
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Session Expired");
    const user = await res.json();
    updateUserStatus(user);
    const name = user.name || (user.user && user.user.name) || "User";
    const email = user.email || (user.user && user.user.email) || "No Email Found";
    const profilePic = user.profilePic || (user.user && user.user.profilePic);
    document.getElementById("userName").innerText = name;
    document.getElementById("userEmail").innerText = email;
    document.getElementById("editName").value = name;
    const picElement = document.getElementById("profilePic");
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a020f0&color=fff&size=128&bold=true`;
    if (profilePic && typeof profilePic === "string" && profilePic.startsWith("http")) {
      picElement.src = profilePic;
      picElement.onerror = () => {
        picElement.src = defaultAvatar;
      };
    } else {
      picElement.src = defaultAvatar;
    }
  } catch (err) {
    console.error("Profile Load Error:", err);
    localStorage.clear();
    window.location.href = "/login";
  }
};

document.getElementById("fileInput").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;
  Swal.fire({
    title: "Uploading Photo...",
    text: "Updating your profile picture on Cloudinary",
    allowOutsideClick: false,
    background: "#111827",
    color: "#fff",
    didOpen: () => {
      Swal.showLoading();
    },
  });
  const formData = new FormData();
  formData.append("profilePic", file);
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(window.API_BASE_URL + "/api/auth/update-profile", {
      method: "PUT",
      headers: { "x-auth-token": token },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      const updatedUser = data.user || data;
      const newPicUrl = updatedUser.profilePic;
      document.getElementById("profilePic").src = newPicUrl;
      let userData = JSON.parse(localStorage.getItem("userData")) || {};
      userData.profilePic = newPicUrl;
      localStorage.setItem("userData", JSON.stringify(userData));
      Swal.fire({
        icon: "success",
        title: "Photo Updated!",
        text: "Your profile picture has been changed successfully.",
        background: "#111827",
        color: "#fff",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      throw new Error(data.msg || "Upload failed");
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Upload Failed",
      text: err.message,
      background: "#111827",
      color: "#fff",
    });
  }
});

document.getElementById("editBtn").addEventListener("click", () => {
  document.getElementById("userName").style.display = "none";
  document.getElementById("editName").style.display = "block";
  document.getElementById("editBtn").style.display = "none";
  document.getElementById("saveBtn").style.display = "inline-block";
  document.getElementById("editName").focus();
});

document.getElementById("editName").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("saveBtn").click();
  }
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const newName = document.getElementById("editName").value.trim();
  const token = localStorage.getItem("token");
  if (!newName) {
    return Swal.fire({
      icon: "warning",
      title: "Name Required",
      text: "Please enter a valid name!",
      background: "#111827",
      color: "#fff",
    });
  }
  try {
    Swal.fire({
      title: "Updating Profile...",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const res = await fetch(window.API_BASE_URL + "/api/auth/update-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    console.log("📥 Server Response:", data);
    if (res.ok) {
      const finalName = data.name || (data.user && data.user.name) || newName;
      document.getElementById("userName").innerText = finalName;
      document.getElementById("userName").style.display = "block";
      document.getElementById("editName").style.display = "none";
      document.getElementById("editBtn").style.display = "inline-block";
      document.getElementById("saveBtn").style.display = "none";
      let userData = JSON.parse(localStorage.getItem("userData")) || {};
      userData.name = finalName;
      localStorage.setItem("userData", JSON.stringify(userData));
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Your profile name has been updated.",
        timer: 2000,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
    } else {
      throw new Error(data.message || data.msg || "Server rejected the update");
    }
  } catch (err) {
    console.error("❌ Update Error:", err);
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: err.message,
      background: "#111827",
      color: "#fff",
    });
  }
});

async function logout() {
  const result = await Swal.fire({
    title: "Log Out?",
    text: "Are you sure you want to end your session?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Yes, Logout",
    background: "#111827",
    color: "#fff",
  });
  if (result.isConfirmed) {
    localStorage.clear();
    window.location.href = "/login";
  }
}

function updateUserStatus(userData) {
  const vipContainer = document.getElementById("vipBadgeContainer");
  if (!vipContainer) return;
  const userRole = (userData.role || "").toLowerCase();
  if (userRole === "admin") {
    vipContainer.innerHTML = `
      <div class="admin-badge">
          <i class="fas fa-user-shield"></i> SYSTEM MODERATOR
      </div>
      <p style="color: #ef4444; font-size: 10px; margin-top: 4px; font-weight: bold;">WELCOME ADMIN</p>`;
  } else if (userRole === "seller") {
    vipContainer.innerHTML = `
      <div class="seller-badge">
          <i class="fas fa-store"></i> VERIFIED SELLER
      </div>`;
  } else if (userRole === "vip") {
    vipContainer.innerHTML = `
      <div class="vip-badge-gold">
          <i class="fas fa-crown"></i> VIP GOLDEN PREMIUM
      </div>`;
  } else {
    vipContainer.innerHTML = `
      <div class="standard-badge">
          <span class="status-label">Standard Member</span>
        <a href="/home#Premium-Trading-Courses" class="upgrade-link"> Upgrade to VIP <i class="fas fa-arrow-right"></i></a>
      </div>`;
  }
}
//#endregion
