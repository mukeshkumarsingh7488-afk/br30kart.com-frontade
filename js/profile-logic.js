const API_URL = window.API_BASE_URL + "/api/auth";

// 1. AUTH GUARD & DATA LOAD
window.onload = async function () {
  // --- 1. LOCAL STORAGE SE TURANT BADGE DIKHAO (FOR SPEED) ---
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
    window.location.href = "login.html";
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

    // UI Update logic
    const name = user.name || (user.user && user.user.name) || "User";
    const email =
      user.email || (user.user && user.user.email) || "No Email Found";
    const profilePic = user.profilePic || (user.user && user.user.profilePic);

    document.getElementById("userName").innerText = name;
    document.getElementById("userEmail").innerText = email;
    document.getElementById("editName").value = name;

    // ✅ CLOUDINARY IMAGE LOGIC
    const picElement = document.getElementById("profilePic");
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a020f0&color=fff&size=128&bold=true`;

    if (
      profilePic &&
      typeof profilePic === "string" &&
      profilePic.startsWith("http")
    ) {
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
    window.location.href = "login.html";
  }
};

// 2. PHOTO UPLOAD LOGIC
document
  .getElementById("fileInput")
  .addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    // Show Loading Alert
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
      const res = await fetch(
        window.API_BASE_URL + "/api/auth/update-profile",
        {
          method: "PUT",
          headers: { "x-auth-token": token },
          body: formData,
        },
      );

      const data = await res.json();

      if (res.ok) {
        const updatedUser = data.user || data;
        const newPicUrl = updatedUser.profilePic;

        // UI & Storage Update
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

// 3. EDIT UI TOGGLE
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

// 4. NAME SAVE LOGIC
document.getElementById("saveBtn").addEventListener("click", async () => {
  const newName = document.getElementById("editName").value.trim();
  const token = localStorage.getItem("token");

  if (!newName) {
    return Swal.fire("Warning", "Name cannot be empty!", "warning");
  }

  try {
    Swal.fire({
      title: "Saving...",
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

    if (res.ok) {
      const finalName = data.name || (data.user && data.user.name) || newName;
      document.getElementById("userName").innerText = finalName;

      // Reset UI
      document.getElementById("userName").style.display = "block";
      document.getElementById("editName").style.display = "none";
      document.getElementById("editBtn").style.display = "inline-block";
      document.getElementById("saveBtn").style.display = "none";

      // LocalStorage Sync
      let userData = JSON.parse(localStorage.getItem("userData")) || {};
      userData.name = finalName;
      localStorage.setItem("userData", JSON.stringify(userData));

      Swal.fire({
        icon: "success",
        title: "Name Updated!",
        timer: 1500,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
    } else {
      throw new Error(data.msg || "Update failed");
    }
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
});

// 5. LOGOUT LOGIC
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
    window.location.href = "login.html";
  }
}

// region ━━━━━ 👑 ROLE-BASED BADGE SYSTEM INITIALIZED ━━━━━
function updateUserStatus(userData) {
  const vipContainer = document.getElementById("vipBadgeContainer");
  if (!vipContainer) return;

  const userRole = (userData.role || "").toLowerCase(); // Taaki case-sensitive issue na ho

  if (userRole === "admin") {
    // 🛡️ ADMIN LOOK: Red/Dark Professional
    vipContainer.innerHTML = `
      <div class="admin-badge">
          <i class="fas fa-user-shield"></i> SYSTEM MODERATOR
      </div>
      <p style="color: #ef4444; font-size: 10px; margin-top: 4px; font-weight: bold;">WELCOME ADMIN</p>`;
  } else if (userRole === "seller") {
    // 💼 SELLER LOOK: Blue/Cyan Professional
    vipContainer.innerHTML = `
      <div class="seller-badge">
          <i class="fas fa-store"></i> VERIFIED SELLER
      </div>`;
  } else if (userRole === "vip") {
    // 👑 VIP LOOK (Jo pehle se chal raha hai)
    vipContainer.innerHTML = `
      <div class="vip-badge-gold">
          <i class="fas fa-crown"></i> VIP GOLDEN PREMIUM
      </div>`;
  } else {
    // ❌ NORMAL/STUDENT LOOK
    vipContainer.innerHTML = `
      <div class="standard-badge">
          <span class="status-label">Standard Member</span>
           <a href="../index.html#Premium-Trading-Courses" class="upgrade-link">Upgrade to VIP <i class="fas fa-arrow-right"></i></a>
      </div>`;
  }
}
// 🏁 --- END OF ROLE MODULE ---
