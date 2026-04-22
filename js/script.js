// --- BR30 KART DYNAMIC FRONTEND LOGIC ---
// Seller dashbord cheak roal cheak (security porpose)
/* ============================================
   Socket.io Connection Setup (admin Alart)
  ===========================================*/

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole"); // Options: 'admin', 'seller', 'student'
  const sellerBtn = document.getElementById("sellerDashLink");

  if (sellerBtn) {
    // 🛡️ LEVEL 1 SECURITY: Role-Based UI Access
    const allowedRoles = ["admin", "seller"];

    if (!allowedRoles.includes(role)) {
      // Hide the link if the user is not an Admin or Seller
      sellerBtn.style.display = "none";
      console.log(
        "%c[SECURITY] Dashboard link restricted for student role.",
        "color: #ff9800; font-weight: bold;",
      );
    } else {
      // Ensure the button is visible for authorized users
      sellerBtn.style.display = "flex";
      console.log(
        `%c[AUTH] Access granted for role: ${role.toUpperCase()}`,
        "color: #4caf50; font-weight: bold;",
      );
    }
  }
});

// 1. Database se Live Data load karne wala main function
async function loadLiveStore() {
  try {
    console.log("Fetching data from Atlas... 🚀");

    const response = await fetch(`${CONFIG.BASE_API_URL}/products`);
    const allProducts = await response.json();

    // 🔥 DOUBLE CHECK:
    // 1. isVisible 'false' नहीं होना चाहिए (Show होना चाहिए)
    // 2. isApproved 'true' होना चाहिए (Admin से पास होना चाहिए)
    const visibleProducts = allProducts.filter((p) => {
      const isShow = p.isVisible !== false && p.isVisible !== "false";
      const isApproved = p.isApproved === true || p.isApproved === "true";

      // दोनों सच होने चाहिए तभी स्टोर पर दिखेगा
      return isShow && isApproved;
    });

    const categories = {
      Premium: visibleProducts.filter(
        (p) => p.category === "Premium-Trading-Courses",
      ),
      Standard: visibleProducts.filter(
        (p) => p.category === "Trading-Standard-Course",
      ),
      Crash: visibleProducts.filter((p) => p.category === "Crash-Course"),
      Other: visibleProducts.filter((p) => p.category === "Other"),
      pdfs: visibleProducts.filter((p) => p.category === "pdfs"),
    };

    // रेंडरिंग के लिए अब सिर्फ Approved और Visible प्रोडक्ट्स ही जाएंगे
    renderDynamicSection("Premium-Grid", categories.Premium);
    renderDynamicSection("Standard-Grid", categories.Standard);
    renderDynamicSection("Crash-Grid", categories.Crash);
    renderDynamicSection("Other-Grid", categories.Other);
    renderDynamicSection("PDF-Grid", categories.pdfs);
  } catch (err) {
    console.error("❌ Data load nahi ho paya:", err);
  }
}

// 2. Render Function (HTML Cards banane ke liye)
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
    const discount = item.discount || 0;
    const finalPriceValue = item.price - (item.price * discount) / 100;

    // 🔥 BEST SELLER LOGIC: Check if product is featured
    const isFeatured =
      item.isFeatured === true || String(item.isFeatured) === "true";

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

// 🎨 Golden Blinking Animation (प्रोफेशनल लुक के लिए)
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

// function buy btn no login no click

// coupen countdown and apply logicc
function startCountdown(productId, createdAt) {
  const timerElement = document.getElementById(`timer-${productId}`);
  if (!timerElement) return;

  // 7 din baad ki expiry date
  const expiryDate = new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000;

  const x = setInterval(function () {
    const now = new Date().getTime();
    const distance = expiryDate - now;

    // Time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
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

// Simple Apply Button Logic
function applyDirectDiscount(id, price, discount) {
  // 1. Check if discount exists
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

  // 2. Success Toast for Discount Applied
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

  console.log(
    `%c[OFFER] ${discount}% Discount synced for Product ID: ${id}`,
    "color: #00ffcc; font-weight: bold;",
  );
}

// Sabse pehle store load karo
window.onload = loadLiveStore;

// Function to fetch Seller Details from Atlas (Database) and Open Modal
async function openSellerModal() {
  const modal = document.getElementById("sellerModal");
  const sellerEmail = localStorage.getItem("sellerEmail");

  if (!modal) {
    return console.error("❌ UI Error: 'sellerModal' ID not found in the DOM.");
  }

  // 1. Initial State: Show Loading Toast
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
    // 2. Open Modal with a smooth display
    modal.style.display = "flex";
    modal.style.opacity = "0";

    setTimeout(() => {
      modal.style.transition = "opacity 0.3s ease";
      modal.style.opacity = "1";
    }, 10);

    // 3. Pre-fill data if sellerEmail exists
    if (sellerEmail) {
      console.log(
        `%c[ATLAS] Syncing profile for: ${sellerEmail}`,
        "color: #3b82f6; font-weight: bold;",
      );

      // Yahan aap apna fetch logic call kar sakte ho:
      // const res = await fetch(`${CONFIG.BASE_API_URL}/get-seller-data/${sellerEmail}`);
      // const data = await res.json();
      // if(data) fillFormFields(data);
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

// Function to Close Modal smoothly
function closeSellerModal() {
  const modal = document.getElementById("sellerModal");

  if (modal) {
    // 1. Smooth Fade-out
    modal.style.transition = "opacity 0.3s ease";
    modal.style.opacity = "0";

    // 2. Clear data after animation finishes
    setTimeout(() => {
      modal.style.display = "none";
      console.log(
        "%c[UI] Seller Modal Closed Successfully",
        "color: #6b7280; font-weight: bold;",
      );
    }, 300);
  } else {
    console.warn("Attempted to close modal, but #sellerModal was not found.");
  }
}

// 🔥 GLOBAL UX: Close modal on Escape key press
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSellerModal();
});

// 🔥 GLOBAL UX: Close when clicking outside the modal content
window.addEventListener("click", (e) => {
  const modal = document.getElementById("sellerModal");
  if (e.target === modal) closeSellerModal();
});

function closeSellerModal() {
  document.getElementById("sellerModal").style.display = "none";
}

// lern more btn pe db se seller ka detail mangao
async function openSeller(email) {
  // 1. Clean the email input
  const cleanEmail = email ? email.trim() : "";
  console.log(
    "%c[FETCH] Searching Seller Identity:",
    "color: #3b82f6; font-weight: bold;",
    cleanEmail,
  );

  // 2. Validation Check
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
    // 3. Show Loading Spinner
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

    const res = await fetch(
      `${CONFIG.BASE_API_URL}/products/seller-info/${cleanEmail}`,
    );
    const seller = await res.json();

    if (!seller || !seller.name) {
      throw new Error(`Profile not found for: ${cleanEmail}`);
    }

    // 4. Update Modal UI
    document.getElementById("modalSellerName").innerText =
      "👑 " + seller.name.toUpperCase();
    document.getElementById("modalSellerEmail").innerText = seller.email;
    document.getElementById("modalSellerBio").innerText =
      seller.bio || "No biography available.";
    document.getElementById("modalSellerAddress").innerText =
      "📍 Location: " + (seller.address || "Global");

    // 5. Build Social Links (Professional Style)
    let socialHTML = "";
    if (seller.youtube)
      socialHTML += `<a href="${seller.youtube}" target="_blank" style="background:#ff0000; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; margin-right:8px; font-size:12px; font-weight:bold;">YOUTUBE</a>`;
    if (seller.instagram)
      socialHTML += `<a href="${seller.instagram}" target="_blank" style="background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:bold;">INSTAGRAM</a>`;

    document.getElementById("modalSocialLinks").innerHTML =
      socialHTML ||
      "<span style='color:#6b7280;'>No social profiles linked.</span>";

    // 6. Success: Close Loader and Show Modal
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

// Hide learn btn model
function closeSellerModal() {
  const modal = document.getElementById("sellerDetailModal");

  if (modal) {
    // 1. Smooth Fade-out Effect
    modal.style.transition = "opacity 0.3s ease";
    modal.style.opacity = "0";

    // 2. Delay display none until animation finishes
    setTimeout(() => {
      modal.style.display = "none";
      modal.style.opacity = "1"; // Reset opacity for next time
      console.log(
        "%c[UI] Seller Detail Modal Closed Successfully",
        "color: #6b7280; font-weight: bold;",
      );
    }, 300);
  } else {
    console.error(
      "❌ UI Error: Element with ID 'sellerDetailModal' not found in the DOM.",
    );
  }
}

//db se user ka sabhi course mangwao dashbord me
async function loadMyContent() {
  const email = localStorage.getItem("sellerEmail");
  const res = await fetch(`${CONFIG.BASE_API_URL}/products`);
  const all = await res.json();

  // Sirf is seller ke products filter karo
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
  document.getElementById("myContentList").innerHTML =
    html || "<p>No content uploaded yet.</p>";
}

// individual Coupon Set Logic (No Code, Only %)
async function openCouponPrompt(id) {
  // 1. Professional Input Dialog
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
    // Validation: Check if input is empty or out of range
    inputValidator: (value) => {
      if (!value) return "Please enter a number!";
      if (value < 0 || value > 100) return "Enter a value between 0 and 100!";
    },
  });

  // If admin cancels or doesn't provide value, stop here
  if (percent === undefined) return;

  try {
    // 2. Show Loading Spinner
    Swal.fire({
      title: "Applying Discount...",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch(
      `${CONFIG.BASE_API_URL}/products/update-discount/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: parseInt(percent) }),
      },
    );

    if (res.ok) {
      // 3. Success Toast
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

// --- 🚀 FULLY AUTOMATIC PAYTM PAYMENT SYSTEM ---
async function buyNow(product) {
  try {
    // 🔐 1. LOGIN CHECK FIRST (IMPORTANT)
    const token = localStorage.getItem("token");

    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login first to continue purchase",
        confirmButtonText: "Login Now",
      }).then(() => {
        const LOGIN_URL = "/pages/login.html";
        window.location.href = LOGIN_URL;
      });
      return;
    }

    console.log("Processing payment for:", product.title);

    const discountPercentage = 20;
    const discountAmount = (product.price * discountPercentage) / 100;
    const finalPrice = product.price - discountAmount;

    // 🔥 LOADING
    Swal.fire({
      title: "Processing Payment...",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await fetch(
      `${CONFIG.BASE_API_URL}/payment/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPrice,
          productId: product._id,
          buyerEmail: localStorage.getItem("userEmail"),
          sellerEmail: product.sellerEmail,
        }),
      },
    );

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Order creation failed",
      });
      return;
    }

    const data = await response.json();

    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      name: "BR30 Trader",
      description: product.title,
      order_id: data.orderId,
      prefill: {
        email: localStorage.getItem("userEmail") || "",
      },
      theme: {
        color: "#00FFAB",
      },

      handler: async function (paymentResponse) {
        try {
          Swal.fire({
            title: "Verifying Payment...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          const verifyRes = await fetch(
            `${CONFIG.BASE_API_URL}/verify-payment`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                productId: product._id,
                buyerEmail: localStorage.getItem("userEmail"),
                amount: finalPrice,
              }),
            },
          );

          if (verifyRes.ok) {
            Swal.fire({
              icon: "success",
              title: "Payment Success 🎉",
              text: "Course unlocked!",
              timer: 2000,
              showConfirmButton: false,
            });

            setTimeout(() => {
              window.location.href = "/pages/mycourse.html";
            }, 2000);
          } else {
            Swal.fire({
              icon: "error",
              title: "Verification Failed",
              text: "Payment verify nahi ho paya",
            });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Server error during verification",
          });
        }
      },
    };

    const rzp = new Razorpay(options);
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

// 1. Socket Connection
let socket;
if (typeof io !== "undefined") {
  socket = io(window.API_BASE_URL);
  console.log("✅ Socket Client Connected!");

  // Real-time Event Listener
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

// 2. State & Elements (Puraana Logic)
let allNotifications = [];
const getNotifElements = () => ({
  bell: document.getElementById("bellBtn"),
  dropdown: document.getElementById("notifDropdown"),
  notifBody: document.getElementById("notifBody"),
  countBadge: document.querySelector(".notif-count"),
  clearBtn: document.getElementById("clearNotif"),
});

// 3. UI Render Function (Ab ye Exact Product ID pe jump karega 🚀)
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
          // 🔥 MAGIC: Category ke bajaye Seedhe Product ID pe bhejenge
          // Iske liye aapke Product Card ki ID uski Database ID honi chahiye
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
      notifBody.innerHTML =
        '<p style="padding:15px; text-align:center; color:#888;">No new notifications</p>';
    }
  }
}

// 4. Fetch Old Notifications (Aapka Token wala Logic)
async function fetchOldNotifications() {
  try {
    const token = localStorage.getItem("token");

    // Agar token nahi hai, to bypass kar do (Ya login page pe bhejo)
    if (!token) {
      console.warn(
        "⚠️ User not logged in, but fetching public notifications...",
      );
    }

    const response = await fetch(
      `${CONFIG.BASE_API_URL}/products/notifications`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || "", // Token bhej rahe hain agar hai to
        },
      },
    );

    if (!response.ok) throw new Error("Fetch failed");

    allNotifications = await response.json();
    renderNotifications();
  } catch (err) {
    console.error("📢 Purane notifications nahi mile:", err.message);
  }
}

// 5. Initialize & Events
document.addEventListener("DOMContentLoaded", () => {
  const { bell, dropdown, clearBtn } = getNotifElements();

  if (bell) {
    bell.onclick = (e) => {
      e.stopPropagation();
      console.log("🔔 Bell Clicked!");
      const isOpen = dropdown.classList.toggle("show");

      // 🔥 MOBILE SCROLL LOCK: Agar mobile pe dropdown khula hai to body scroll band
      if (window.innerWidth <= 768) {
        if (isOpen) {
          document.body.style.overflow = "hidden"; // Page lock
        } else {
          document.body.style.overflow = "auto"; // Page unlock
        }
      }
    };
  }

  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      allNotifications = []; // Local clear
      renderNotifications();

      // Clear hone ke baad scroll wapas on kar dena (Safety ke liye)
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

  // Dropdown ke bahar click karne par band karna aur scroll on karna
  document.onclick = (e) => {
    if (dropdown && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
      document.body.style.overflow = "auto"; // Unlock scroll
    }
  };

  fetchOldNotifications();
});

// Right click block
document.addEventListener("contextmenu", (e) => e.preventDefault());

// F12 + DevTools block ===========================================================
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

//==============================================================================
/* =========================================
   3.  Review submil & LOADING LOGIC   
========================================= */
// 2. Main Submit Event
document.getElementById("reviewForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Latest User Data nikaalo
  const storedData = localStorage.getItem("userData");
  if (!storedData) {
    alert("Please, Login first!");
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(storedData);

  // 2. Clear IDs nikaalo (Multiple checks for safety)
  const finalUserId =
    user._id || user.id || (user.user && (user.user._id || user.user.id));

  // 3. 🚨 PROFILE PIC FIX: Direct Cloudinary URL uthao
  // Agar profile page par update hua hai, toh wahi url yahan use hoga
  const latestProfilePic =
    user.profilePic || (user.user && user.user.profilePic) || "";

  const data = {
    username: document.getElementById("userName").value.trim(),
    rating: document.getElementById("userRating").value,
    comment: document.getElementById("userComment").value.trim(),
    userId: finalUserId,
    profilePic: latestProfilePic, // Ye ab Cloudinary ka direct link (http...) bhejega
  };

  console.log("📝 Posting Review with Data:", data); // Debugging ke liye

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
      // Yahan function ka naam check kar lena (loadTopReviews ya fetchReviews)
      if (typeof loadTopReviews === "function") loadTopReviews();
    } else {
      alert(result.message || "Error while posting review!");
    }
  } catch (err) {
    console.error("🚨 Review Error:", err);
    alert("Server Error! Check console for details.");
  }
});

// ✅ 1. Updated loadTopReviews function (Inside logic updated for outside-click)
async function loadTopReviews() {
  try {
    const response = await fetch(
      `${window.API_BASE_URL.replace(/\/$/, "")}/api/reviews/top10`,
    );

    const data = await response.json(); // 1. 'reviews' की जगह 'data' नाम रखा है

    // 2. BACKEND CHANGE: अब डेटा 'data.reviews' के अंदर है
    const reviews = data.reviews || [];
    const totalCount = data.totalCount || 0;

    // 🔥 3. UI UPDATE: यहाँ आपका नया काउंट सेट होगा
    const countElement = document.getElementById("countNumber");
    if (countElement) {
      countElement.innerText = totalCount;
    }

    const displayArea = document.getElementById("reviewDisplay");

    if (!reviews || reviews.length === 0) {
      displayArea.innerHTML =
        "<p style='color:gray; font-size:12px;'>No reviews yet.</p>";
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

        const adminReplyBtn = r.adminReply
          ? `<span onclick="window.toggleReplyBox(event, '${r._id}')" style="color:#00ff88; font-size:10px; cursor:pointer; text-decoration:underline; margin-left:8px; font-weight:normal;">View Reply</span>`
          : "";

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

// ✅ 2. Pro Toggle Logic (Outside Click Support)
window.toggleReplyBox = function (event, id) {
  event.stopPropagation(); // Stop click from reaching window listener immediately
  const box = document.getElementById(`reply-box-${id}`);
  const allBoxes = document.querySelectorAll(".reply-box-item");

  // Close all other open boxes first
  allBoxes.forEach((b) => {
    if (b.id !== `reply-box-${id}`) b.style.display = "none";
  });

  if (box) {
    box.style.display =
      box.style.display === "none" || box.style.display === ""
        ? "block"
        : "none";
  }
};

// ✅ 3. Global Click Listener to close box when clicking outside
window.addEventListener("click", function (event) {
  const allBoxes = document.querySelectorAll(".reply-box-item");
  allBoxes.forEach((box) => {
    // If click is outside the box and not on a 'View Reply' button, close it
    if (box.style.display === "block" && !box.contains(event.target)) {
      box.style.display = "none";
    }
  });
});

// Baki ka Enter Key logic
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

// --- Review Count Logic ---

// 1. पेज लोड होते ही डेटाबेस से शुरूआती काउंट लाने के लिए
async function loadInitialCount() {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/reviews/top10`);
    const data = await response.json();

    // बैकएंड अब 'totalCount' भेज रहा है,
    if (data.totalCount !== undefined) {
      updateCountUI(data.totalCount);
    }
  } catch (err) {
    console.error("Count load karne mein error:", err);
  }
}

// 2. सॉकेट के ज़रिए रियल-टाइम अपडेट सुनना
socket.on("updateTotalReviewCount", (newCount) => {
  console.log("Naya review aaya! New Count:", newCount);
  updateCountUI(newCount);
});

// 3. UI को अपडेट करने वाला फंक्शन (एनीमेशन के साथ)
function updateCountUI(number) {
  const countElement = document.getElementById("countNumber");
  if (!countElement) return;

  const cleanNumber = Number(String(number).replace(/[^0-9.-]+/g, "")) || 0;

  const formattedNumber = new Intl.NumberFormat("en-IN").format(cleanNumber);

  // 🔥 yaha change
  countElement.textContent = formattedNumber;

  countElement.classList.add("count-update-flash");
  setTimeout(() => {
    countElement.classList.remove("count-update-flash");
  }, 1000);
}

// फंक्शन कॉल करें
loadInitialCount();

//Review Logic end..
