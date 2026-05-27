//#region
if (!window.API_BASE_URL) {
  window.API_BASE_URL = "https://br30kart-api.onrender.com";
}

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");
  const sellerBtn = document.getElementById("sellerDashLink");
  if (sellerBtn) {
    const allowedRoles = ["admin", "seller"];
    if (!allowedRoles.includes(role)) {
      sellerBtn.style.display = "none";
      console.log("%c[SECURITY] Dashboard link restricted for student role.", "color: #ff9800; font-weight: bold;");
    } else {
      sellerBtn.style.display = "flex";
      console.log(`%c[AUTH] Access granted for role: ${role.toUpperCase()}`, "color: #4caf50; font-weight: bold;");
    }
  }
});
async function loadLiveStore() {
  try {
    console.log("Fetching data from Atlas... 🚀");
    const response = await fetch(`${CONFIG.BASE_API_URL}/products`);
    const allProducts = await response.json();
    const visibleProducts = allProducts.filter((p) => {
      const isShow = p.isVisible !== false && p.isVisible !== "false";
      const isApproved = p.isApproved === true || p.isApproved === "true";
      return isShow && isApproved;
    });
    const categories = {
      Premium: visibleProducts.filter((p) => p.category === "Premium-Trading-Courses"),
      Standard: visibleProducts.filter((p) => p.category === "Trading-Standard-Course"),
      Crash: visibleProducts.filter((p) => p.category === "Crash-Course"),
      Other: visibleProducts.filter((p) => p.category === "Other"),
      pdfs: visibleProducts.filter((p) => p.category === "pdfs"),
    };
    renderDynamicSection("Premium-Grid", categories.Premium);
    renderDynamicSection("Standard-Grid", categories.Standard);
    renderDynamicSection("Crash-Grid", categories.Crash);
    renderDynamicSection("Other-Grid", categories.Other);
    renderDynamicSection("PDF-Grid", categories.pdfs);
  } catch (err) {
    console.error("❌ Data load nahi ho paya:", err);
  }
}

function renderDynamicSection(sectionId, items) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<p style="color:gray; padding:20px; font-size:14px;">Jald hi naya content aayega... 🚀</p>`;
    return;
  }
  let html = "";
  items.forEach((item) => {
    const sEmail = item.sellerEmail ? item.sellerEmail.trim() : "";
    const sName = item.sellerName || "Official Seller";
    let discount = item.discount || 0;
    const finalPriceValue = item.price - (item.price * discount) / 100;
    const isFeatured = item.isFeatured === true || String(item.isFeatured) === "true";
    html += `
            <div class="card" id="card-${item._id}">
                <img class="thumb" src="${item.thumbnail}" alt="thumb">
                <div class="content">
                    <div class="title">${item.title}</div>
                    <div class="seller">
                        By ${sName} 
                        <a href="javascript:void(0)" class="learn-link" onclick="openSeller('${sEmail}')">(Learn More)</a>
                    </div>
                    <div class="discount-box">
                        <span class="promo-badge-${item._id}" id="badge-${item._id}">
                            ${discount > 0 ? `🔥 ${discount}% OFF` : "🔥 Special Deal"}
                        </span>
                        <button class="apply-btn" onclick="applyDirectDiscount('${item._id}', ${item.price}, ${discount})">Apply</button>
                    </div>
                    <div id="timer-${item._id}" class="timer-text" style="font-size: 11px; color: #ffcc00; margin-bottom: 10px;">
                        ${discount > 0 ? "Loading timer..." : ""}
                    </div>
                    <!-- 🔥 PRICE + BEST SELLER TAG SECTION -->
                    <div class="price-container" style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span class="mrp" id="mrp-${item._id}" style="${discount > 0 ? "text-decoration: line-through; color:gray;" : ""}">₹${item.price}</span>
                            <span class="final-price" id="final-${item._id}">
                                ${discount > 0 ? `₹${finalPriceValue.toFixed(0)}` : `₹${item.price}`}
                            </span>
                        </div>
                        <!-- ✅ NEW PLACEMENT: Golden Blinking Best Seller Tag -->
                        ${
                          isFeatured
                            ? `
                        <div class="best-seller-blink" style="
                            background: rgba(255, 193, 7, 0.15);
                            color: #ffc107;
                            padding: 3px 10px;
                            border-radius: 4px;
                            font-size: 9px;
                            font-weight: 800;
                            text-transform: uppercase;
                            border: 1px solid rgba(255, 193, 7, 0.4);
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            white-space: nowrap;
                        ">
                            <i class="fas fa-crown" style="font-size: 10px;"></i> BEST SELLER
                        </div>
                        `
                            : ""
                        }
                    </div>
                    <button class="btn buy" onclick='buyNow(${JSON.stringify(item)})'>
                        Buy Now
                    </button>
                </div>
            </div>
        `;
    if (discount > 0 && item.couponCreatedAt) {
      setTimeout(() => startCountdown(item._id, item.couponCreatedAt), 100);
    }
  });
  container.innerHTML = html;
}

const style = document.createElement("style");
style.innerHTML = `
  .best-seller-blink {
    animation: smoothBlink 2s infinite ease-in-out;
  }
  @keyframes smoothBlink {
    0% { opacity: 1; transform: scale(1); box-shadow: 0 0 5px rgba(255, 193, 7, 0.2); }
    50% { opacity: 0.8; transform: scale(1.03); box-shadow: 0 0 12px rgba(255, 193, 7, 0.5); }
    100% { opacity: 1; transform: scale(1); box-shadow: 0 0 5px rgba(255, 193, 7, 0.2); }
  }
`;
document.head.appendChild(style);

function startCountdown(productId, createdAt) {
  const timerElement = document.getElementById(`timer-${productId}`);
  if (!timerElement) return;

  const startTime = new Date(createdAt).getTime();
  const expiryTime = startTime + 7 * 24 * 60 * 60 * 1000;
  const x = setInterval(function () {
    const now = new Date().getTime();
    const distance = expiryTime - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (distance < 0) {
      clearInterval(x);
      timerElement.innerHTML = "❌ Offer Expired";
      document.getElementById(`badge-${productId}`).innerHTML = "🔥 Hot Deal";
    } else {
      timerElement.innerHTML = `⏳ Ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
  }, 1000);
}

function applyDirectDiscount(id, price, discount) {
  if (!discount || discount <= 0) {
    return Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Regular Price",
      text: "No active offers on this course currently.",
      showConfirmButton: false,
      timer: 2000,
      background: "#111827",
      color: "#fff",
    });
  }
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Discount Applied!",
    html: `<b style="color:#00ffcc;">${discount}% OFF</b> added to your cart.`,
    showConfirmButton: false,
    timer: 2500,
    background: "#111827",
    color: "#fff",
    iconColor: "#00ffcc",
    showClass: {
      popup: "animate__animated animate__fadeInRight",
    },
  });
  console.log(`%c[OFFER] ${discount}% Discount synced for Product ID: ${id}`, "color: #00ffcc; font-weight: bold;");
}
window.onload = loadLiveStore;

async function openSellerModal() {
  const modal = document.getElementById("sellerModal");
  const sellerEmail = localStorage.getItem("sellerEmail");
  if (!modal) {
    return console.error("❌ UI Error: 'sellerModal' ID not found in the DOM.");
  }
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: "Fetching Profile...",
    showConfirmButton: false,
    timer: 1500,
    background: "#111827",
    color: "#fff",
  });
  try {
    modal.style.display = "flex";
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.transition = "opacity 0.3s ease";
      modal.style.opacity = "1";
    }, 10);
    if (sellerEmail) {
      console.log(`%c[ATLAS] Syncing profile for: ${sellerEmail}`, "color: #3b82f6; font-weight: bold;");
    }
  } catch (err) {
    console.error("Critical error while opening modal:", err);
    Swal.fire({
      icon: "error",
      title: "Modal Error",
      text: "Unable to load seller profile interface.",
      background: "#111827",
      color: "#fff",
    });
  }
}

function closeSellerModal() {
  const modal = document.getElementById("sellerModal");
  if (modal) {
    modal.style.transition = "opacity 0.3s ease";
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      console.log("%c[UI] Seller Modal Closed Successfully", "color: #6b7280; font-weight: bold;");
    }, 300);
  } else {
    console.warn("Attempted to close modal, but #sellerModal was not found.");
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSellerModal();
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("sellerModal");
  if (e.target === modal) closeSellerModal();
});

function closeSellerModal() {
  document.getElementById("sellerModal").style.display = "none";
}

async function openSeller(email) {
  const cleanEmail = email ? email.trim() : "";
  console.log("%c[FETCH] Searching Seller Identity:", "color: #3b82f6; font-weight: bold;", cleanEmail);
  if (!cleanEmail || cleanEmail === "null" || cleanEmail === "undefined") {
    return Swal.fire({
      icon: "error",
      title: "Data Missing",
      text: "Seller email record was not found in the database (Atlas).",
      background: "#111827",
      color: "#fff",
    });
  }
  try {
    Swal.fire({
      title: "Syncing Profile...",
      text: "Fetching seller credentials from Atlas...",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/seller-info/${cleanEmail}`);
    const seller = await res.json();
    if (!seller || !seller.name) {
      throw new Error(`Profile not found for: ${cleanEmail}`);
    }
    document.getElementById("modalSellerName").innerText = "👑 " + seller.name.toUpperCase();
    document.getElementById("modalSellerEmail").innerText = seller.email;
    document.getElementById("modalSellerBio").innerText = seller.bio || "No biography available.";
    document.getElementById("modalSellerAddress").innerText = "📍 Location: " + (seller.address || "Global");
    let socialHTML = "";
    if (seller.youtube) socialHTML += `<a href="${seller.youtube}" target="_blank" style="background:#ff0000; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; margin-right:8px; font-size:12px; font-weight:bold;">YOUTUBE</a>`;
    if (seller.instagram) socialHTML += `<a href="${seller.instagram}" target="_blank" style="background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:bold;">INSTAGRAM</a>`;
    document.getElementById("modalSocialLinks").innerHTML = socialHTML || "<span style='color:#6b7280;'>No social profiles linked.</span>";
    Swal.close();
    const detailModal = document.getElementById("sellerDetailModal");
    if (detailModal) detailModal.style.display = "flex";
  } catch (err) {
    console.error("Seller Fetch Error:", err);
    Swal.fire({
      icon: "error",
      title: "System Error",
      text: err.message || "Unable to connect to the server. Please try again.",
      background: "#111827",
      color: "#fff",
    });
  }
}

function closeSellerModal() {
  const modal = document.getElementById("sellerDetailModal");
  if (modal) {
    modal.style.transition = "opacity 0.3s ease";
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      modal.style.opacity = "1";
      console.log("%c[UI] Seller Detail Modal Closed Successfully", "color: #6b7280; font-weight: bold;");
    }, 300);
  } else {
    console.error("❌ UI Error: Element with ID 'sellerDetailModal' not found in the DOM.");
  }
}

async function loadMyContent() {
  const email = localStorage.getItem("sellerEmail");
  const res = await fetch(`${CONFIG.BASE_API_URL}/products`);
  const all = await res.json();
  const myItems = all.filter((p) => p.sellerEmail === email);
  let html = "";
  myItems.forEach((item) => {
    html += `
            <div class="status-box" style="display:flex; justify-content:space-between; align-items:center; background:#111827; padding:15px; border-radius:10px; border:1px solid #334155;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${item.thumbnail}" style="width:50px; height:40px; border-radius:5px; object-fit:cover;">
                    <div>
                        <div style="font-weight:bold;">${item.title}</div>
                        <div style="font-size:12px; color:#00ffcc;">₹${item.price} | Discount: ${item.discount}%</div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="openCouponPrompt('${item._id}')" class="apply-btn" style="background:#fbbf24; color:#000;">🎟️ Set %</button>
                    <button onclick="openEditModal('${item._id}', '${item.title}', ${item.price}, '${item.videoLink}')" class="apply-btn">✏️ Edit</button>
                    <button onclick="deleteProduct('${item._id}')" class="delete-btn">🗑️</button>
                </div>
            </div>
        `;
  });
  document.getElementById("myContentList").innerHTML = html || "<p>No content uploaded yet.</p>";
}

async function openCouponPrompt(id) {
  const { value: percent } = await Swal.fire({
    title: "Set Course Discount",
    input: "number",
    inputLabel: "Enter discount percentage (0-100)",
    inputPlaceholder: "e.g. 20",
    background: "#111827",
    color: "#fff",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    inputAttributes: {
      min: 0,
      max: 100,
      step: 1,
    },
    inputValidator: (value) => {
      if (!value) return "Please enter a number!";
      if (value < 0 || value > 100) return "Enter a value between 0 and 100!";
    },
  });
  if (percent === undefined) return;
  try {
    Swal.fire({
      title: "Applying Discount...",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/products/update-discount/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount: parseInt(percent) }),
    });
    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Discount Updated!",
        text: `The course now has a ${percent}% OFF coupon.`,
        timer: 2000,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
      if (typeof loadMyContent === "function") loadMyContent();
    } else {
      throw new Error("Failed to update database.");
    }
  } catch (err) {
    console.error("Coupon Error:", err);
    Swal.fire("Error", "Could not update discount. Try again.", "error");
  }
}

async function buyNow(product) {
  try {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const buyerEmail = localStorage.getItem("userEmail") || localStorage.getItem("email") || storedUser.email || storedUser.user?.email || storedUser.data?.email || "";

    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login first to continue purchase",
        confirmButtonText: "Login Now",
      }).then(() => {
        window.location.href = "/login";
      });
      return;
    }

    const now = new Date().getTime();
    const startTime = new Date(product.couponCreatedAt || product.createdAt).getTime();
    const expiryTime = startTime + 7 * 24 * 60 * 60 * 1000;

    let finalPrice = product.price;
    if (now < expiryTime && product.discount > 0) {
      finalPrice = product.price - (product.price * product.discount) / 100;
    }

    Swal.fire({
      title: "Processing Payment...",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const response = await fetch(`${CONFIG.BASE_API_URL}/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: finalPrice,
        productId: product._id,
        buyerEmail,
        sellerEmail: product.sellerEmail,
      }),
    });

    if (!response.ok) {
      Swal.fire({ icon: "error", title: "Failed", text: "Order creation failed" });
      return;
    }

    const data = await response.json();

    const sendFailureMail = async (reason) => {
      if (!buyerEmail) {
        console.error("❌ buyerEmail missing. Login data not found in localStorage.");
        return;
      }
      try {
        await fetch(`${CONFIG.BASE_API_URL}/payment/payment-failure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: product._id,
            buyerEmail,
            reason,
          }),
        });
        console.log("✅ Failure mail triggered");
      } catch (err) {
        console.error("❌ Failure mail API error:", err);
      }
    };

    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      name: "BR30 Trader",
      description: product.title,
      order_id: data.orderId,
      prefill: { email: buyerEmail || "" },
      theme: { color: "#00FFAB" },
      modal: {
        ondismiss: async function () {
          Swal.close();
          await sendFailureMail("User closed Razorpay popup");
        },
      },
      handler: async function (paymentResponse) {
        try {
          Swal.fire({
            title: "Verifying Payment...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          const verifyRes = await fetch(`${CONFIG.BASE_API_URL}/payment/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              productId: product._id,
              buyerEmail,
              sellerEmail: product.sellerEmail,
              amount: finalPrice,
            }),
          });

          if (verifyRes.ok) {
            Swal.fire({
              icon: "success",
              title: "Payment Success 🎉",
              text: "Course unlocked!",
              timer: 2000,
              showConfirmButton: false,
            });

            setTimeout(() => {
              window.location.href = "/my-course";
            }, 2000);
          } else {
            await sendFailureMail("Payment verification failed");
            Swal.fire({
              icon: "error",
              title: "Verification Failed",
              text: "Payment verify nahi ho paya",
            });
          }
        } catch (err) {
          console.error(err);
          await sendFailureMail("Server error during payment verification");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Server error during verification",
          });
        }
      },
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", async function (response) {
      console.log("❌ Razorpay Payment Failed:", response.error);
      await sendFailureMail(response.error.description || "Payment Failed");
    });

    rzp.open();
  } catch (err) {
    console.error("Buy Error:", err);
    Swal.fire({
      icon: "error",
      title: "Payment Failed",
      text: "Try again later",
    });
  }
}

let socket;
if (typeof io !== "undefined") {
  socket = io(window.API_BASE_URL);
  console.log("✅ Socket Client Connected!");
  socket.on("new_notification", (data) => {
    allNotifications.unshift(data);
    renderNotifications();
    Swal.fire({
      title: data.title,
      text: data.message,
      icon: "success",
      toast: true,
      position: "top-end",
      timer: 4000,
    });
  });
} else {
  console.error("❌ Socket.io CDN missing in HTML!");
}

let allNotifications = [];
const getNotifElements = () => ({
  bell: document.getElementById("bellBtn"),
  dropdown: document.getElementById("notifDropdown"),
  notifBody: document.getElementById("notifBody"),
  countBadge: document.querySelector(".notif-count"),
  clearBtn: document.getElementById("clearNotif"),
});

function renderNotifications() {
  const { countBadge, notifBody } = getNotifElements();
  const count = allNotifications.length;
  if (countBadge) {
    countBadge.innerText = count;
    countBadge.style.display = count > 0 ? "block" : "none";
  }
  if (notifBody) {
    if (count > 0) {
      notifBody.innerHTML = allNotifications
        .map((item) => {
          const targetId = `card-${item.productId || item._id}`;
          return `
                <div class="notif-item" onclick="location.hash='card-${item.productId || item._id}';">
        <p><strong>${item.title}</strong></p>
        <p>${item.message}</p>
        <small>${new Date(item.createdAt || Date.now()).toLocaleString()}</small>
    </div>
            `;
        })
        .join("");
    } else {
      notifBody.innerHTML = '<p style="padding:15px; text-align:center; color:#888;">No new notifications</p>';
    }
  }
}

async function fetchOldNotifications() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ User not logged in, but fetching public notifications...");
    }
    const response = await fetch(`${CONFIG.BASE_API_URL}/products/notifications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token || "",
      },
    });
    if (!response.ok) throw new Error("Fetch failed");
    allNotifications = await response.json();
    renderNotifications();
  } catch (err) {
    console.error("📢 Purane notifications nahi mile:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const { bell, dropdown, clearBtn } = getNotifElements();
  if (bell) {
    bell.onclick = (e) => {
      e.stopPropagation();
      console.log("🔔 Bell Clicked!");
      const isOpen = dropdown.classList.toggle("show");
      if (window.innerWidth <= 768) {
        if (isOpen) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "auto";
        }
      }
    };
  }
  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      allNotifications = [];
      renderNotifications();
      document.body.style.overflow = "auto";
      Swal.fire({
        toast: true,
        position: "top-end",
        title: "Cleared",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    };
  }
  document.onclick = (e) => {
    if (dropdown && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  };
  fetchOldNotifications();
});

// document.addEventListener("contextmenu", (e) => e.preventDefault());

document.onkeydown = function (e) {
  if (e.keyCode == 123) return false;
  if (e.ctrlKey && e.shiftKey && e.keyCode == 73) return false;
  if (e.ctrlKey && e.shiftKey && e.keyCode == 74) return false;
  if (e.ctrlKey && e.keyCode == 85) return false;
};
setInterval(() => {
  if (window.outerWidth - window.innerWidth > 160) {
    document.body.innerHTML = "<h1>Access Denied</h1>";
  }
}, 1000);

document.getElementById("reviewForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const storedData = localStorage.getItem("userData");
  if (!storedData) {
    alert("Please, Login first!");
    window.location.href = "/login";
    return;
  }
  const user = JSON.parse(storedData);
  const finalUserId = user._id || user.id || (user.user && (user.user._id || user.user.id));
  const latestProfilePic = user.profilePic || (user.user && user.user.profilePic) || "";
  const data = {
    username: document.getElementById("userName").value.trim(),
    rating: document.getElementById("userRating").value,
    comment: document.getElementById("userComment").value.trim(),
    userId: finalUserId,
    profilePic: latestProfilePic,
  };
  console.log("📝 Posting Review with Data:", data);
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/reviews/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (response.ok) {
      alert("Thanks for your review! ✅");
      document.getElementById("reviewForm").reset();
      if (typeof loadTopReviews === "function") loadTopReviews();
    } else {
      alert(result.message || "Error while posting review!");
    }
  } catch (err) {
    console.error("🚨 Review Error:", err);
    alert("Server Error! Check console for details.");
  }
});

async function loadTopReviews() {
  try {
    const apiUrl = `${window.API_BASE_URL.replace(/\/$/, "")}/api/reviews/top10`;
    console.log("Calling API:", apiUrl);
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log("Full Data Received:", data);
    const reviews = (data.reviews || []).filter((r) => r.status === "approved");
    const totalCount = data.totalCount || reviews.length;
    const countElement = document.getElementById("countNumber");
    if (countElement) {
      countElement.innerText = totalCount;
    }
    const displayArea = document.getElementById("reviewDisplay");
    if (!reviews || reviews.length === 0) {
      displayArea.innerHTML = "<p style='color:gray; font-size:12px;'>No reviews yet.</p>";
      return;
    }
    const BASE_URL = `${window.API_BASE_URL}`;
    displayArea.innerHTML = reviews
      .map((r) => {
        const userName = (r.userId && r.userId.name) || r.username || "User";
        let rawPath = (r.userId && r.userId.profilePic) || r.profilePic || "";
        let profileImg;
        if (rawPath && typeof rawPath === "string" && rawPath.length > 5) {
          if (rawPath.startsWith("http")) {
            profileImg = rawPath;
          } else {
            const fileName = rawPath.split(/[\\/]/).pop();
            profileImg = `${window.API_BASE_URL}/uploads/${fileName}`;
          }
        } else {
          profileImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00ff88&color=000&bold=true&size=128`;
        }
        const adminReplyBtn = r.adminReply ? `<span onclick="window.toggleReplyBox(event, '${r._id}')" style="color:#00ff88; font-size:10px; cursor:pointer; text-decoration:underline; margin-left:8px; font-weight:normal;">View Reply</span>` : "";
        const adminReplyContent = r.adminReply
          ? `<div id="reply-box-${r._id}" class="reply-box-item" style="display:none; margin-top:8px; padding:8px; background:rgba(0,255,136,0.1); border-left:2px solid #00ff88; border-radius:4px; font-size:12px; color:#00ff88;">
              <strong style="color:#fff;">Admin:</strong> ${r.adminReply}
           </div>`
          : "";

        return `
        <div class="review-card" style="background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 12px; border-radius: 15px; border-left: 4px solid #00ff88; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="${profileImg}" 
                     onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=333&color=fff&size=128';"
                     style="width:45px; height:45px; border-radius:50%; border:2px solid #00ff88; object-fit:cover; background:#111;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color: #00ff88; font-size:15px; letter-spacing:0.5px;">${userName}</strong> 
                        <div style="display:flex; align-items:center;">
                            <span style="color:gold; font-size:11px;">${"★".repeat(r.rating || 0)}</span>
                            ${adminReplyBtn}
                        </div>
                    </div>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #e2e8f0; line-height:1.5;">${r.comment}</p>
                    ${adminReplyContent}
                </div>
            </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.error("Error:", err);
  }
}

window.toggleReplyBox = function (event, id) {
  event.stopPropagation();
  const box = document.getElementById(`reply-box-${id}`);
  const allBoxes = document.querySelectorAll(".reply-box-item");
  allBoxes.forEach((b) => {
    if (b.id !== `reply-box-${id}`) b.style.display = "none";
  });
  if (box) {
    box.style.display = box.style.display === "none" || box.style.display === "" ? "block" : "none";
  }
};

window.addEventListener("click", function (event) {
  const allBoxes = document.querySelectorAll(".reply-box-item");
  allBoxes.forEach((box) => {
    if (box.style.display === "block" && !box.contains(event.target)) {
      box.style.display = "none";
    }
  });
});

const commentBox = document.getElementById("userComment");
if (commentBox) {
  commentBox.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("reviewForm").requestSubmit();
    }
  });
}
loadTopReviews();

async function loadInitialCount() {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/reviews/top10`);
    const data = await response.json();
    if (data.totalCount !== undefined) {
      updateCountUI(data.totalCount);
    }
  } catch (err) {
    console.error("Count load karne mein error:", err);
  }
}

socket.on("updateTotalReviewCount", (newCount) => {
  console.log("Naya review aaya! New Count:", newCount);
  updateCountUI(newCount);
});

function updateCountUI(number) {
  const countElement = document.getElementById("countNumber");
  if (!countElement) return;
  const cleanNumber = Number(String(number).replace(/[^0-9.-]+/g, "")) || 0;
  const formattedNumber = new Intl.NumberFormat("en-IN").format(cleanNumber);
  countElement.textContent = formattedNumber;
  countElement.classList.add("count-update-flash");
  setTimeout(() => {
    countElement.classList.remove("count-update-flash");
  }, 1000);
}
loadInitialCount();

function updateNavbar() {
  const username = localStorage.getItem("username");
  const accountBtn = document.getElementById("navAccountBtn");
  if (username && accountBtn) {
    const firstName = username.split(" ")[0];
    accountBtn.innerHTML = `👤 ${firstName} <span class="triangle-icon">▼</span>`;
    const loginLink = document.querySelector('a[href="/login"]');
    if (loginLink) {
      loginLink.innerHTML = "🔄 Switch Account";
    }
  }
}

document.addEventListener("DOMContentLoaded", updateNavbar);

const sellerLink = document.getElementById("sellerDashLink");
const adminDashLink = document.getElementById("adminDashLink");
const logoutLink = document.getElementById("logoutLink");

const role = localStorage.getItem("role");

if (role && role.toLowerCase() === "admin") {
  adminDashLink.style.display = "block";
}

sellerLink.addEventListener("click", function (e) {
  e.preventDefault();

  this.classList.add("blink");

  const url = this.href;

  setTimeout(() => {
    this.classList.remove("blink");
    window.location.href = url;
  }, 500);
});

adminDashLink.addEventListener("click", function (e) {
  e.preventDefault();

  this.classList.add("blink");

  const url = this.href;

  setTimeout(() => {
    this.classList.remove("blink");
    window.location.href = url;
  }, 500);
});

logoutLink.addEventListener("click", function (e) {
  e.preventDefault();

  this.classList.add("blink");

  setTimeout(() => {
    this.classList.remove("blink");

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    window.location.href = "/login";
  }, 500);
});
//#endregion
