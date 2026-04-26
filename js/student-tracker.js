//=============== Student Tracker (active Student pannel)=============
// 👨‍🎓 Student Tracker - Master Logic (Professional Layout)
async function loadStudentTracker() {
  const tbody = document.getElementById("studentTrackerBody");
  const noData = document.getElementById("noData");
  if (!tbody) return;

  try {
    const res = await fetch(
      `${CONFIG.BASE_API_URL}/admin/student-tracker-data`,
      {
        headers: { "x-auth-token": localStorage.getItem("token") },
      },
    );
    const result = await res.json();
    const students = result.students || [];

    tbody.innerHTML = "";
    if (students.length === 0) {
      if (noData) noData.style.display = "block";
      return;
    }
    if (noData) noData.style.display = "none";

    students.forEach((s) => {
      const isVip = s.role === "vip";
      const isBlocked = s.isBlocked === true;
      const boughtCount = s.purchasedCourses ? s.purchasedCourses.length : 0;

      // 📚 Inventory Dropdown Logic (With Design Fix)
      let courseOptions =
        boughtCount > 0
          ? s.purchasedCourses
              .map((c) => {
                const courseId = c._id || c.id;
                const isHidden = s.hiddenCourses?.some(
                  (h) => h.courseId.toString() === courseId.toString(),
                );

                return `
            <li class="course-mini-card" style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #1e293b;">
              <img src="${c.thumbnail || "../images/placeholder.jpg"}" style="width:50px; height:35px; border-radius:6px; object-fit:cover;">
              <div style="flex:1;">
                <div style="font-weight:700; color:#f8fafc; font-size:13px;">${c.title || "Untitled"}</div>
                <div style="font-size:9px; color:#64748b;">ID: ${courseId}</div>
              </div>
              <div style="display:flex; gap:6px;">
                <!-- 👁️ Smart Toggle Hide/Show -->
                <button onclick="toggleStudentCourseHide('${s._id}', '${courseId}')" 
                  style="background:${isHidden ? "#ef4444" : "#22c55e"}; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:10px; font-weight:700; box-shadow: 0 0 10px ${isHidden ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"};">
                  <i class="fas ${isHidden ? "fa-eye-slash" : "fa-eye"}"></i>
                  <span>${isHidden ? "HIDDEN" : "LIVE"}</span>
                </button>
                <button onclick="deleteStudentCourse('${s._id}', '${courseId}')" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid #ef4444; padding:6px 8px; border-radius:6px; cursor:pointer;">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </li>`;
              })
              .join("")
          : "<div style='padding:20px; color:gray; text-align:center;'>Empty Inventory.</div>";

      tbody.innerHTML += `
        <tr>
          <!-- 👤 Student Detail -->
          <td>
            <div style="font-weight:bold; color:#00ff88; font-size:14px;">${s.name} ${isVip ? "👑" : ""}</div>
            <div style="font-size:11px; color:#64748b;">${s.email}</div>
          </td>

          <!-- ⏰ Last Active -->
          <td style="font-size:12px; color:#e2e8f0;">${s.lastLogin ? new Date(s.lastLogin).toLocaleString() : "Never Active"}</td>

          <!-- 🔢 Count -->
          <td><span class="count-badge">${boughtCount}</span></td>

          <!-- 📚 View Inventory -->
          <td style="position:relative;">
            <button class="view-btn ${boughtCount > 0 ? "btn-has-courses" : ""}" onclick="toggleDropdown(event, '${s._id}')" ${boughtCount === 0 ? "disabled" : ""}>
                ${boughtCount > 0 ? "View Inventory" : "No Course"} <i class="fas fa-chevron-down"></i>
            </button>
            <ul id="drop-${s._id}" class="course-dropdown-list" style="display:none; position:absolute; background:#0f172a; width:300px; z-index:100; right:0; border:1px solid #1e293b; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.8); list-style:none; padding:0;">
                <div style="padding:10px; color:#00ff88; font-weight:bold; font-size:11px; border-bottom:1px solid #1e293b;">STUDENT'S LIBRARY</div>
                ${courseOptions}
            </ul>
          </td>

          <!-- 📊 Account Status -->
          <td>
            <span class="status-tag ${isBlocked ? "tag-blocked" : "tag-active"}">${isBlocked ? "Blocked 🚫" : "Active ✅"}</span>
          </td>

          <!-- ⚡ Quick Actions (Professional Flex) -->
          <td>
            <div class="action-flex">
              <button onclick="openStudentAlert('${s._id}', '${s.email}', '${s.name}')" class="btn-neon btn-alert" title="Elite Alert"><i class="fas fa-paper-plane"></i></button>
             <button 
    onclick="handleBlock('${s._id}', ${s.isBlocked ? true : false}, '${s.role}')" 
    class="btn-neon ${s.isBlocked ? "btn-unblock" : "btn-block"}" 
    title="Block/Unblock Access">
    <i class="fas ${s.isBlocked ? "fa-unlock" : "fa-user-slash"}"></i>
</button>
              <button onclick="handleDelete('${s._id}')" class="btn-neon btn-delete" title="Delete Permanent"><i class="fas fa-trash-alt"></i></button>
              
              <!-- 👑 Role Switcher -->
              <button onclick="toggleVipStatus('${s._id}', '${s.role}')" class="btn-neon" style="background:#a020f0; color:#fff;" title="Make VIP/Student">
                <i class="fas ${isVip ? "fa-user-minus" : "fa-crown"}"></i>
              </button>
            </div>
          </td>
        </tr>`;
    });
  } catch (err) {
    console.error(err);
  }
}

// --- Logic Functions (Ye zaroor add karein) ---

// 📢 1. Send Student Alert (Mail Popup)
async function openStudentAlert(studentId, studentEmail, studentName) {
  const { value: formValues } = await Swal.fire({
    title: "Send Elite Alert 📧",
    background: "#0d1a1b",
    color: "#fff",
    html: `
            <div style="text-align:left; margin-bottom:10px; font-size:12px; color:#00ff88;">To: ${studentName}</div>
            <select id="swal-reason" class="swal2-input" style="background:#1a1a1a; color:#fff; font-size:14px; width:90%;">
                <option value="Policy Warning">🚨 Policy Warning</option>
                <option value="Course Removed">🗑️ Course Removed Notification</option>
                <option value="Account Blocked">🚫 Account Blocked Notice</option>
                <option value="VIP Access">🎁 VIP Access Granted</option>
            </select>
            <textarea id="swal-note" class="swal2-textarea" style="background:#1a1a1a; color:#fff; width:90%; height:100px;" placeholder="Bhai, kya message bhejna hai?"></textarea>
        `,
    showCancelButton: true,
    confirmButtonText: "Send Alert Now",
    confirmButtonColor: "#00ff88",
    preConfirm: () => {
      return {
        reason: document.getElementById("swal-reason").value,
        message: document.getElementById("swal-note").value,
      };
    },
  });

  if (formValues) {
    Swal.fire({
      title: "Sending...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/send-student-alert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({
            userId: studentId,
            studentEmail,
            studentName,
            reason: formValues.reason,
            message: formValues.message,
          }),
        },
      );
      if (res.ok) Swal.fire("Sent!", "Alert sent to student.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }
}

// 🚫 Smart Block/Unblock (Handles both Student & VIP)
// 🚫 Universal Block/Unblock (For Student & Seller Tracker)
async function handleBlock(id, isBlocked, role) {
  // 1. Backend switch case ke hisaab se sahi action name banaiye
  // Example: block_student, unblock_seller, block_vip
  let actionType = isBlocked ? "unblock_" : "block_";

  if (role === "vip") actionType += "vip";
  else if (role === "seller") actionType += "seller";
  else actionType += "student"; // Default for students

  console.log("📡 Triggering Action:", actionType, "for User ID:", id);

  const confirm = await Swal.fire({
    title: isBlocked ? "Unblock User?" : "Block User?",
    text: `Bhai, kya is ${role} ko ${isBlocked ? "wapas access dena" : "block karna"} hai?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isBlocked ? "#10b981" : "#ef4444",
    confirmButtonText: isBlocked ? "Yes, Unblock! 🔓" : "Yes, Block! 🚫",
    background: "#111",
    color: "#fff",
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/bulk-update-users`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({ ids: [id], action: actionType }), // 👈 IDs Array mein jayegi
        },
      );

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        // Current page ko reload karne ke liye function call
        if (typeof loadStudentTracker === "function") loadStudentTracker();
        if (typeof loadSellerTracker === "function") loadSellerTracker();
      } else {
        Swal.fire("Error", data.message || "Action failed", "error");
      }
    } catch (err) {
      console.error("Block API Error:", err);
    }
  }
}

// 👑 3. Toggle VIP Status (Fixed ReferenceError)
async function toggleVipStatus(id, currentRole) {
  const action = currentRole === "vip" ? "remove_vip" : "make_vip";

  const confirm = await Swal.fire({
    title: "Change Role?",
    text: `Do you want to ${currentRole === "vip" ? "Remove VIP" : "Make VIP"}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#a020f0",
  });

  if (confirm.isConfirmed) {
    try {
      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/bulk-update-users`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({ ids: [id], action: action }),
        },
      );
      if (res.ok) {
        Swal.fire("Updated!", "User role has been changed.", "success");
        loadStudentTracker();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

async function toggleStudentCourseHide(userId, courseId) {
  const res = await fetch(`${CONFIG.BASE_API_URL}/admin/toggle-hide-course`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-auth-token": localStorage.getItem("token"),
    },
    body: JSON.stringify({ userId, courseId }),
  });
  if (res.ok) loadStudentTracker();
}

async function deleteStudentCourse(userId, courseId) {
  const confirm = await Swal.fire({
    title: "Remove Course?",
    text: "Student ki library se ye course hamesha ke liye hat jayega!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
  });
  if (confirm.isConfirmed) {
    const res = await fetch(
      `${CONFIG.BASE_API_URL}/admin/delete-student-course`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ userId, courseId }),
      },
    );
    if (res.ok) {
      Swal.fire("Removed!", "", "success");
      loadStudentTracker();
    }
  }
}

async function handleDelete(id) {
  const confirm = await Swal.fire({
    title: "Delete Account?",
    text: "Bhai, ye hamesha ke liye delete ho jayega!",
    icon: "error",
    showCancelButton: true,
  });
  if (confirm.isConfirmed) {
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/bulk-update-users`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": localStorage.getItem("token"),
      },
      body: JSON.stringify({ ids: [id], action: "delete_all" }),
    });
    if (res.ok) loadStudentTracker();
  }
}

// Dropdown Helper
function toggleDropdown(event, id) {
  event.stopPropagation();
  const dropdown = document.getElementById(`drop-${id}`);
  document.querySelectorAll(".course-dropdown-list").forEach((d) => {
    if (d.id !== `drop-${id}`) d.style.display = "none";
  });
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

// serch logic
// ━━━━━ 🔍 SELLER SEARCH & TRACKER LOGIC ━━━━━

function searchSeller() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const tableBody = document.getElementById("studentTrackerBody");
  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const sellerName =
      rows[i].getElementsByTagName("td")[1]?.innerText.toLowerCase() || "";
    const sellerEmail =
      rows[i].getElementsByTagName("td")[2]?.innerText.toLowerCase() || "";

    if (sellerName.includes(input) || sellerEmail.includes(input)) {
      rows[i].style.display = "";
    } else {
      rows[i].style.display = "none";
    }
  }
}

// Clear Search Function
function clearSearch() {
  const input = document.getElementById("searchInput");
  input.value = "";
  searchSeller();
  input.focus();
}

// 🏁 --- END OF SEARCH MODULE ---

document.addEventListener("click", () => {
  document
    .querySelectorAll(".course-dropdown-list")
    .forEach((d) => (d.style.display = "none"));
});
document.addEventListener("DOMContentLoaded", loadStudentTracker);
