//#region
(function protectPage() {
  const role = localStorage.getItem("userRole");
  const allowed = ["admin", "seller"];
  if (!allowed.includes(role)) {
    document.body.style.display = "none";
    alert("Access Denied! Redirecting to Home...");
    window.location.href = "/";
  }
})();

function openSellerModal() {
  const modal = document.getElementById("sellerModal");
  if (modal) {
    modal.style.opacity = "0";
    modal.style.display = "flex";
    setTimeout(() => {
      modal.style.transition = "opacity 0.3s ease-in-out";
      modal.style.opacity = "1";
    }, 10);
    console.log("%c[UI] Seller Modal Opened Successfully", "color: #28a745; font-weight: bold;");
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Opening Seller Details",
      showConfirmButton: false,
      timer: 1500,
      background: "#0a0a0a",
      color: "#fff",
    });
  } else {
    console.error("❌ Error: Seller Modal ID not found in DOM!");
    Swal.fire("Error", "Could not open details. Modal is missing.", "error");
  }
}

function closeSellerModal() {
  const modal = document.getElementById("sellerModal");
  if (modal) {
    modal.style.transition = "opacity 0.3s ease";
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      console.log("%c[UI] Seller Modal Closed", "color: #ff4d4d; font-weight: bold;");
    }, 300);
  } else {
    console.warn("Attempted to close modal, but #sellerModal was not found.");
  }
}

async function fetchProfile(email) {
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/get-seller`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      Swal.fire({
        icon: "error",
        title: "Seller Not Found",
        text: data.message || "Seller profile database me nahi mila.",
        background: "#111827",
        color: "#fff",
      });
      return;
    }

    localStorage.setItem("sellerData", JSON.stringify(data.data));

    Swal.fire({
      icon: "success",
      title: "Seller Profile Loaded",
      text: "Dashboard open ho raha hai.",
      background: "#111827",
      color: "#fff",
      timer: 1000,
      showConfirmButton: false,
    });

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (err) {
    console.error("fetchProfile error:", err);
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Seller profile load nahi ho pa raha.",
      background: "#111827",
      color: "#fff",
    });
  }
}

window.addEventListener("load", async () => {
  const sEmail = localStorage.getItem("sellerEmail");
  const publishBtn = document.getElementById("publishBtn");
  const displayBox = document.getElementById("sellerDisplayName");
  if (sEmail) {
    try {
      const res = await fetch(`${CONFIG.BASE_API_URL}/products/seller-info/${sEmail}`);
      const seller = await res.json();
      if (seller && seller.email) {
        window.activeSeller = seller;
        localStorage.setItem("sellerName", seller.name);
        if (displayBox) displayBox.textContent = `Welcome, ${seller.name} 👋`;
        unlockPublishButton(publishBtn);
        console.log("✅ Dashboard Sync Success: " + seller.name);
        const prodRes = await fetch(`${CONFIG.BASE_API_URL}/products/my-products/${sEmail}`);
        const products = await prodRes.json();
        renderManageContentList(products);
        if (products.length > 0 && products[0].discount > 0) {
          displayGlobalStatus("ACTIVE MEGA SALE", products[0].discount);
        }
      } else {
        lockPublishButton(publishBtn);
        openSellerModal();
      }
    } catch (err) {
      console.error("❌ Sync Error:", err);
      lockPublishButton(publishBtn);
    }
  } else {
    lockPublishButton(publishBtn);
    openSellerModal();
  }
});

function renderManageContentList(products) {
  let html = "";
  products.forEach((item) => {
    const hasDiscount = item.discount > 0;
    const dateOptions = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", dateOptions) : "N/A";
    const isHidden = item.isVisible === false || String(item.isVisible) === "false";
    const isApproved = item.isApproved === true || String(item.isApproved) === "true";
    const isFeatured = item.isFeatured === true || String(item.isFeatured) === "true";
    const visibilityTag = isHidden ? `<span style="background:rgba(239, 68, 68, 0.1); color:#ef4444; padding:2px 8px; border-radius:4px; border:1px solid #ef4444; font-size:10px; font-weight:bold;">Hidden 🚫</span>` : `<span style="background:rgba(34, 197, 94, 0.1); color:#22c55e; padding:2px 8px; border-radius:4px; border:1px solid #22c55e; font-size:10px; font-weight:bold;">Active ✅</span>`;
    const approvalTag = isApproved ? `<span style="background:rgba(59, 130, 246, 0.1); color:#3b82f6; padding:2px 8px; border-radius:4px; border:1px solid #3b82f6; font-size:10px; font-weight:bold;">Approved ⭐</span>` : `<span style="background:rgba(251, 191, 36, 0.1); color:#fbbf24; padding:2px 8px; border-radius:4px; border:1px solid #fbbf24; font-size:10px; font-weight:bold;">Pending ⏳</span>`;
    const featuredTag = isFeatured ? `<span style="background:rgba(168, 85, 247, 0.1); color:#a855f7; padding:2px 8px; border-radius:4px; border:1px solid #a855f7; font-size:10px; font-weight:bold;">Best Seller 🔥</span>` : "";
    html += `
            <div class="status-box" style="display:flex; justify-content:space-between; align-items:center; background:#111827; padding:15px; border-radius:12px; border:1px solid #334155; margin-bottom:12px; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">  
                <!-- LEFT SECTION: Course Info -->
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${item.thumbnail}" style="width:60px; height:45px; border-radius:8px; object-fit:cover; border: 1px solid #475569;">
                    <div>
                        <div class="course-title" style="font-weight:700; color: #f8fafc; font-size: 15px; margin-bottom: 4px;">${item.title}</div>
                        <div style="font-size:12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="color: #38bdf8; font-weight: bold;">₹${item.price}</span>
                            ${hasDiscount ? `<span style="background:rgba(0, 255, 204, 0.1); color:#00ffcc; padding:2px 8px; border-radius:20px; border: 1px solid #00ffcc; font-weight:bold; font-size:10px;">🔥 ${item.discount}% Off</span>` : `<span style="color:#64748b; font-size:10px; background: rgba(100, 116, 139, 0.1); padding: 2px 8px; border-radius: 20px;">No Offer</span>`}
                          <div style="font-size: 10px; display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-family: monospace; flex-wrap: wrap;">
    <span style="color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 1px 6px; border-radius: 4px;">📂 ${item.category || "Trading"}</span>
    <span style="color: #64748b; opacity: 0.8;">🆔 ${item._id}</span>
    <span style="color: #94a3b8; font-size: 10px; display: flex; align-items: center; gap: 4px;">
        📅 ${formattedDate}
    </span>
</div>
                            <!-- 🔥 ALL STATUS TAGS HERE -->
                            <div style="display:flex; gap:6px;">
                                ${visibilityTag}
                                ${approvalTag}
                                ${featuredTag}
                            </div>
                        </div>
                    </div>
                </div>
                <!-- RIGHT SECTION: Action Buttons -->
                <div style="display:flex; gap:10px; align-items: center;">
                    <button onclick="setProductDiscount('${item._id}')" style="background:#fbbf24; color:#000; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:800; border:none; cursor:pointer;">
                        🎁 ADD OFFER
                    </button>
                    ${
                      hasDiscount
                        ? `<button onclick="stopIndividualSale('${item._id}')" style="background:#ef4444; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; color:white; border:none; cursor:pointer;">
                            🛑 STOP
                           </button>`
                        : ""
                    }
                    <button onclick="openEditModal('${item._id}', '${item.title}', ${item.price}, '${item.videoLink}', '${item.thumbnail}')" style="background:#3b82f6; color:white; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; border:none; cursor:pointer;">
                        ✏️ EDIT
                    </button>
                    <button onclick="deleteProduct('${item._id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding:6px 10px; border-radius:6px; font-size:14px; cursor:pointer;">
                        🗑️
                    </button>
                </div>
            </div>`;
  });
  document.getElementById("myContentList").innerHTML = html || "<p style='color: #94a3b8; text-align: center; padding: 20px;'>No content uploaded yet. 📂</p>";
}

async function stopIndividualSale(id) {
  const result = await Swal.fire({
    title: "Remove Discount?",
    text: "This course discount will be removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Remove",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#fff",
  });
  if (!result.isConfirmed) return;
  try {
    Swal.fire({
      title: "Updating...",
      text: "Removing discount from course",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/update-discount/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount: 0 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to update discount");
    }
    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: "Discount removed successfully.",
      timer: 1500,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed!",
      text: err.message || "Server error occurred",
      background: "#111827",
      color: "#fff",
    });
  }
}

document.getElementById("sellerRegForm").onsubmit = async (e) => {
  e.preventDefault();
  const publishBtn = document.getElementById("publishBtn");
  const setLoading = (state) => {
    if (!publishBtn) return;
    publishBtn.disabled = state;
    publishBtn.innerHTML = state ? 'Processing... <i class="fas fa-spinner fa-spin"></i>' : "Publish";
  };
  const forceSwalTop = () => {
    const container = document.querySelector(".swal2-container");
    if (container) container.style.zIndex = "99999";
  };
  try {
    const getVal = (id) => document.getElementById(id)?.value?.trim();
    const name = getVal("sName");
    const email = getVal("sEmail");
    const address = getVal("sAddress");
    const bio = getVal("sBio");
    const youtube = getVal("sYT");
    const instagram = getVal("sIG");
    const telegram = getVal("sTG");
    if (!name || !email) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        text: "Name aur Email mandatory hai",
        background: "#111827",
        color: "#fff",
        didOpen: forceSwalTop,
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid email",
        background: "#111827",
        color: "#fff",
        didOpen: forceSwalTop,
      });
    }
    setLoading(true);
    Swal.fire({
      title: "Creating Profile...",
      text: "Please wait while we link your account",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
        forceSwalTop();
      },
    });
    const sellerData = {
      name,
      email,
      address,
      bio,
      youtube,
      instagram,
      telegram,
    };
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/register-seller`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sellerData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: data.error || "Email already registered",
        background: "#111827",
        color: "#fff",
        didOpen: forceSwalTop,
      });
      setLoading(false);
      return;
    }
    localStorage.setItem("sellerEmail", email);
    localStorage.setItem("sellerName", name);
    window.activeSeller = sellerData;
    closeSellerModal();
    unlockPublishButton(publishBtn);
    Swal.fire({
      icon: "success",
      title: "Profile Linked 🔥",
      text: "You can now upload courses",
      timer: 2000,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
      didOpen: forceSwalTop,
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    console.error("❌ Seller Register Error:", err);
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: err.message || "Something went wrong",
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        const container = document.querySelector(".swal2-container");
        if (container) container.style.zIndex = "99999";
      },
    });
  } finally {
    setLoading(false);
  }
};

function toggleSellerView() {
  const regForm = document.getElementById("sellerRegForm");
  const loginForm = document.getElementById("sellerLoginForm");
  const toggleBtn = document.getElementById("toggleBtn");
  if (!regForm || !loginForm || !toggleBtn) {
    console.error("❌ Seller forms missing in DOM");
    return;
  }
  const forceTop = () => {
    const container = document.querySelector(".swal2-container");
    if (container) container.style.zIndex = "99999";
  };
  if (regForm.style.display === "none") {
    regForm.style.display = "block";
    loginForm.style.display = "none";
    toggleBtn.innerText = "Login (Old User)";
    Swal.fire({
      icon: "info",
      title: "Create New Profile",
      text: "Fill the form to create seller account",
      background: "#111827",
      color: "#fff",
      didOpen: forceTop,
      timer: 1500,
      showConfirmButton: false,
    });
  } else {
    regForm.style.display = "none";
    loginForm.style.display = "block";
    toggleBtn.innerText = "New Profile";
    Swal.fire({
      icon: "info",
      title: "Login Mode",
      text: "Enter your seller credentials",
      background: "#111827",
      color: "#fff",
      didOpen: forceTop,
      timer: 1500,
      showConfirmButton: false,
    });
  }
}

document.getElementById("sellerLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  const emailInput = document.getElementById("loginEmail");
  const email = emailInput.value.trim();
  const btn = e.target.querySelector('button[type="submit"]');
  if (!email) {
    return Swal.fire({
      icon: "warning",
      title: "Email Required",
      text: "Please enter your email to fetch your profile.",
      background: "#0a0a0a",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
  }
  btn.innerText = "Verifying...";
  btn.disabled = true;
  Swal.fire({
    title: "Fetching Profile...",
    allowOutsideClick: false,
    background: "#0a0a0a",
    color: "#fff",
    didOpen: () => {
      Swal.showLoading();
    },
  });
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/get-seller`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    });
    const result = await res.json();
    if (result.success) {
      localStorage.setItem("sellerRegistered", "true");
      localStorage.setItem("sellerEmail", email);
      localStorage.setItem("sellerDetails", JSON.stringify(result.data));
      await Swal.fire({
        icon: "success",
        title: "Welcome Back! 🚀",
        text: "Profile found successfully. Redirecting...",
        background: "#0a0a0a",
        color: "#fff",
        timer: 2000,
        showConfirmButton: false,
      });
      location.reload();
    } else {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: result.message || "We could not find a profile with that email.",
        background: "#0a0a0a",
        color: "#fff",
        confirmButtonColor: "#d33",
      });
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    Swal.fire({
      icon: "error",
      title: "Connection Error",
      text: "The server is unreachable. Please check your internet or try again later.",
      background: "#0a0a0a",
      color: "#fff",
    });
  } finally {
    btn.innerText = "Fetch Profile";
    btn.disabled = false;
  }
});

document.getElementById("uploadForm").onsubmit = async (e) => {
  e.preventDefault();
  const userRole = localStorage.getItem("userRole");
  const allowedRoles = ["admin", "seller"];
  if (!allowedRoles.includes(userRole)) {
    return Swal.fire({
      icon: "error",
      title: "Access Denied! 🚫",
      text: "Only Sellers and Admins have permission to upload courses.",
      background: "#111827",
      color: "#fff",
    });
  }
  if (!window.activeSeller && userRole !== "admin") {
    Swal.fire({
      icon: "info",
      title: "Complete Your Profile",
      text: "Please set up your Seller Profile before uploading content! 👑",
      background: "#111827",
      color: "#fff",
    });
    openSellerModal();
    return;
  }
  const CLOUD_NAME = "dw4imlekm";
  const UPLOAD_PRESET = "br30kart_preset";
  const form = e.target;
  const btn = form.querySelector("button");
  const setLoading = (state) => {
    btn.disabled = state;
    btn.innerHTML = state ? 'Uploading... <i class="fas fa-spinner fa-spin"></i>' : "Publish Content";
  };
  try {
    if (!window.activeSeller) {
      Swal.fire({
        icon: "info",
        title: "Profile Setup Required",
        text: "Please complete your seller profile first. 👑",
        background: "#111827",
        color: "#fff",
      });
      openSellerModal();
      return;
    }
    const fileInput = document.getElementById("thumbInput");
    const file = fileInput?.files?.[0];
    if (!file) {
      return Swal.fire({
        icon: "warning",
        title: "Thumbnail Missing",
        text: "Please select a thumbnail image for your course. 📸",
        background: "#111827",
        color: "#fff",
      });
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    console.log("📤 Uploading to Cloudinary...");
    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const cloudData = await cloudRes.json().catch(() => ({}));
    if (!cloudRes.ok) {
      const msg = cloudData?.error?.message || "Image upload failed";
      throw new Error(msg);
    }
    const productData = {
      title: document.getElementById("title").value.trim(),
      category: document.getElementById("category").value,
      price: Number(document.getElementById("price").value),
      videoLink: document.getElementById("videoLink").value.trim(),
      thumbnail: cloudData.secure_url,
      sellerEmail: window.activeSeller.email,
      sellerName: window.activeSeller.name,
      discount: 0,
    };
    if (!productData.title || !productData.price) {
      throw new Error("Course title and price are mandatory.");
    }
    console.log("📦 Saving to database...");
    const mongoRes = await fetch(`${CONFIG.BASE_API_URL}/products/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    const mongoData = await mongoRes.json().catch(() => ({}));
    if (!mongoRes.ok) {
      throw new Error(mongoData.error || "Database save failed");
    }
    Swal.fire({
      icon: "success",
      title: "Published Successfully 🚀",
      text: "Your course is now live on the platform!",
      timer: 2500,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    form.reset();
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    console.error("🔥 Upload Error:", err.message);
    Swal.fire({
      icon: "error",
      title: "Upload Failed",
      text: err.message || "An unexpected error occurred during upload.",
      background: "#111827",
      color: "#fff",
    });
  } finally {
    btn.innerHTML = "Publish Content";
    btn.disabled = false;
  }
};

function lockPublishButton(btn) {
  if (btn) {
    btn.disabled = true;
    btn.innerText = "❌ Setup Profile First";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";
    btn.style.filter = "grayscale(100%)";
    btn.onclick = (e) => {
      e.preventDefault();
      Swal.fire({
        icon: "info",
        title: "Action Required",
        text: "Please complete your seller profile setup before you can publish content.",
        background: "#111827",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Setup Now",
      }).then((result) => {
        if (result.isConfirmed) {
          openSellerModal();
        }
      });
    };
  }
}

function unlockPublishButton(btn) {
  if (btn) {
    btn.disabled = false;
    btn.innerText = "Publish Content";
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    btn.style.filter = "none";
    btn.style.background = "#00ffcc";
    btn.style.color = "#000";
    btn.style.boxShadow = "0 0 10px rgba(0, 255, 204, 0.5)";
    btn.onclick = null;
    console.log("%c[UI] Publish Button Unlocked: Profile Verified", "color: #00ffcc; font-weight: bold;");
  } else {
    console.warn("Unlock failed: Publish button reference not found.");
  }
}

async function saveGlobalCoupon() {
  const code = document.getElementById("cCode").value.toUpperCase() || "SALE";
  const per = document.getElementById("cPercent").value;
  const sEmail = localStorage.getItem("sellerEmail");
  if (!per) {
    return Swal.fire({
      icon: "warning",
      title: "Percentage Missing! 🎟️",
      text: "Please enter a valid percentage to apply the discount.",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#fbbf24",
    });
  }
  try {
    Swal.fire({
      title: "Activating Global Offer...",
      text: "Applying discount to all your courses 🚀",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/set-global-discount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount: parseInt(per),
        sellerEmail: sEmail,
      }),
    });
    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Offer is Live! 🔥",
        html: `A <b style="color:#00ffcc;">${per}% Discount</b> has been successfully applied to all your courses.`,
        background: "#111827",
        color: "#fff",
        confirmButtonText: "Excellent!",
        confirmButtonColor: "#D4AF37",
        timer: 3000,
      });
      displayGlobalStatus(code, per);
      if (typeof loadMyManageContent === "function") loadMyManageContent();
    } else {
      throw new Error("Server update failed");
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Update Failed!",
      text: "Could not update the discount. Please try again later.",
      background: "#111827",
      color: "#fff",
    });
  }
}

function displayGlobalStatus(code, per) {
  const list = document.getElementById("couponList");
  list.innerHTML = `
        <div style="background: rgba(251, 191, 36, 0.1); border: 1px dashed #fbbf24; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span style="color: #fbbf24; font-weight: bold; font-size: 16px;">📢 ACTIVE SALE: ${code}</span>
                <div style="color: #fff; font-size: 12px;">Saare courses par ${per}% discount chal raha hai.</div>
            </div>
            <button onclick="stopMegaSale()" style="background: #ef4444; border: none; color: white; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                🛑 Stop Sale
            </button>
        </div>
    `;
}

async function stopMegaSale() {
  const sEmail = localStorage.getItem("sellerEmail");
  const result = await Swal.fire({
    title: "Stop Mega Sale?",
    text: "This will remove discount from all courses permanently.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Stop Sale",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#fff",
  });
  if (!result.isConfirmed) return;
  try {
    Swal.fire({
      title: "Processing...",
      text: "Removing all discounts...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/set-global-discount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount: 0,
        sellerEmail: sEmail,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to stop sale");
    }
    document.getElementById("couponList").innerHTML = "";
    Swal.fire({
      icon: "success",
      title: "Sale Stopped!",
      text: "All discounts have been removed successfully.",
      timer: 2000,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed!",
      text: err.message || "Server error occurred",
      background: "#111827",
      color: "#fff",
    });
  }
}

function displayCoupon(code, per) {
  const list = document.getElementById("couponList");
  if (!list) return;
  list.innerHTML = `
        <div class="active-coupon-card" style="margin-top:15px; border:1px solid #00ffcc; padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,255,204,0.05);">
            <div>
                <span style="color: #00ffcc; font-weight: bold;">LIVE: ${code}</span> 
                <small style="margin-left:10px; color: #fff;">(${per}% OFF on All)</small>
            </div>
            <button onclick="deleteGlobalCoupon()" class="delete-btn" style="background:none; border:none; cursor:pointer; font-size:18px;">🗑️</button>
        </div>`;
}

async function deleteGlobalCoupon() {
  const sEmail = localStorage.getItem("sellerEmail");
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This will remove discount from all courses!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Remove It!",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#fff",
  });
  if (!result.isConfirmed) return;
  try {
    Swal.fire({
      title: "Processing...",
      text: "Removing global discount",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/set-global-discount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount: 0,
        sellerEmail: sEmail,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    document.getElementById("couponList").innerHTML = "";
    Swal.fire({
      icon: "success",
      title: "Done!",
      text: "All discounts have been removed successfully.",
      timer: 2000,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed!",
      text: err.message || "Server error occurred",
      background: "#111827",
      color: "#fff",
    });
  }
}

function displayCoupon(code, per) {
  document.getElementById("couponList").innerHTML = `
        <div class="active-coupon-card">
            <div><span style="color: #00ffcc; font-weight: bold;">LIVE: ${code}</span> 
            <small style="margin-left:10px; color: #fff;">(${per}% OFF)</small></div>
            <button onclick="deleteCoupon()" class="delete-btn">🗑️ Delete</button>
        </div>`;
}

async function deleteCoupon() {
  const result = await Swal.fire({
    title: "Remove Coupon?",
    text: "This coupon will be permanently removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#fff",
  });
  if (!result.isConfirmed) return;
  try {
    Swal.fire({
      title: "Deleting...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/cancel-coupon`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Delete failed");
    }
    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Coupon removed successfully.",
      timer: 2000,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed!",
      text: err.message || "Server error",
      background: "#111827",
      color: "#fff",
    });
  }
}

function downloadReport() {
  Swal.fire({
    title: "System Update 📊",
    text: "The Sales Tracking & Report system will be activated very soon! Stay tuned.",
    icon: "info",
    background: "#111827",
    color: "#fff",
    confirmButtonColor: "#3b82f6",
    confirmButtonText: "Understood",
  });
}

async function loadMyManageContent() {
  const email = localStorage.getItem("sellerEmail");
  if (!email) return;
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/my-products/${email}`);
    const products = await res.json();
    let html = "";
    let globalDiscountFound = 0;
    products.forEach((item) => {
      const hasDiscount = item.discount > 0;
      if (hasDiscount) globalDiscountFound = item.discount;
      html += `
                <div class="status-box" style="display:flex; justify-content:space-between; align-items:center; background:#111827; padding:15px; border-radius:10px; border:1px solid #334155; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="${item.thumbnail}" style="width:50px; height:40px; border-radius:5px; object-fit:cover;">
                        <div>
                            <div style="font-weight:bold;" class="course-title">${item.title}</div>
                            <div style="font-size:12px; display:flex; align-items:center; gap:10px;">
                                <span style="color:#fff;">₹${item.price}</span>
                                <!-- 🔥 SEPARATE COUPON BADGE -->
                                ${hasDiscount ? `<span style="background:#00ffcc; color:#000; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:10px; box-shadow: 0 0 5px #00ffcc;">🏷️ ${item.discount}% OFF</span>` : `<span style="color:#64748b; font-size:10px;">(No Coupon)</span>`}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button onclick="setProductDiscount('${item._id}')" class="apply-btn" style="background:#fbbf24; color:#000; padding:5px 12px; font-size:12px;">🎟️ Set %</button>
                        <button onclick="openEditModal('${item._id}', '${item.title}', ${item.price}, '${item.videoLink}', '${item.thumbnail}')" 
                            class="apply-btn" style="background:#3b82f6; padding:5px 12px; font-size:12px;">✏️ Edit</button>
                        <button onclick="deleteProduct('${item._id}')" class="delete-btn" style="padding:5px 12px; font-size:12px;">🗑️</button>
                    </div>
                </div>`;
    });
    if (globalDiscountFound > 0) {
      if (typeof displayGlobalStatus === "function") {
        displayGlobalStatus("ACTIVE MEGA SALE", globalDiscountFound);
      }
    } else {
      const couponBox = document.getElementById("couponList");
      if (couponBox) couponBox.innerHTML = "";
    }
    document.getElementById("myContentList").innerHTML = html || "<p style='color:gray; text-align:center; padding:20px;'>Abhi tak koi course upload nahi kiya gaya hai.</p>";
  } catch (err) {
    console.error("Manage Content Load Error:", err);
  }
}

function filterCourses() {
  let input = document.getElementById("courseSearch").value.toLowerCase();
  let container = document.getElementById("myContentList");
  let cards = container.querySelectorAll(".status-box");
  let visibleCount = 0;
  cards.forEach((card) => {
    let title = card.querySelector(".course-title").innerText.toLowerCase();
    if (title.includes(input)) {
      card.style.display = "flex";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });
  let noResultMsg = document.getElementById("no-result-msg");
  if (noResultMsg) noResultMsg.remove();
  if (visibleCount === 0 && input !== "") {
    const msg = document.createElement("div");
    msg.id = "no-result-msg";
    msg.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <p style="font-size: 40px; margin-bottom: 10px;">🔍</p>
                <p style="font-size: 16px;">Bhai, "<b>${input}</b>" naam ka koi course nahi mila!</p>
                <button onclick="clearSearch()" style="background: none; border: none; color: #00ffcc; cursor: pointer; text-decoration: underline;">Clear Search</button>
            </div>
        `;
    container.appendChild(msg);
  }
}

function clearSearch() {
  document.getElementById("courseSearch").value = "";
  filterCourses();
}

function handleSearchEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    filterCourses();
    console.log("🔍 Search triggered by Enter key");
  }
}

function openEditModal(id, title, price, url, thumb) {
  const elId = document.getElementById("editId");
  const elTitle = document.getElementById("editTitle");
  const elPrice = document.getElementById("editPrice");
  const elUrl = document.getElementById("editUrl");
  const elThumbHidden = document.getElementById("editThumbUrl");
  const elFileInput = document.getElementById("editThumbFile");
  const elModal = document.getElementById("editModal");
  if (elId) elId.value = id;
  if (elTitle) elTitle.value = title;
  if (elPrice) elPrice.value = price;
  if (elUrl) elUrl.value = url || "";
  if (elThumbHidden) {
    elThumbHidden.value = thumb || "";
  }
  if (elFileInput) {
    elFileInput.value = "";
  }
  if (elModal) {
    elModal.style.display = "flex";
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Editing Course Content",
      showConfirmButton: false,
      timer: 1500,
      background: "#111827",
      color: "#fff",
    });
    console.log(`%c[EDIT] Modal opened for Course ID: ${id}`, "color: #3b82f6; font-weight: bold;");
  } else {
    console.error("❌ UI Error: 'editModal' ID not found in the DOM!");
    Swal.fire({
      icon: "error",
      title: "Modal Error",
      text: "The edit interface could not be found.",
      background: "#111827",
      color: "#fff",
    });
  }
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  if (modal) {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      modal.style.opacity = "1";
      console.log("%c[UI] Edit Modal Closed", "color: #6b7280; font-weight: bold;");
    }, 200);
  } else {
    console.error("❌ Error: Could not find 'editModal' element.");
  }
}

const editForm = document.getElementById("editForm");
if (editForm) {
  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;
    const id = document.getElementById("editId").value;
    const fileInput = document.getElementById("editThumbFile");
    const file = fileInput ? fileInput.files[0] : null;
    let finalThumbnail = document.getElementById("editThumbUrl").value;
    const confirmResult = await Swal.fire({
      title: "Save Changes?",
      text: "Are you sure you want to update this course details?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6e7881",
      confirmButtonText: "Yes, Update!",
      background: "#111827",
      color: "#fff",
    });
    if (!confirmResult.isConfirmed) return;
    try {
      btn.innerText = "Updating... ⏳";
      btn.disabled = true;
      Swal.fire({
        title: "Processing...",
        text: file ? "Uploading new thumbnail to Cloudinary..." : "Updating database records...",
        allowOutsideClick: false,
        background: "#111827",
        color: "#fff",
        didOpen: () => {
          Swal.showLoading();
        },
      });
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const cloudData = await cloudRes.json();
        if (!cloudRes.ok) throw new Error("Image upload failed");
        finalThumbnail = cloudData.secure_url;
      }
      const updatedData = {
        title: document.getElementById("editTitle").value.trim(),
        price: Number(document.getElementById("editPrice").value),
        videoLink: document.getElementById("editUrl").value.trim(),
        thumbnail: finalThumbnail,
      };
      const res = await fetch(`${CONFIG.BASE_API_URL}/products/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Updated Successfully! ✅",
          text: "Course details have been synced with the database.",
          background: "#111827",
          color: "#fff",
          timer: 2000,
          showConfirmButton: false,
        });
        closeEditModal();
        if (typeof loadMyManageContent === "function") loadMyManageContent();
      } else {
        throw new Error("Update failed on Database Atlas");
      }
    } catch (err) {
      console.error("Update Error:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Server connection error. Please try again.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };
}

async function updateProduct() {
  const id = document.getElementById("editId").value;
  const title = document.getElementById("editTitle").value.trim();
  const price = document.getElementById("editPrice").value;
  const videoLink = document.getElementById("editUrl").value.trim();
  const fileInput = document.getElementById("editThumbFile");
  const oldThumb = document.getElementById("editThumbUrl").value;
  const saveBtn = document.querySelector("#editModal button[onclick='updateProduct()']");
  if (!title || !price) {
    return Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please provide both a title and a price for the course.",
      background: "#111827",
      color: "#fff",
    });
  }
  try {
    if (saveBtn) {
      saveBtn.innerText = "UPDATING...";
      saveBtn.disabled = true;
    }
    Swal.fire({
      title: "Updating Course...",
      text: "Please wait while we sync the details with the database.",
      background: "#111827",
      color: "#fff",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("videoLink", videoLink);
    if (fileInput && fileInput.files[0]) {
      formData.append("thumbnail", fileInput.files[0]);
    } else {
      formData.append("thumbnail", oldThumb);
    }
    const res = await fetch(`${window.API_BASE_URL}/api/products/update/${id}`, {
      method: "PUT",
      headers: { "x-auth-token": localStorage.getItem("token") },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Updated Successfully!",
        text: "The course details have been updated in the system.",
        timer: 2000,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
      document.getElementById("editModal").style.display = "none";
      if (typeof loadMyManageContent === "function") loadMyManageContent();
    } else {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: data.msg || "There was an issue updating the course records.",
        background: "#111827",
        color: "#fff",
      });
    }
  } catch (err) {
    console.error("Update Error:", err);
    Swal.fire({
      icon: "error",
      title: "Connection Error",
      text: "Unable to reach the server. Please check your network.",
      background: "#111827",
      color: "#fff",
    });
  } finally {
    if (saveBtn) {
      saveBtn.innerText = "SAVE CHANGES";
      saveBtn.disabled = false;
    }
  }
}
window.addEventListener("load", loadMyManageContent);

async function deleteProduct(id) {
  const result = await Swal.fire({
    title: "Delete Product?",
    text: "This course will be permanently removed from Atlas.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#fff",
  });
  if (!result.isConfirmed) return;
  try {
    Swal.fire({
      title: "Deleting...",
      text: "Please wait while we remove the product",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/delete/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Delete failed");
    }
    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Course removed successfully.",
      timer: 2000,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed!",
      text: err.message || "Server error occurred",
      background: "#111827",
      color: "#fff",
    });
  }
}

async function loadSalesTracker() {
  const sEmail = localStorage.getItem("sellerEmail");
  if (!sEmail) return;
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/seller-report/${sEmail}`);
    const orders = await res.json().catch(() => []);
    if (!res.ok) {
      throw new Error("Failed to load sales data");
    }
    if (Array.isArray(orders)) {
      window.allOrders = orders;
      const total = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
      const el = document.getElementById("totalSalesAmount");
      if (el) el.innerText = total.toLocaleString();
      console.log("📊 Sales loaded:", orders.length);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    Swal.fire({
      icon: "error",
      title: "Failed to load sales",
      text: err.message || "Server error",
      background: "#111827",
      color: "#fff",
    });
  }
}
loadSalesTracker();

function filterSalesByDate() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!start || !end) return alert("Bhai, dono dates select karo!");
  const filtered = window.allOrders.filter((order) => {
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    return orderDate >= start && orderDate <= end;
  });
  calculateTotal(filtered);
  window.filteredOrders = filtered;
}

function downloadReport() {
  const dataToExport = window.filteredOrders || window.allOrders;
  if (!dataToExport || dataToExport.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "No Data Found",
      text: "There is no data available to export at the moment 📊",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
    return;
  }
  try {
    let csvContent = "Date,Product,Customer,Amount\n";
    dataToExport.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB") : "N/A";
      const product = (order.productName || "N/A").replace(/"/g, '""');
      const customer = (order.customerName || "N/A").replace(/"/g, '""');
      const amount = Number(order.amount) || 0;
      csvContent += `${date},"${product}","${customer}",${amount}\n`;
    });
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().split("T")[0];
    a.download = `Sales_Report_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Swal.fire({
      icon: "success",
      title: "Report Exported!",
      text: "The sales report has been downloaded successfully 📁",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
      background: "#111827",
      color: "#fff",
    });
  } catch (error) {
    console.error("Export Error:", error);
    Swal.fire({
      icon: "error",
      title: "Export Failed",
      text: "An error occurred while generating the report.",
      background: "#111827",
      color: "#fff",
    });
  }
}
window.addEventListener("load", loadSalesTracker);

function openSellerModal() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData?.email) {
    window.location.href = "/login";
    return;
  }
  document.getElementById("sellerModal").style.display = "flex";
  const emailFields = ["sEmail", "loginEmail"];
  emailFields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = userData.email;
    el.readOnly = true;
    el.style.background = "#334155";
    el.style.cursor = "not-allowed";
  });
}

document.getElementById("sellerLoginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData?.email) {
    window.location.href = "/login";
    return;
  }
  const inputEmail = document.getElementById("loginEmail")?.value;
  if (inputEmail !== userData.email) {
    Swal.fire({
      icon: "error",
      title: "Security Alert",
      text: "Email mismatch detected!",
      background: "#111827",
      color: "#fff",
    });
    localStorage.clear();
    window.location.href = "/login";
    return;
  }
  fetchProfile(inputEmail);
});

function refreshSearch() {
  const input = document.getElementById("courseSearch");
  input.value = "";
  filterCourses();
}

function applyFilter() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
}

function refreshSales() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
}

async function setProductDiscount(productId) {
  try {
    const { value: discount } = await Swal.fire({
      title: "🎁 Set Course Discount",
      input: "number",
      inputLabel: "Enter discount percentage (%)",
      inputPlaceholder: "e.g. 20",
      background: "#111827",
      color: "#fff",
      confirmButtonText: "Apply",
      confirmButtonColor: "#fbbf24",
      showCancelButton: true,
      cancelButtonColor: "#374151",
      inputAttributes: {
        min: 1,
        max: 99,
        step: 1,
      },
      inputValidator: (value) => {
        if (!value) return "Discount is required!";
        if (isNaN(value)) return "Please enter a valid number!";
        if (value < 1 || value > 99) return "Enter value between 1 and 99!";
      },
    });
    if (!discount) return;
    const parsedDiscount = Number(discount);
    const sEmail = localStorage.getItem("sellerEmail");
    if (!sEmail) {
      return Swal.fire({
        icon: "error",
        title: "Seller not found",
        text: "Please login again.",
        background: "#111827",
        color: "#fff",
      });
    }
    Swal.fire({
      title: "Applying Discount...",
      text: "Updating your course offer",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#111827",
      color: "#fff",
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/update-discount/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        discount: parsedDiscount,
        sellerEmail: sEmail,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to update discount");
    }
    Swal.fire({
      icon: "success",
      title: "Offer Activated 🔥",
      text: `${parsedDiscount}% discount applied successfully`,
      timer: 2000,
      showConfirmButton: false,
      background: "#111827",
      color: "#fff",
    });
    if (typeof loadMyManageContent === "function") {
      loadMyManageContent();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Update Failed!",
      text: err.message || "Something went wrong",
      background: "#111827",
      color: "#fff",
    });
  }
}
//#endregion
