//#region
const token = localStorage.getItem("token");

async function apiRequest(url, method = "GET", body = null) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: body ? JSON.stringify(body) : null,
      cache: "no-store",
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    console.error("API Error:", err);
    return { ok: false, data: { msg: "Server error" } };
  }
}

// load seller details and course
async function loadSellerTracker() {
  const tbody = document.getElementById("sellerTrackerBody");
  const noData = document.getElementById("noData");
  if (!tbody) return;
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/admin/seller-tracker?t=${new Date().getTime()}`, {
      headers: { "x-auth-token": token },
    });
    const sellers = await res.json();
    tbody.innerHTML = "";
    if (!sellers || sellers.length === 0) {
      noData.style.display = "block";
      return;
    }
    noData.style.display = "none";
    let html = "";
    sellers.forEach((seller) => {
      const lastSeen = seller.lastLogin ? new Date(seller.lastLogin).toLocaleString("en-IN") : "Never Active";
      const statusHTML = seller.isBlocked ? `<span class="status-tag tag-blocked">Blocked 🚫</span>` : `<span class="status-tag tag-active">Active ✅</span>`;
      let courseOptions =
        seller.courseList && seller.courseList.length > 0
          ? seller.courseList
              .map((course) => {
                const courseId = course._id || course.id;
                const isHidden = course.isVisible === false || String(course.isVisible) === "false";
                return `
    <li class="course-mini-card" id="card-${courseId}" style="display: flex; align-items: center; gap: 12px; padding: 10px; border-bottom: 1px solid #1e293b;">
      <img src="${course.thumbnail}" class="c-thumb" style="width: 50px; height: 35px; border-radius: 4px; object-fit: cover;" onerror="this.src='../images/placeholder.jpg'">
      <div class="c-details" style="flex: 1;">
        <div class="c-name" style="font-weight: 700; color: #f8fafc; font-size: 13px;">${course.title}</div>
        <div style="font-size: 9px; color: #64748b;">ID: ${courseId}</div>
        <div style="font-size: 11px; color: #00ff88; margin-top: 2px;">₹${course.price} | <span style="color:#ffbb33">${course.discount}% OFF</span></div>
      </div>
      <div class="c-actions" style="display: flex; gap: 6px;">
        <button 
          onclick="toggleCourse('${courseId}')"
           data-id="${courseId}" 
          style="
            background: ${isHidden ? "#ef4444" : "#22c55e"};
            color: #fff; border: none; padding: 6px 10px; border-radius: 6px; 
            cursor: pointer; display: flex; align-items: center; gap: 6px; 
            font-size: 10px; font-weight: 700; transition: all 0.3s ease;
            box-shadow: 0 0 10px ${isHidden ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"};
          "
          title="${isHidden ? "Click to Live" : "Click to Hide"}">
          <i class="fas ${isHidden ? "fa-eye-slash" : "fa-eye"}"></i>
          <span>${isHidden ? "HIDDEN" : "LIVE"}</span>
        </button>
        <button onclick="deleteCourse('${courseId}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding: 6px 8px; border-radius: 6px; cursor: pointer;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </li>`;
              })

              .join("")
          : "<div style='padding:20px; color:gray;'>Empty Inventory.</div>";
      const hasCourses = seller.courseCount > 0;
      tbody.innerHTML += `
<tr>
  <!-- 👤 NAME + EMAIL -->
  <td>
    <div style="font-weight:bold; color:#00ff88; font-size:14px;">
      ${seller.name}
    </div>
    <div style="font-size:11px; color:#64748b;">
      ${seller.email}
    </div>
  </td>
  <!-- ⏰ LAST SEEN -->
  <td style="font-size:12px; color:#e2e8f0;">
    ${lastSeen}
  </td>
  <!-- 📦 COURSE COUNT -->
  <td>
    <span class="count-badge">
      ${seller.courseCount}
    </span>
  </td>
  <!-- 📚 COURSE DROPDOWN -->
  <td style="position:relative;">
    <button
      class="view-btn ${hasCourses ? "btn-has-courses" : ""}"
      onclick="toggleDropdown(event, '${seller._id}')"
      ${!hasCourses ? "disabled" : ""}
    >
      ${hasCourses ? "View List" : "No Course"}
      <i class="fas ${hasCourses ? "fa-chevron-down" : "fa-ban"}"></i>
    </button>
    <ul id="drop-${seller._id}" class="course-dropdown-list">
      <div class="dropdown-header">Seller's Inventory</div>
      ${courseOptions}
    </ul>
  </td>
  <!-- 📊 STATUS -->
  <td>
    ${statusHTML}
  </td>
  <!-- ⚡ ACTION BUTTONS (IMPROVED) -->
  <td>
    <div class="action-flex">
      <!-- 📧 ALERT -->
      <button
        onclick="sendSellerAlert('${seller.email}', '${seller.name}')"
        class="btn-neon btn-alert"
        title="Email Alert"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
      <!-- 🚫 BLOCK / UNBLOCK (SAFE BOOLEAN FIX) -->
   <button
    onclick="handleBlock('${seller._id}', ${seller.isBlocked ? true : false})"
    class="btn-neon ${seller.isBlocked ? "btn-unblock" : "btn-block"}"
    title="Block/Unblock Access"
>
    <i class="fas ${seller.isBlocked ? "fa-unlock" : "fa-user-slash"}"></i>
</button>
      <!-- 🗑️ DELETE -->
      <button
        onclick="handleDelete('${seller.email}')"
        class="btn-neon btn-delete"
        title="Delete Permanent"
      >
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </td>
</tr>`;
    });
  } catch (err) {
    console.error("Critical Load Error:", err);
  }
}

// SEND ALERT MAIL (Ultra Pro Alert)
window.sendSellerAlert = async (email, name) => {
  const { value: text } = await Swal.fire({
    title: `<span style="color:#00ff88">Send Alert to ${name}</span>`,
    input: "textarea",
    inputPlaceholder: "Bhai, kya message bhejna hai? (e.g. Upload more courses)",
    showCancelButton: true,
    confirmButtonColor: "#00ff88",
    cancelButtonColor: "#ff4444",
    background: "#0a0a0a",
    color: "#fff",
    inputAttributes: { "aria-label": "Type your message" },
  });
  if (text) {
    Swal.fire({
      title: "Dispatching Mail...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#0a0a0a",
      color: "#fff",
    });
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/send-seller-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ email, name, message: text }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "SENT! 🚀",
          text: "User ko Elite Mail bhej diya gaya hai.",
          icon: "success",
          background: "#0a0a0a",
          confirmButtonColor: "#00ff88",
        });
      } else {
        throw new Error(data.msg);
      }
    } catch (err) {
      Swal.fire({
        title: "MAIL FAILED! ❌",
        text: "Backend check karo bhai, mail nahi gaya.",
        icon: "error",
        background: "#0a0a0a",
      });
    }
  }
};

// DYNAMIC BLOCK/UNBLOCK (FIXED)
async function handleBlock(id, isBlocked, role = "seller") {
  const actionType = isBlocked ? "unblock_seller" : "block_seller";
  const confirm = await Swal.fire({
    title: isBlocked ? "Unblock Seller?" : "Block Seller?",
    text: `Bhai, kya is seller ko ${isBlocked ? "unblock" : "block"} karna hai?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isBlocked ? "#10b981" : "#ef4444",
    confirmButtonText: "Yes, Do it! 🚀",
    background: "#111",
    color: "#fff",
  });
  if (confirm.isConfirmed) {
    try {
      const res = await fetch(`${CONFIG.BASE_API_URL}/admin/bulk-update-users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ ids: [id], action: actionType }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        loadSellerTracker();
      } else {
        Swal.fire("Error", data.message || "Server Error", "error");
      }
    } catch (err) {
      console.error("Block Error:", err);
      Swal.fire("Error", "Connection failed!", "error");
    }
  }
}

// DELETE SELLER (Permanent Action)
window.handleDelete = async (email) => {
  const confirm = await Swal.fire({
    title: "⚠️ DANGER ZONE",
    text: "Ye user permanently delete ho jayega!",
    icon: "error",
    showCancelButton: true,
    confirmButtonText: "YES, DELETE",
    confirmButtonColor: "#ff0000",
    cancelButtonColor: "#777",
    background: "#0a0a0a",
    color: "#fff",
  });
  if (!confirm.isConfirmed) return;
  const { ok, data } = await apiRequest(`${window.API_BASE_URL}/api/admin/delete-seller/${encodeURIComponent(email)}`, "DELETE");
  if (ok && data.success) {
    await Swal.fire({
      title: "Deleted 💀",
      text: data.msg,
      icon: "success",
      background: "#0a0a0a",
      color: "#fff",
    });
    loadSellerTracker();
  } else {
    Swal.fire("Error", data.msg || "Delete failed", "error");
  }
};

// Helper: Dropdown Toggle
window.toggleDropdown = function (event, id) {
  event.stopPropagation();
  console.log("Dropdown clicked:", id);
  const el = document.getElementById(`drop-${id}`);
  if (!el) {
    console.error("Dropdown not found:", id);
    return;
  }
  document.querySelectorAll(".course-dropdown-list").forEach((list) => {
    if (list.id !== `drop-${id}`) {
      list.classList.remove("show-dropdown");
    }
  });

  el.classList.toggle("show-dropdown");
};

// Kahin bhi click karne par dropdown band karne ka logic
window.addEventListener("click", function (event) {
  if (!event.target.closest(".course-dropdown-list") && !event.target.closest(".view-btn")) {
    document.querySelectorAll(".course-dropdown-list").forEach((list) => {
      list.classList.remove("show-dropdown");
    });
    console.log("Global Click: Closing all dropdowns");
  }
});

// dropdown delet course
window.deleteCourse = async (courseId) => {
  const result = await Swal.fire({
    title: "Delete Course?",
    text: "Ye course permanently delete hoga!",
    icon: "warning",
    showCancelButton: true,
  });
  if (!result.isConfirmed) return;
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/products/${courseId}`, {
      method: "DELETE",
      headers: { "x-auth-token": token },
    });
    const data = await res.json();
    if (res.ok && data.success !== false) {
      Swal.fire("Deleted!", "Course removed", "success");
      loadSellerTracker();
    } else {
      Swal.fire("Error", data.msg || "Delete failed", "error");
    }
  } catch (err) {
    console.error(err);
  }
};
// hide/unhide course dropdown
window.toggleCourse = async (courseId) => {
  try {
    const res = await fetch(`${window.API_BASE_URL}/api/products/toggle-visibility/${courseId}`, {
      method: "PUT",
      headers: { "x-auth-token": token },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire("Error", data.msg || "Update failed", "error");
      return;
    }
    const isLive = String(data.isVisible) === "true";
    const btn = document.querySelector(`[data-id="${courseId}"]`);
    if (btn) {
      btn.style.background = isLive ? "#22c55e" : "#ef4444";
      btn.innerHTML = `
        <i class="fas ${isLive ? "fa-eye" : "fa-eye-slash"}"></i>
        <span>${isLive ? "Live" : "Hidden"}</span>
      `;
    }
    Swal.fire({
      icon: isLive ? "success" : "warning",
      title: isLive ? "Visibility: LIVE 🔥" : "Visibility: HIDDEN 🚫",
      html: `
        <div style="font-size: 14px; color: #94a3b8; margin-top: 10px;">
          ${isLive ? "The course is now <b>Public</b>. All students can see and purchase it from the store." : "The course is now <b>Private</b>. It has been hidden from the student storefront."}
        </div>
      `,
      background: "#111827",
      color: "#f8fafc",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      showClass: {
        popup: "animate__animated animate__zoomIn",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutDown",
      },
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Action Failed",
      text: "Unable to sync with the server. Please try again.",
      background: "#111827",
      color: "#f8fafc",
      confirmButtonColor: "#ef4444",
    });
  }
};

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  e.preventDefault();
  const courseId = btn.dataset.id;
  if (!courseId) return;
  await toggleCourse(courseId);
});

// serch bar
function searchSeller() {
  const input = document.getElementById("searchInput");
  const filter = input.value.toLowerCase();
  const tbody = document.getElementById("sellerTrackerBody");
  const rows = tbody.getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    const firstCell = rows[i].getElementsByTagName("td")[0];
    if (firstCell) {
      const textValue = firstCell.textContent || firstCell.innerText;
      if (textValue.toLowerCase().indexOf(filter) > -1) {
        rows[i].style.display = "";
      } else {
        rows[i].style.display = "none";
      }
    }
  }
}

// clear serch
function clearSearch() {
  const input = document.getElementById("searchInput");
  const tbody = document.getElementById("sellerTrackerBody");
  const rows = tbody.getElementsByTagName("tr");
  input.value = "";
  for (let i = 0; i < rows.length; i++) {
    rows[i].style.display = "";
  }
  input.focus();
}

document.addEventListener("DOMContentLoaded", loadSellerTracker);
//#endregion
