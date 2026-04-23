// 🔥 MUKESH KING - ADMIN ONLY ACCESS (Elite Security)
(function protectAdminDashboard() {
  const role = localStorage.getItem("userRole");

  // ⛔ STRICT CHECK: Only 'admin' is allowed.
  // Sellers, Students, and VIPs are strictly blocked.
  if (role !== "admin") {
    // 1. Instant Page Blackout (Taaki data leak na ho)
    document.documentElement.style.display = "none";

    // 2. Redirect to Home (Immediate Action)
    console.warn("🚨 UNAUTHORIZED ACCESS ATTEMPT BLOCKED!");
    window.location.replace("../index.html");
  }
})();

// अपनी API का Base URL (config.js)
const API_URL = `${CONFIG.BASE_API_URL}/admin`;

let allData = {};

// 1. पेज लोड होते ही डेटा लाओ
async function fetchDashboardData() {
  try {
    // 🔥 SAFETY CHECK: Agar ye element nahi hai, matlab hum dashboard page par nahi hain
    const totalUsersEl = document.getElementById("totalUsers");
    if (!totalUsersEl) {
      console.log("⏭️ Dashboard elements missing, skipping old stats fetch.");
      return;
    }

    const res = await fetch(`${API_URL}/all-data`);
    const result = await res.json();

    if (result.success) {
      allData = result;
      // Ab ye error nahi dega kyunki humne upar check kar liya hai
      totalUsersEl.innerText = result.totalStudents;
      document.getElementById("totalSellers").innerText = result.totalSellers;

      // Table check (Safety)
      const tableBody = document.getElementById("tableBody");
      if (tableBody) {
        renderUserTable([...result.students, ...result.sellers]);
      }
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    const tableBody = document.getElementById("tableBody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">CORS ya Server ka panga hai!</td></tr>`;
    }
  }
}

// 2. टेबल में डेटा भरने का फंक्शन
function renderUserTable(users, isApprovalPage = false) {
  // 1. 🔥 SMART HIDE LOGIC: Seller Document ko chhupao aur baaki sab dikhao
  const sellerSection = document.getElementById("sellerDocsDiv");
  if (sellerSection) sellerSection.style.display = "none";

  // In sabko wapas dikhao (User Management Panel ke parts)
  const elementsToShow = [
    ".table-container",
    ".stats-container",
    ".filter-section",
  ];
  elementsToShow.forEach((selector) => {
    const el = document.querySelector(selector);
    if (el)
      el.style.display = selector === ".table-container" ? "block" : "flex";
  });

  // "User Management Panel" ka header (H1) dikhane ke liye
  const userHeader =
    document.querySelector(".user-management-header") ||
    document.querySelector("h1")?.parentElement;
  if (userHeader) userHeader.style.display = "block";

  // 2. --- Tumhara Purana Rendering Logic ---
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  if (users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found. 📂</td></tr>`;
    return;
  }

  users.forEach((user) => {
    tableBody.innerHTML += `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.role}">${user.role.toUpperCase()}</span></td>
                <td>
                    ${
                      isApprovalPage
                        ? `<button onclick="approveSeller('${user._id}')" style="background:green; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Approve ✅</button>`
                        : `<button onclick="toggleBlock('${user._id}')" class="btn-block">${user.isBlocked ? "Unblock" : "Block"}</button>
                           <button onclick="deleteUser('${user._id}')" class="btn-delete" style="color:red; margin-left:10px;">Delete</button>`
                    }
                </td>
                <td>${user.role === "student" ? "🎓 Course" : "Verified"}</td>
            </tr>
        `;
  });
}

// 3. Student या Seller कंट्रोल बटन के लिए
function loadUsers(role) {
  const data = role === "student" ? allData.students : allData.sellers;
  renderUserTable(data);
}

// load approvel pending seller
async function loadSellerRequests() {
  console.log("🚀 Fetching Pending Seller Requests...");

  // Apne table body ki ID check karein (Main yahan 'sellerRequestTableBody' use kar raha hoon)
  const tableBody = document.getElementById("tableBody");

  if (!tableBody) return console.error("Table body ID not found!");

  // Loading state
  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Checking for new requests... ⏳</td></tr>`;

  try {
    const res = await fetch(
      `${window.API_BASE_URL}/api/admin/seller-requests`,
      {
        method: "GET",
        headers: {
          "x-auth-token": localStorage.getItem("token"), // Agar aap token use kar rahe ho
        },
      },
    );

    const data = await res.json();
    console.log("📥 Raw Data from API:", data);

    if (data.success && data.sellers.length > 0) {
      tableBody.innerHTML = ""; // Clear loader

      data.sellers.forEach((seller) => {
        tableBody.innerHTML += `
          <tr>
              <!-- 1. 🔲 Checkbox Column (Name ke aage) -->
      <td style="width: 40px; text-align: center;">
        <input type="checkbox" class="seller-checkbox" value="${seller._id}" style="cursor:pointer; width:17px; height:17px;">
      </td>
            <td><b>${seller.name}</b></td>
            <td>${seller.email}</td>
            <td><span class="badge" style="background:#fbbf24; color:#000;">PENDING</span></td>
            <td>
              <button class="btn-approve" onclick="approveSeller('${seller._id}')" style="background:#10b981; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Approve ✅</button>
              <button class="btn-reject" onclick="rejectSeller('${seller._id}', '${seller.email}')" style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">Reject ❌</button>
            </td>
            <td>
               <button onclick="viewDocs('${seller._id}')" style="background:#3b82f6; border:none; color:#fff; padding:5px 10px; border-radius:4px;">View Docs 📄</button>
            </td>
          </tr>
        `;
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#9ca3af;">No pending seller requests found! ✨</td></tr>`;
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Server connection failed! ❌</td></tr>`;
  }
}

// view seler doc
window.viewDocs = async function (id) {
  try {
    Swal.fire({
      title: "Fetching Documents...",
      didOpen: () => Swal.showLoading(),
      background: "#111827",
      color: "#fff",
    });

    const res = await fetch(
      `${window.API_BASE_URL}/api/admin/seller-details/${id}`,
    );
    const data = await res.json();
    const seller = data.seller;

    if (res.ok) {
      Swal.fire({
        title: `<span style="color:#3b82f6; font-size:24px; font-weight:bold;">Seller Verification Hub</span>`,
        html: `
                    <div style="text-align: left; font-size: 14px; color: #eee; max-height: 500px; overflow-y: auto; padding: 10px; scrollbar-width: thin;">
                        
                        <!-- 📋 KYC SECTION -->
                        <h4 style="color:#00ffcc; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:15px;">📋 KYC Documents (Aadhar & PAN)</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                            <div style="flex: 1; min-width: 140px;">
                                <p style="margin-bottom:5px;"><b>Front Side:</b></p>
                                <img src="${seller.kycDetails?.aadharFront}" style="width:100%; border-radius:8px; cursor:zoom-in; border:1px solid #444;" onclick="window.open('${seller.kycDetails?.aadharFront}', '_blank')">
                            </div>
                            <div style="flex: 1; min-width: 140px;">
                                <p style="margin-bottom:5px;"><b>Back Side:</b></p>
                                <img src="${seller.kycDetails?.aadharBack}" style="width:100%; border-radius:8px; cursor:zoom-in; border:1px solid #444;" onclick="window.open('${seller.kycDetails?.aadharBack}', '_blank')">
                            </div>
                        </div>
                        <p><b>Aadhar Number:</b> <span style="color:#fbbf24;">${seller.kycDetails?.aadharNo || "N/A"}</span></p>
                        <p><b>PAN Number:</b> <span style="color:#fbbf24;">${seller.kycDetails?.panNo || "Not Provided"}</span></p>

                        <!-- 🏦 BANK SECTION -->
                        <h4 style="color:#00ffcc; border-bottom:1px solid #333; padding-bottom:5px; margin-top:25px; margin-bottom:15px;">🏦 Bank Account Details</h4>
                        <div style="margin-bottom: 15px;">
                            <p style="margin-bottom:5px;"><b>Passbook / Cheque:</b></p>
                            <img src="${seller.bankDetails?.bankDoc}" style="max-width:200px; border-radius:8px; cursor:zoom-in; border:1px solid #444;" onclick="window.open('${seller.bankDetails?.bankDoc}', '_blank')">
                        </div>
                        <p><b>Bank Name:</b> ${seller.bankDetails?.bankName || "N/A"}</p>
                        <p><b>Account No:</b> ${seller.bankDetails?.accountNo || "N/A"}</p>
                        <p><b>IFSC Code:</b> ${seller.bankDetails?.ifscCode || "N/A"}</p>
                    </div>
                `,
        background: "#111827",
        width: "600px",
        confirmButtonText: "Close Verification",
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: "animated fadeInDown",
        },
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: "Seller data not found!",
        background: "#111827",
        color: "#fff",
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Connection Error",
      text: "Could not connect to Atlas!",
      background: "#111827",
      color: "#fff",
    });
  }
};

// reject seller
window.rejectSeller = async function (id, email) {
  const { value: formValues } = await Swal.fire({
    title: '<span style="color:#ef4444;">Reject Seller Application</span>',
    background: "#111827",
    color: "#fff",
    html: `
            <div style="text-align: left; font-size: 14px; padding: 15px; background: #1f2937; border-radius: 12px; border: 1px solid #374151;">
                <p style="margin-bottom: 12px; font-weight: bold; color: #9ca3af;">Quick Select Reasons:</p>
                
                <div style="display: grid; gap: 10px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" class="swal-reject-reason" value="Aadhar Front Image is not clear/visible."> Aadhar Front Not Clear
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" class="swal-reject-reason" value="Aadhar Back Image is missing or blurred."> Aadhar Back Missing
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" class="swal-reject-reason" value="PAN Card details do not match your profile name."> PAN Name Mismatch
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" class="swal-reject-reason" value="Bank Document (Passbook/Cheque) is not readable."> Bank Doc Not Clear
                    </label>
                </div>

                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #374151;">
                
                <p style="margin-bottom: 8px; font-weight: bold; color: #9ca3af;">Additional Manual Reason:</p>
                <textarea id="swal-extra-comment" class="swal2-textarea" 
                    style="margin: 0; width: 100%; height: 80px; font-size: 13px; background: #111827; color: #fff; border: 1px solid #374151; border-radius: 8px; padding: 10px;" 
                    placeholder="Type any other specific reason here..."></textarea>
            </div>
        `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#4b5563",
    confirmButtonText: "Send Rejection Mail 📧",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      // 1. Checkboxes se data uthao
      const checkedReasons = Array.from(
        document.querySelectorAll(".swal-reject-reason:checked"),
      ).map((cb) => cb.value);

      // 2. Textarea se data uthao
      const manualReason = document
        .getElementById("swal-extra-comment")
        .value.trim();

      // Validation: Dono khali nahi hone chahiye
      if (checkedReasons.length === 0 && !manualReason) {
        Swal.showValidationMessage(
          "Please select at least one reason or type manually!",
        );
        return false;
      }

      // Dono ko join karke final message banao
      let finalOutput = checkedReasons.join(", ");
      if (manualReason) {
        finalOutput +=
          checkedReasons.length > 0
            ? ` | Additional Note: ${manualReason}`
            : manualReason;
      }

      return finalOutput;
    },
  });

  // Agar confirm kiya toh API call chalao
  if (formValues) {
    try {
      Swal.fire({
        title: "Processing...",
        text: "Updating database and sending email...",
        background: "#111827",
        color: "#fff",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(
        `${window.API_BASE_URL}/api/admin/reject-seller/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            reason: formValues, // Isme tick + manual dono text jud kar ja rahe hain
          }),
        },
      );

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Seller Rejected!",
          text: "Email with detailed reasons has been sent.",
          background: "#111827",
          color: "#fff",
          timer: 2000,
          showConfirmButton: false,
        });
        loadSellerRequests(); // Table refresh
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Server connection failed!",
        background: "#111827",
        color: "#fff",
      });
    }
  }
};

// 4. Seller Requests बटन के लिए
function loadApprovals() {
  renderUserTable(allData.requests, true);
}

// 5. Search Functionality
function searchTable() {
  const input = document.querySelector(".search-bar").value.toLowerCase();
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(input) ? "" : "none";
  });
}

// 6. Action Functions (Block/Delete/Approve)
async function approveSeller(id) {
  console.log(`[ADMIN] Approving Seller ID: ${id}`);

  // 1. Confirmation Dialog
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Once approved, this seller will be able to sell courses on the platform.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Approve!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // Show loading spinner while processing
      Swal.fire({
        title: "Processing...",
        text: "Please wait while we update the status.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`${API_URL}/approve-seller/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        console.log("✅ Seller Approved Successfully");

        // 2. Success Alert
        Swal.fire({
          title: "Approved! 🥂",
          text: "The seller has been approved successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh data without page reload
        fetchDashboardData();
      } else {
        console.error("❌ Approval failed:", data.message);

        // 3. Error Alert (from server)
        Swal.fire({
          title: "Approval Failed",
          text: data.message || "Something went wrong.",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("❌ Connection error:", err);

      // 4. Connection Error Alert
      Swal.fire({
        title: "Server Error",
        text: "Unable to connect to the server. Please try again later.",
        icon: "error",
      });
    }
  }
}

async function deleteUser(id) {
  console.log(`[ADMIN] Requesting Delete for User ID: ${id}`);

  // 1. Critical Confirmation Dialog (Red Theme)
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action is permanent! The user data cannot be recovered.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33", // Red color for danger
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Delete User!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // Show loading while deleting
      Swal.fire({
        title: "Deleting...",
        text: "Removing user from the database.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`${API_URL}/delete-user/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log("✅ User Deleted Successfully");

        // 2. Success Alert
        Swal.fire({
          title: "Deleted! 🗑️",
          text: "The user has been removed successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh data
        fetchDashboardData();
      } else {
        const errorData = await res.json();
        console.error("❌ Delete failed:", errorData.message);

        // 3. Error Alert
        Swal.fire({
          title: "Delete Failed",
          text: errorData.message || "Could not delete user.",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("❌ Connection Error:", err);

      // 4. Server Connection Error
      Swal.fire({
        title: "Server Error",
        text: "Unable to connect to the server.",
        icon: "error",
      });
    }
  }
}

// शुरू करने के लिए कॉल करें
fetchDashboardData();

// VIP बटन दबाने पर चलने वाला फंक्शन
async function toggleVIP(id) {
  // Console logging for tracking
  console.log(
    "%c[FETCH] Sending VIP toggle request...",
    "color: blue; font-weight: bold;",
  );

  // 1. Confirmation Dialog
  const result = await Swal.fire({
    title: "Update VIP Status?",
    text: "Do you want to change the VIP access for this user?",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#ffc107", // Gold color for VIP
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Change it!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // Show loading
      Swal.fire({
        title: "Updating VIP...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(`${API_URL}/toggle-vip/${id}`, {
        method: "PUT",
      });
      const data = await response.json();

      if (data.success) {
        console.log(
          "%c[SUCCESS] User VIP Status updated!",
          "color: green; font-weight: bold;",
        );

        // 2. Success Toast (Automatic close)
        Swal.fire({
          title: "Updated!",
          text: "User VIP status has been changed.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // Refresh data
        fetchDashboardData();
      } else {
        console.warn("[WARN] Server responded with failure:", data.message);
        Swal.fire(
          "Failed",
          data.message || "Could not update VIP status.",
          "error",
        );
      }
    } catch (error) {
      console.error(
        "%c[ERROR] Failed to connect to server:",
        "color: red; font-weight: bold;",
        error,
      );
      Swal.fire("Server Error", "Check if your backend is running!", "error");
    }
  }
}

// टेबल रेंडर करने का हिस्सा (जहाँ बटन बनता है)
function renderUserTable(users = []) {
  // 🔥 SMART RESET: Seller Document table ko chhupane ke liye
  const sellerDiv = document.getElementById("sellerDocsDiv");
  if (sellerDiv) sellerDiv.style.display = "none";

  // Dashboard ke normal containers (Stats, Filters, etc.) ko wapas dikhao
  const containers = [
    ".table-container",
    ".stats-container",
    ".filter-section",
  ];
  containers.forEach((c) => {
    const el = document.querySelector(c);
    if (el) el.style.display = c === ".table-container" ? "block" : "flex";
  });

  // "User Management Panel" header dikhane ke liye
  const uHeader =
    document.querySelector(".user-management-header") ||
    document.querySelector("h1")?.parentElement;
  if (uHeader) uHeader.style.display = "block";

  // --- Tumhara Purana Code Yahan Se Shuru ---
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  users.forEach((user) => {
    // बदलाव 1: VIP चेक करने के लिए Role और isVip दोनों देखो
    const isVipUser = user.role === "vip" || user.isVip === true;
    const isSeller = user.role === "seller";
    const isApproved = user.isApproved === true;

    tableBody.innerHTML += `
            <tr>
              <!-- 1. 🔲 Checkbox Column -->
                <td>
                    <input type="checkbox" class="seller-checkbox" value="${user._id}" style="cursor:pointer; width:17px; height:17px;">
                </td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${isVipUser ? "vip-badge" : "normal-badge"}">
                        ${isVipUser ? "VIP 👑" : user.role.toUpperCase()}
                    </span>
                </td>
                <td>
                    <!-- VIP Toggle -->
                    ${
                      !isSeller
                        ? `
                        <button onclick="toggleVIP('${user._id}')" class="btn-vip" style="background: ${isVipUser ? "#673ab7" : "#9c27b0"}">
                            ${isVipUser ? "Remove VIP" : "Make VIP"}
                        </button>
                    `
                        : `
                        <!-- Seller Approval Toggle -->
                        <button onclick="toggleSellerApproval('${user._id}')" class="btn-vip" style="background: ${isApproved ? "#2ecc71" : "#f39c12"}">
                            ${isApproved ? "Unapprove" : "Approve"}
                        </button>
                    `
                    }
                    
                    <button onclick="toggleBlock('${user._id}')" class="btn-block" style="background: ${user.isBlocked ? "red" : ""}">
                        ${user.isBlocked ? "Unblock" : "Block"}
                    </button>
                    
                    <button onclick="deleteUser('${user._id}')" class="btn-del">DEL</button>
                </td>
                
                <td style="text-align: center;">
                    ${
                      isSeller
                        ? isApproved
                          ? '<b style="color: #2ecc71;">✅ Approved</b>'
                          : '<b style="color: #e74c3c;">⏳ Pending</b>'
                        : user.isCertified
                          ? `<a href="${user.certificateData?.pdfUrl || "#"}" target="_blank">
                                 <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" width="22">
                                 <div style="font-size: 9px; color: #2ecc71; font-weight: bold;">VIEW PDF</div>
                               </a>`
                          : '<span style="color: #777; font-size: 11px; font-weight: bold;">NOT CERTIFIED</span>'
                    }
                </td>
            </tr>
        `;
  });
}

// apply bulk seller,student,vip action
// 1. Master Checkbox Logic (Select All)
document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "selectAllSellers") {
    const isChecked = e.target.checked;
    document
      .querySelectorAll(".seller-checkbox")
      .forEach((cb) => (cb.checked = isChecked));
  }
});

// 2. Apply Bulk Action Logic
document
  .getElementById("applyBulkSellerAction")
  ?.addEventListener("click", async function () {
    const action = document.getElementById("bulkSellerAction").value;
    const actionText =
      document.getElementById("bulkSellerAction").options[
        document.getElementById("bulkSellerAction").selectedIndex
      ].text;

    if (!action) {
      return Swal.fire({
        icon: "warning",
        title: "Action Required",
        text: "Please select an action from the dropdown!",
        confirmButtonColor: "#00ff88",
      });
    }

    const selectedBoxes = document.querySelectorAll(".seller-checkbox:checked");
    const selectedIds = Array.from(selectedBoxes).map((cb) => cb.value);

    if (selectedIds.length === 0) {
      return Swal.fire({
        icon: "info",
        title: "No Selection",
        text: "Select at least one user to proceed.",
        confirmButtonColor: "#00ff88",
      });
    }

    // Confirmation Alert
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `You want to apply "${actionText}" to ${selectedIds.length} selected users?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00ff88",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Apply Now!",
      background: "#111",
    });

    if (confirm.isConfirmed) {
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        // 🔥 BACKEND CALL
        const response = await fetch(
          `${CONFIG.BASE_API_URL}/admin/bulk-update-users`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": localStorage.getItem("token"),
            },
            body: JSON.stringify({ ids: selectedIds, action: action }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: data.message,
            timer: 2000,
          });
          location.reload();
        } else {
          throw new Error(data.message || "Failed to update users.");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Action Failed",
          text: error.message,
        });
      }
    }
  });

// Seller Toggle Function (Isko bhi admin.js me niche copy kar lena)
async function toggleSellerApproval(id) {
  console.log(
    "%c[FETCH] Toggling Seller Status...",
    "color: cyan; font-weight: bold;",
  );

  // 1. Confirmation Dialog
  const result = await Swal.fire({
    title: "Toggle Approval?",
    text: "Are you sure you want to change this seller's approval status?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#17a2b8", // Cyan theme
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Change Status",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // Show loading spinner
      Swal.fire({
        title: "Updating Status...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`${API_URL}/toggle-seller-approval/${id}`, {
        method: "PUT",
      });
      const data = await res.json();

      if (data.success) {
        console.log(`%c[SUCCESS] ${data.message}`, "color: green;");

        // 2. Success Toast (Fast and clean)
        Swal.fire({
          title: "Updated!",
          text: data.message || "Seller status updated.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        // Refresh dashboard data
        fetchDashboardData();
      } else {
        Swal.fire(
          "Failed",
          data.message || "Could not update status.",
          "error",
        );
      }
    } catch (err) {
      console.error("❌ Toggle Error:", err);
      Swal.fire(
        "Server Error",
        "Connection failed. Please check your API.",
        "error",
      );
    }
  }
}

// 1. सिर्फ VIP दिखाने के लिए नया फंक्शन
async function loadVIPs() {
  console.log(
    "%c[VIEW] Loading VIP Members List...",
    "color: #ffca28; font-weight: bold;",
  );

  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/all-vips`);
    const result = await res.json();

    if (!result.success) {
      throw new Error("VIP fetch failed");
    }

    const vips = result.vips || [];

    window.allData = window.allData || {};
    window.allData.vips = vips;

    if (vips.length > 0) {
      renderUserTable(vips);
    } else {
      document.getElementById("tableBody").innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 20px; color: #888;">
            🚫 कोई VIP यूजर नहीं मिला!
          </td>
        </tr>`;
    }
  } catch (err) {
    console.error("[ERROR] VIP load failed:", err);
  }
}

// delete student/seller logic
async function deleteUser(id) {
  // Console log for tracking
  console.log(
    `%c[ACTION] Delete request initiated for ID: ${id}`,
    "color: orange; font-weight: bold;",
  );

  // 1. SweetAlert Confirmation (Danger Red Theme)
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action is permanent! The user will be removed forever.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33", // Danger Red
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Delete!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // Show loading spinner
      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`${API_URL}/delete-user/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        console.log(
          "%c[DELETED] User removed from database successfully",
          "color: #ff4d4d; font-weight: bold;",
        );

        // 2. Success Alert
        Swal.fire({
          title: "Deleted! 🗑️",
          text: "The user has been deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh table data
        fetchDashboardData();
      } else {
        console.warn("[WARN] Delete failed:", data.message);
        Swal.fire("Failed", data.message || "Could not delete user.", "error");
      }
    } catch (err) {
      console.error(
        "%c[ERROR] Server connection failed during delete",
        "color: red;",
        err,
      );
      Swal.fire("Server Error", "Could not connect to the server!", "error");
    }
  } else {
    console.log(
      "%c[CANCELLED] Delete operation aborted by admin",
      "color: gray;",
    );
  }
}

// Lifetime sales ko fetch karke UI par dikhane wala function
// 📊 Dashboard Stats Load
async function updateFinancials() {
  const start = document.getElementById("startDate")?.value;
  const end = document.getElementById("endDate")?.value;

  let url = `${CONFIG.BASE_API_URL}/admin/financial-stats`;

  if (start && end) {
    url += `?startDate=${start}&endDate=${end}`;
  }

  try {
    const res = await fetch(url);
    const result = await res.json();

    if (result.success && result.data) {
      const stats = Array.isArray(result.data) ? result.data[0] : result.data;

      const salesEl = document.getElementById("statSales");
      const payoutEl = document.getElementById("statPayout");
      const feeEl = document.getElementById("statFee");

      if (salesEl)
        salesEl.innerText = `₹${(stats.totalSales || 0).toLocaleString("en-IN")}`;

      if (payoutEl)
        payoutEl.innerText = `₹${(stats.totalPayout || 0).toLocaleString("en-IN")}`;

      if (feeEl)
        feeEl.innerText = `₹${(stats.feeCollected || 0).toLocaleString("en-IN")}`;
    }
  } catch (err) {
    console.error("Financial Fetch Error:", err);
  }
}

// 🔘 Apply button connect
window.applyFilters = function () {
  updateFinancials();
};

// 🔁 Reset button
window.resetAllFilters = function () {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  updateFinancials(); // reset stats
};

// 🔥 यहाँ ब्रैकेट और कोष्ठक सही से बंद किए गए हैं
document.addEventListener("DOMContentLoaded", () => {
  updateFinancials();
});
// 2. DOMContentLoaded - यहाँ फंक्शन का नाम सही करें
document.addEventListener("DOMContentLoaded", () => {
  // अगर Overview पेज पर हैं तभी इसे कॉल करें
  if (document.getElementById("statSales")) {
    updateFinancials();
  }
  // स्टूडेंट्स और सेलर्स वाले फंक्शन यहाँ कॉल करें
  // loadUserStats();
});

// overview clender reset
function resetStats() {
  // 1. दोनों डेट इनपुट्स को खाली करो
  document.getElementById("statsStart").value = "";
  document.getElementById("statsEnd").value = "";

  // 2. दोबारा बिना डेट के फंक्शन कॉल करो (All-time data के लिए)
  updateFinancials();
}

// साइडबार के एक्टिव स्टेट को मैनेज करने वाला फंक्शन
function setActiveNav(element) {
  // 1. पहले से मौजूद सभी 'active' क्लास हटाओ
  document.querySelectorAll(".nav-links li").forEach((li) => {
    li.classList.remove("active");
  });

  // 2. जिस पर क्लिक हुआ, उस पर 'active' क्लास लगाओ
  element.classList.add("active");
}

// Friday Payouts load karne ka function
let currentData = [];

async function loadPayouts(days = 7) {
  const contentArea = document.querySelector(".main-content");

  contentArea.innerHTML = `
        <style>
            .toolbar { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
            .search-box input { 
                padding: 12px 15px; width: 350px; border-radius: 8px; 
                border: 1px solid #444; background: #222; color: #fff; font-size: 14px;
            }
            .timeframes button { 
                padding: 8px 15px; margin: 0 2px; cursor: pointer; border-radius: 5px; 
                background: #333; color: #fff; border: 1px solid #444; transition: 0.3s;
            }
            .timeframes button.active { background: #007bff; border-color: #007bff; font-weight: bold; }
            input[type="date"] {
                background: #fff !important; color: #000 !important; padding: 8px; 
                border-radius: 5px; border: none; cursor: pointer;
            }
            .custom-date { display: flex; gap: 10px; align-items: center; background: #333; padding: 10px; border-radius: 8px; }
            
            /* टेबल हेडर को साफ़ दिखाने के लिए */
            .payout-table th { 
                padding: 15px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
            }
        </style>

       <div class="payout-header" style="display:flex; justify-content:space-between; align-items:center;">
    <h2 style="margin-bottom:20px; color: #fff;">Seller Payouts & Analytics</h2>
    
    <button onclick="refreshPayouts()" 
        style="background:#007bff; color:#fff; border:none; padding:10px 15px; border-radius:6px; cursor:pointer;">
        🔄 Refresh
    </button>
</div>
            <div class="toolbar">
                <div class="search-box">
                    <input type="text" id="sellerSearch" placeholder="🔍 Search by Seller Name or Email..." onkeyup="filterPayouts()">
                </div>
                <div class="timeframes">
                    <button onclick="setTimeframe(7)" id="tf-7">7D</button>
                    <button onclick="setTimeframe(30)" id="tf-30">1M</button>
                    <button onclick="setTimeframe(90)" id="tf-90">3M</button>
                    <button onclick="setTimeframe(365)" id="tf-365">1Y</button>
                    <button onclick="toggleCustomDate()">📅 Custom</button>
                </div>
                <div id="customDateRange" style="display:none;" class="custom-date">
                    <input type="date" id="startDate"> <span style="color:#fff">to</span> <input type="date" id="endDate">
                    <button onclick="applyCustomDate()" style="background:#28a745; color:#fff; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Apply</button>
                </div>
            </div>
    
        
        <div class="payout-table-wrapper">
            <table class="payout-table" style="width:100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background:#1a1a1a; color:#888; text-align:left;">
                        <th style="padding-left:15px;">Seller Name</th>
                        <th>Seller Email</th>
                        <th>Course Breakup</th>
                        <th style="color: #2ecc71;">Already Paid</th> <!-- ✅ नया कॉलम -->
                        <th style="color: #ff9800;">Due Amount</th>    <!-- ⚠️ नया कॉलम -->
                        <th>Admin Fee (20%)</th>
                        <th>Net Payable</th>
                        <th style="text-align: center;">Status</th>
                        <th style="text-align: center;">Action</th>
                    </tr>
                </thead>
                <tbody id="payoutTableBody"></tbody>
            </table>
        </div>
    `;
  setTimeframe(days);
}
// refresh function
function refreshPayouts() {
  document.getElementById("sellerSearch").value = "";

  const start = document.getElementById("startDate");
  const end = document.getElementById("endDate");
  if (start) start.value = "";
  if (end) end.value = "";

  setTimeframe(7);
}
// 1. Search Function (Sirf Email se search karega)
function filterPayouts() {
  const searchTerm = document
    .getElementById("sellerSearch")
    .value.toLowerCase();

  if (!searchTerm) {
    renderTable(currentData);
    return;
  }

  const filtered = currentData.filter((item) => {
    const name = (
      item.sellerName ||
      item.name ||
      item.seller?.name ||
      ""
    ).toLowerCase();

    const email = (
      item.sellerEmail ||
      item.email ||
      item.seller?.email ||
      ""
    ).toLowerCase();

    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  renderTable(filtered);
}

// ✅ TABLE RENDER (👉 yaha dalna hai)
function renderTable(data) {
  const tbody = document.getElementById("payoutTableBody");

  if (!tbody) return;

  tbody.innerHTML = data
    .map(
      (item) => `
      <tr>
        <td>${item.sellerName || "-"}</td>
        <td>${item.sellerEmail || "-"}</td>
      </tr>
    `,
    )
    .join("");
}
// 2. Date Filter Fix
function setTimeframe(days) {
  document
    .querySelectorAll(".timeframes button")
    .forEach((b) => b.classList.remove("active"));
  if (document.getElementById(`tf-${days}`))
    document.getElementById(`tf-${days}`).classList.add("active");

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  // ISO string backend ke liye
  fetchData(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
}

async function fetchData(start, end) {
  // थोड़ा सा इंतज़ार ताकि HTML DOM में आ जाए
  setTimeout(async () => {
    const body = document.getElementById("payoutTableBody");
    if (!body) {
      console.error("❌ payoutTableBody not found in DOM!");
      return;
    }

    body.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#00ff88;">⏳ Fetching records...</td></tr>`;

    try {
      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/friday-payouts?startDate=${start}&endDate=${end}`,
      );
      const result = await res.json();

      if (result.success && result.data.length > 0) {
        currentData = result.data;
        renderTable(currentData); // ✅ अब ये सही से काम करेगा
      } else {
        body.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#666;">No payouts found for this range. 📂</td></tr>`;
      }
    } catch (error) {
      console.error("Data fetch error:", error);
      body.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:red;">⚠️ Server Connection Error</td></tr>`;
    }
  }, 100); // 100ms का छोटा डिले
}

function renderTable(data) {
  // 🔥 SMART HIDE LOGIC: Seller Document table ko chhupane ke liye
  const sellerDiv = document.getElementById("sellerDocsDiv");
  if (sellerDiv) sellerDiv.style.display = "none";

  // Purane containers (Stats, Filters, etc.) ko wapas dikhane ke liye
  const containers = [
    ".table-container",
    ".stats-container",
    ".filter-section",
  ];
  containers.forEach((c) => {
    const el = document.querySelector(c);
    if (el) el.style.display = c === ".table-container" ? "block" : "flex";
  });

  // "User Management Panel" ka header dikhane ke liye
  const uHeader =
    document.querySelector(".user-management-header") ||
    document.querySelector("h1")?.parentElement;
  if (uHeader) uHeader.style.display = "block";

  // --- Tumhara Purana Code Yahan Se Shuru ---
  const body = document.getElementById("payoutTableBody");
  // कॉलम बढ़ गए हैं इसलिए colspan को 9 कर दिया
  if (!data || data.length === 0) {
    body.innerHTML =
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found. 📂</td></tr>`;
    return;
  }

  body.innerHTML = data
    .map((item) => {
      // 🔥 Backend से आ रहा नया डेटा
      const paidAmount = item.alreadyPaid || 0;
      const dueAmount = item.dueAmount || 0;

      // एडमिन फीस सिर्फ पेंडिंग (Due) अमाउंट पर कटेगी
      const adminFee = item.adminCommission || 0;
      const netDue = item.netDue || 0;

      const sellerEmail = item.sellerEmail;

      // 🔥 STATUS LOGIC: अगर Due है तो पेंडिंग, वरना All Clear
      const hasDue = dueAmount > 0;
      const statusHTML = hasDue
        ? `<span class="status-pending" style="background: #ffcc00; color: #000000; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase;">Pending</span>`
        : `<span class="status-paid" style="background: #2ecc71; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase;">All Clear</span>`;

      // Action Button: सिर्फ पेंडिंग होने पर ही 'Pay Due' दिखेगा
      const actionHTML = hasDue
        ? `<button class="pay-btn" onclick="processPayment('${sellerEmail}', ${netDue})" style="background: #007bff; color: white; cursor: pointer; border:none; padding: 8px 15px; border-radius: 5px;">
                <i class="fas fa-money-bill-wave"></i> Pay Due
               </button>`
        : `<button class="pay-btn" disabled style="opacity: 0.6; cursor: not-allowed; background: #555; border:none; padding: 8px 15px; border-radius: 5px; color: #fff;">
                <i class="fas fa-check-double"></i> Settled
               </button>`;

      return `
        <tr>
            <td class="sticky-col"><b>${item.sellerName || "N/A"}</b></td>
            <td><span class="email-text" style="color: #bbb; font-size: 11px;">${sellerEmail}</span></td>
            
            <!-- COURSE BREAKUP (xCount) -->
            <td>
                <div class="course-flex" style="display: flex; flex-wrap: wrap; gap: 5px;">
                    ${
                      item.courses
                        ? item.courses
                            .map(
                              (c) => `
                        <span class="c-tag" style="background: #333; color: #ffcc00; padding: 3px 8px; border-radius: 12px; font-size: 10px; border: 1px solid #ffcc0033;">
                            ${c.name} <b>(x${c.count})</b>
                        </span>
                    `,
                            )
                            .join("")
                        : "N/A"
                    }
                </div>
            </td>

            <!-- ✅ पिछला भुगतान (Green) -->
            <td style="color: #2ecc71; font-weight: 600;">₹${paidAmount.toLocaleString("en-IN")}</td>

            <!-- ⚠️ अभी का बकाया (Orange) -->
            <td style="color: #ff9800; font-weight: 600;">₹${dueAmount.toLocaleString("en-IN")}</td>

            <!-- 📉 एडमिन फीस -->
            <td style="color: #ff4d4d;">- ₹${parseFloat(adminFee).toLocaleString("en-IN")}</td>

            <!-- 💵 नेट पेआउट (जो आज देना है) -->
            <td style="color: #00ff88; font-weight: bold; font-size: 15px;">₹${parseFloat(netDue).toLocaleString("en-IN")}</td>
            
            <td style="text-align: center;">${statusHTML}</td>
            <td style="text-align: center;">${actionHTML}</td>
        </tr>
        `;
    })
    .join("");
}

// 3. Pay Now Button Logic
async function processPayment(email, amount) {
  // 1. Professional Payment Confirmation
  const result = await Swal.fire({
    title: "Confirm Payout",
    html: `You are about to pay <b style="color: #28a745; font-size: 1.2rem;">₹${amount}</b><br>to <b>${email}</b>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745", // Green for payment
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Pay Now!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // Show loading spinner during API call
      Swal.fire({
        title: "Processing Payment...",
        text: "Please do not refresh the page.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/update-payout-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }),
        },
      );

      const result = await res.json();

      if (result.success) {
        // 2. Success Alert
        await Swal.fire({
          title: "Payment Successful! 💰",
          text: `Status updated to 'Success' for ${email}`,
          icon: "success",
          confirmButtonText: "Great!",
        });

        // Refresh table or page
        location.reload();
      } else {
        // 3. Server Error Alert
        Swal.fire({
          title: "Payment Failed",
          text: result.message || "The transaction could not be completed.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Payment Error:", error);
      // 4. Connection Error Alert
      Swal.fire({
        title: "Network Error",
        text: "Could not connect to the payment server.",
        icon: "error",
      });
    }
  }
}

// Baki Helper functions
function toggleCustomDate() {
  const el = document.getElementById("customDateRange");
  el.style.display = el.style.display === "none" ? "flex" : "none";
}

function applyCustomDate() {
  const s = document.getElementById("startDate").value;
  const e = document.getElementById("endDate").value;
  if (s && e) {
    fetchData(s, e);
  } else {
    alert("Bhai dono date select kar!");
  }
}

window.searchTableLive = function () {
  const input = document.getElementById("courseSearch");
  const filter = input.value.toLowerCase();

  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  const rows = tbody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].textContent.toLowerCase();
    rows[i].style.display = text.includes(filter) ? "" : "none";
  }
};

window.clearSearchOnly = function () {
  document.getElementById("courseSearch").value = "";
  searchTableLive();
};

window.resetAllFilters = function () {
  const search = document.getElementById("courseSearch");
  const start = document.getElementById("startDate");
  const end = document.getElementById("endDate");

  if (search) search.value = "";
  if (start) start.value = "";
  if (end) end.value = "";

  // 🔍 Table reset
  if (typeof searchTableLive === "function") {
    searchTableLive();
  }

  // 📊 Stats reset (IMPORTANT 🔥)
  updateFinancials();
};
//   admin order tracker pannel bellow function
// ============================================================
// 📡 1. DATA FETCH FUNCTION (Global Scope mein rakha hai)
// ============================================================
async function fetchAdminProducts() {
  console.log("📡 Admin Data Fetching Started...");
  const token = localStorage.getItem("token");

  // Check if table exists before fetching
  const tableBody = document.getElementById("adminProductList");
  if (!tableBody) return;

  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/products`, {
      headers: { "x-auth-token": token },
    });

    if (!res.ok) throw new Error("Access Denied or Server Error");

    const products = await res.json();
    console.log("📦 Data Received:", products);

    renderAdminTable(products);
    updateAdminStats(products);
  } catch (err) {
    console.error("❌ Admin Fetch Error:", err.message);
  }
}

// ============================================================
// 📊 2. STATS UPDATE (Safety Check ke saath)
// ============================================================
function updateAdminStats(data) {
  console.log("📊 Master Stats Syncing...");

  // 1. Course Page ke dabbo ke liye check
  const totalCoursesEl = document.getElementById("totalProducts");
  const pendingEl = document.getElementById("hiddenProducts");
  const hiddenDraftEl = document.getElementById("hiddendraf");

  if (totalCoursesEl) {
    totalCoursesEl.innerText = data.length || 0;

    if (pendingEl) {
      pendingEl.innerText = data.filter((p) => !p.isApproved).length;
    }

    if (hiddenDraftEl) {
      // Agar p.isVisible undefined hai toh usey hidden hi maano
      const hCount = data.filter(
        (p) => p.isVisible === false || String(p.isVisible) === "false",
      ).length;
      hiddenDraftEl.innerText = hCount;
    }

    console.log("✅ All Admin Stats Updated (Total, Pending, Hidden)");
    return; // Course page ka kaam khatam, aage mat badho
  }

  // 2. Order Tracker Page ke dabbo ke liye check
  const totalSalesEl = document.getElementById("totalSalesCount");
  if (totalSalesEl) {
    totalSalesEl.innerText = data.length;

    const pendingEl = document.getElementById("pendingPayoutsCount");
    const pendingAmtEl = document.getElementById("totalPendingAmount");
    const revenueEl = document.getElementById("totalRevenueAmount");

    const pendingOrders = data.filter(
      (o) => String(o.payoutStatus).toLowerCase().trim() === "pending",
    );

    if (pendingEl) pendingEl.innerText = pendingOrders.length;

    if (pendingAmtEl) {
      const pSum = pendingOrders.reduce(
        (acc, curr) =>
          acc +
          (parseFloat(String(curr.amount || 0).replace(/[₹,]/g, "")) || 0),
        0,
      );
      pendingAmtEl.innerText = `₹${pSum.toLocaleString("en-IN")}`;
    }

    if (revenueEl) {
      const cSum = data
        .filter(
          (o) => String(o.payoutStatus).toLowerCase().trim() === "completed",
        )
        .reduce(
          (acc, curr) =>
            acc +
            (parseFloat(String(curr.amount || 0).replace(/[₹,]/g, "")) || 0),
          0,
        );
      revenueEl.innerText = `₹${cSum.toLocaleString("en-IN")}`;
    }
    console.log("✅ Order Stats Set");
  }
}

// ============================================================
// 📝 3. RENDER TABLE FUNCTION course managment
// ============================================================
function renderAdminTable(products) {
  const body = document.getElementById("adminProductList");
  if (!body) return;

  body.innerHTML = products
    .map((p) => {
      const isHidden = p.isVisible === false || String(p.isVisible) === "false";
      const isApproved =
        p.isApproved === true || String(p.isApproved) === "true";

      // 🎥 YouTube Fix
      const rawVideo = p.videoLink || "";
      let embedUrl = "";

      if (rawVideo.includes("youtu.be")) {
        const videoId = rawVideo.split("/").pop().split("?")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (rawVideo.includes("watch?v=")) {
        const videoId = rawVideo.split("v=")[1].split("&")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (rawVideo.includes("youtube.com/embed/")) {
        embedUrl = rawVideo;
      }

      return `
        <!-- 🟢 MAIN DATA ROW -->
        <tr>
            <!-- 🔲 Checkbox -->
            <td>
                <input type="checkbox" class="course-checkbox" value="${p._id}" style="cursor:pointer; width:17px; height:17px;">
            </td>

            <!-- 📅 Date -->
            <td>${new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
            
            <!-- 📚 Title -->
            <td><b>${p.title}</b><br><small style="color:#94a3b8;">${p.category}</small></td>
            
            <!-- 🆔 Object Id -->
            <td class="obj-id" style="font-family:monospace; font-size:11px; color:#64748b;">${p._id}</td>
            
            <!-- 👤 Seller -->
            <td>${p.sellerName || "N/A"}<br><small>${p.sellerEmail || "N/A"}</small></td>
            
            <!-- 💰 Price -->
            <td style="color:#00ffcc; font-weight:bold;">₹${p.price}</td>
            
            <!-- 🏷️ Off -->
            <td>${p.discount || 0}%</td>
            
            <!-- ✅ Status -->
            <td>
                <span class="${isApproved ? "status-live" : "status-hidden"}" style="padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                    ${isApproved ? "LIVE" : "PENDING"}
                </span>
                <div style="font-size:9px; margin-top:4px; color:${isHidden ? "#ef4444" : "#22c55e"}; font-weight:bold;">
                    ${isHidden ? "HIDDEN 🚫" : "VISIBLE 👁️"}
                </div>
            </td>

            <!-- ⚡ Actions -->
            <td class="admin-ctrl-btns">
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="btn-sm" onclick="handleApprove('${p._id}')" 
                      style="background: ${isApproved ? "#1e293b" : "#3b82f6"}; color: white; border: 1px solid #3d444d; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                      ${isApproved ? "Unapprove" : "Approve"}
                    </button>
                    <button class="btn-sm btn-coupon" onclick="resetCoupon('${p._id}')">Del Coupon</button>
                    <button class="btn-sm btn-del" onclick="deleteProduct('${p._id}')">Delete</button>
                    <button onclick="handleHide('${p._id}')" 
                      style="background: ${isHidden ? "#ef4444" : "#1e293b"}; color: white; border: 1px solid #3d444d; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold;">
                      ${isHidden ? "Show" : "Hide"}
                    </button>
                    <button onclick="handleFeatured('${p._id}')" 
                      style="background: ${p.isFeatured ? "#a855f7" : "#1e293b"}; color: white; border: 1px solid #3d444d; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 5px;">
                      <i class="fas fa-star" style="color: ${p.isFeatured ? "#fff" : "#475569"};"></i>
                    </button>
                    <!-- 👁️ Eye Button -->
                    <button onclick="toggleCoursePreview('${p._id}')" 
                      style="background: #a020f0; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer;"
                      title="Quick Preview">
                      <i class="fas fa-eye"></i>
                  <!-- 🔔 2. SELLER ALERT (The Message Popup) -->
      <button onclick="openSellerActionPopup('${p._id}', '${p.sellerEmail}', '${p.title}', '${p.sellerName}')" 
    style="background:#ff9800; color:white; padding:4px 8px; border-radius:4px; border:none; cursor:pointer;" 
    title="Notify Seller">
    <i class="fas fa-bell"></i>
</button>
                </div>
            </td>
        </tr>

        <!-- 🎞️ DROPDOWN PREVIEW ROW -->
        <tr id="preview-${p._id}" class="preview-row" style="display: none; background: #0a1112; border-left: 4px solid #a020f0;">
            <td colspan="10" style="padding: 20px;">
                <div style="display: flex; gap: 30px; align-items: start; flex-wrap: wrap;">
                    <!-- Thumbnail -->
                    <div style="flex: 1; min-width: 280px;">
                        <p style="color: #a020f0; font-weight: bold; margin-bottom: 12px; font-size: 11px; letter-spacing: 1px;">🖼️ COURSE THUMBNAIL</p>
                        <img src="${p.thumbnail}" style="width: 100%; border-radius: 12px; border: 1px solid #333; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
                    </div>
                    
                    <!-- Video (Using Embed Link) -->
                    <div style="flex: 2; min-width: 350px;">
                        <p style="color: #a020f0; font-weight: bold; margin-bottom: 12px; font-size: 11px; letter-spacing: 1px;">📺 VIDEO PREVIEW</p>
                        <div style="background: #000; border-radius: 12px; overflow: hidden; position: relative; padding-top: 56.25%; border: 1px solid #333;">
                            <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                        </div>
                        <p style="margin-top:12px; font-size: 11px; color: #64748b;">🔗 Link: <a href="${rawVideo}" target="_blank" style="color: #00ffcc;">${rawVideo}</a></p>
                    </div>

                </div>
            </td>
        </tr>
    `;
    })
    .join("");

  // 🔥 2. Sabse important kaam yahan hai (Loop ke baad):
  // Table render hone ke baad No Data Row ko wapas append karo aur chhupao
  const noDataHTML = `
    <tr id="noDataRow" style="display: none !important;">
   <td colspan="8" style="padding: 100px 0; text-align: center; background: transparent; border: none;">
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <i class="fas fa-search-minus" style="font-size: 55px; color: #ff4757; margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(255, 71, 87, 0.3));"></i>
        <h2 style="font-size: 22px; color: #ffffff; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
            No Courses Found 🔍
        </h2>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 10px; font-weight: 400; max-width: 400px; line-height: 1.5;">
            We couldn't find any courses matching your current search criteria. Please try a different keyword or reset the filters.
        </p>
    </div>
</td>

    </tr>`;

  body.insertAdjacentHTML("beforeend", noDataHTML);
}

// controll cheak box function
// 1. SELECT ALL Logic
document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "selectAll") {
    const isChecked = e.target.checked;
    document.querySelectorAll(".course-checkbox").forEach((cb) => {
      cb.checked = isChecked;
    });
  }
});
// apply bulk
document
  .getElementById("applyBulkAction")
  ?.addEventListener("click", async function () {
    const actionSelect = document.getElementById("bulkActionSelect");
    const action = actionSelect.value;
    const actionText = actionSelect.options[actionSelect.selectedIndex].text;

    if (!action) {
      return Swal.fire({
        icon: "warning",
        title: "Action Required",
        text: "Please select a bulk action!",
        confirmButtonColor: "#a020f0",
      });
    }

    const selectedCheckboxes = document.querySelectorAll(
      ".course-checkbox:checked",
    );
    const selectedIds = Array.from(selectedCheckboxes).map((cb) => cb.value);

    if (selectedIds.length === 0) {
      return Swal.fire({
        icon: "info",
        title: "No Selection",
        text: "Select at least one course.",
        confirmButtonColor: "#a020f0",
      });
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Apply "${actionText}" to ${selectedIds.length} courses?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#a020f0",
      confirmButtonText: "Yes, Apply!",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        // ✅ Aapke standard format ke hisaab se Fetch call
        const response = await fetch(
          `${CONFIG.BASE_API_URL}/admin/bulk-update-courses`,
          {
            method: "PUT", // Aapki API PUT handle kar rahi hogi
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": localStorage.getItem("token"), // 🔑 Token added
            },
            body: JSON.stringify({
              ids: selectedIds,
              action: action,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          await Swal.fire({
            icon: "success",
            title: "Updated!",
            text: data.message,
            timer: 2000,
          });
          location.reload();
        } else {
          throw new Error(data.message || "Server Error");
        }
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      }
    }
  });
// <--- Ye bracket miss ho raha tha

// tenggle view link&thumb
// 👁️ Toggle Function (Emoji ke saath)
function toggleCoursePreview(id) {
  const previewRow = document.getElementById(`preview-${id}`);

  // Pehle check karein ki koi aur preview toh nahi khula? (Optional: Ek baar mein ek hi khulega)
  document.querySelectorAll('[id^="preview-"]').forEach((row) => {
    if (row.id !== `preview-${id}`) row.style.display = "none";
  });

  // Toggle current row
  if (previewRow.style.display === "none" || previewRow.style.display === "") {
    previewRow.style.display = "table-row";
  } else {
    previewRow.style.display = "none";
  }
}

// 🖱️ Click Outside to Close Logic
document.addEventListener("click", function (event) {
  // 1. Check karein ki click kisi 'Eye' button par toh nahi hua?
  const isClickOnEyeBtn = event.target.closest(
    'button[onclick*="toggleCoursePreview"]',
  );

  // 2. Check karein ki click preview row ke andar toh nahi hua?
  const isClickInsidePreview = event.target.closest('[id^="preview-"]');

  // 3. Agar click dono ke bahar hai, toh saare previews band kar do
  if (!isClickOnEyeBtn && !isClickInsidePreview) {
    document.querySelectorAll('[id^="preview-"]').forEach((row) => {
      row.style.display = "none";
    });
  }
});

// open seller action popup course managment pannel
// 🔔 Seller Alert Function (Fixed for 'p is not defined' error)
async function openSellerActionPopup(
  courseId,
  sellerEmail,
  courseTitle,
  sellerName,
) {
  const { value: formValues } = await Swal.fire({
    title: "Notify Seller 🚨",
    background: "#0d1a1b",
    color: "#fff",
    html: `
      <div style="text-align:left; margin-bottom:10px;">
        <small style="color:#a020f0;">Target Course:</small><br>
        <b>${courseTitle}</b>
      </div>
      <select id="swal-reason" class="swal2-input" style="background:#1a1a1a; color:#fff; font-size:14px; width:90%; height: 45px; border-radius: 8px;">
        <option value="Course Approved">✅ Course Approved & Live</option>
        <option value="Course Rejected">❌ Course Rejected</option>
        <option value="Policy Violation">🚨 Policy Violation</option>
        <option value="Information Missing">📝 Details Missing</option>
        <option value="Video Link Broken">📺 Video Link Broken</option>
        <option value="Update Required">🔔 Update Required</option>
        <option value="Thumbnail Quality Low">🖼️ Thumbnail Quality Low</option>
        <option value="Price/Discount Issue">💰 Price/Discount Issue</option>
        <option value="Spam/Duplicate Course">🚫 Spam/Duplicate Course</option>
        <option value="Best Seller Badge Added">⭐ Best Seller Badge Added</option>
        <option value="General Support Message">💬 General Support Message</option>
      </select>
      <textarea id="swal-note" class="swal2-textarea" style="background:#1a1a1a; color:#fff; border-radius: 8px;" placeholder="Add specific instructions for the seller..."></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: "Send Alert 📩",
    confirmButtonColor: "#a020f0",
    preConfirm: () => {
      return {
        reason: document.getElementById("swal-reason").value,
        message: document.getElementById("swal-note").value,
      };
    },
  });

  if (formValues) {
    Swal.fire({
      title: "Notifying Seller...",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/send-seller-action-mail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({
            courseId,
            sellerEmail,
            sellerName, // 👈 Ab ye variable arguments se aayega
            courseTitle,
            reason: formValues.reason,
            message: formValues.message,
          }),
        },
      );

      if (res.ok) {
        Swal.fire("Success!", "Seller has been alerted.", "success");
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to send notification.");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }
}

// ============================================================
// 🚀 4. PAGE LOAD LOGIC (Sabse important fix)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🛠️ Admin Script Initialized");

  // Check karein ki hum kis page par hain
  if (document.getElementById("adminProductList")) {
    fetchAdminProducts();
  }

  // Dashboard wala purana error fix karne ke liye:
  // Sirf tabhi fetch karein jab dashboard ke elements maujood hon
  if (document.getElementById("totalSales")) {
    if (typeof fetchDashboardData === "function") {
      fetchDashboardData();
    }
  }
});

// 🚀 Page load hote hi data mangwao
document.addEventListener("DOMContentLoaded", fetchAdminProducts);

// 🔥 approve unapprove work this function
window.handleApprove = async function (id) {
  try {
    const res = await fetch(
      `${CONFIG.BASE_API_URL}/admin/approve-product/${id}`,
      {
        method: "PUT",
        headers: { "x-auth-token": localStorage.getItem("token") },
      },
    );

    const data = await res.json();

    if (res.ok) {
      const isApprovedNow = data.status; // ✅ correct

      Swal.fire({
        icon: isApprovedNow ? "success" : "info",
        title: isApprovedNow ? "Course Approved! ✅" : "Course Unapproved! ❌",
        html: `The approval status has been updated.<br><b>Status:</b> ${
          isApprovedNow ? "Approved for Sale" : "Rejected/Pending"
        }`,
        background: "#111827",
        color: "#f8fafc",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        showClass: { popup: "animate__animated animate__fadeInDown" },
      });

      fetchAdminProducts();
    }
  } catch (err) {
    console.error("Approve error:", err);
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: "Server communication error.",
      background: "#111827",
      color: "#fff",
    });
  }
};

// thsh function work hide/unhide
window.handleHide = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire("Error", "Session expired. Please login again.", "error");
    return;
  }

  try {
    const res = await fetch(
      `${CONFIG.BASE_API_URL}/admin/toggle-visibility/${id}`,
      {
        method: "PUT",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
      },
    );

    const data = await res.json();

    if (res.ok && data.success) {
      Swal.fire({
        icon: data.isVisible ? "success" : "warning",
        title: data.isVisible ? "Visibility: LIVE 🔥" : "Visibility: HIDDEN 🚫",
        html: `
                    <div style="font-size: 14px; margin-top: 10px;">
                        ${
                          data.isVisible
                            ? "This course is now <b>Public</b>. Students can purchase it from the storefront."
                            : "This course is now <b>Private</b>. It has been hidden from the student store."
                        }
                    </div>
                `,
        background: "#111827",
        color: "#f8fafc",
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false,
        showClass: { popup: "animate__animated animate__zoomIn" },
      });

      if (typeof fetchAdminProducts === "function") fetchAdminProducts();
    }
  } catch (err) {
    console.error("Hide error:", err);
    Swal.fire({
      icon: "error",
      title: "System Error",
      text: "Unable to update visibility.",
      background: "#111827",
      color: "#fff",
    });
  }
};

window.handleFeatured = async (id) => {
  try {
    const res = await fetch(
      `${CONFIG.BASE_API_URL}/admin/toggle-featured/${id}`,
      {
        method: "PUT",
        headers: { "x-auth-token": localStorage.getItem("token") },
      },
    );
    const data = await res.json();
    if (res.ok && data.success) {
      Swal.fire({
        icon: "success",
        title: data.isFeatured ? "Featured! 🔥" : "Removed",
        text: data.msg,
        background: "#111827",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchAdminProducts(); // टेबल रिफ्रेश
    }
  } catch (err) {
    console.error(err);
  }
};

// 🔥 RESET COUPON FUNCTION
window.resetCoupon = async function (id) {
  // 1. Professional Confirmation Dialog
  const result = await Swal.fire({
    title: "Reset Discount?",
    text: "Are you sure? This will set the course discount to 0%.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#00ffcc", // Neon Cyan
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Reset Now!",
    cancelButtonText: "Cancel",
    background: "#0a0a0a", // Dark Theme
    color: "#fff",
    iconColor: "#00ffcc",
  });

  if (result.isConfirmed) {
    try {
      // Show loading spinner
      Swal.fire({
        title: "Processing...",
        background: "#0a0a0a",
        color: "#fff",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/reset-coupon/${id}`,
        {
          method: "PUT",
          headers: { "x-auth-token": localStorage.getItem("token") },
        },
      );

      if (res.ok) {
        // 2. Success Alert
        Swal.fire({
          title: "Reset Successful!",
          text: "The discount has been set to 0%.",
          icon: "success",
          background: "#0a0a0a",
          color: "#fff",
          confirmButtonColor: "#00ffcc",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh product list
        fetchAdminProducts();
      } else {
        Swal.fire({
          title: "Update Failed",
          text: "Could not reset the coupon. Please try again.",
          icon: "error",
          background: "#0a0a0a",
          color: "#fff",
        });
      }
    } catch (err) {
      console.error("Reset Error:", err);
      Swal.fire({
        title: "Server Error",
        text: "Connection failed!",
        icon: "error",
        background: "#0a0a0a",
        color: "#fff",
      });
    }
  }
};

// 🗑️ MASTER DELETE COURSE
async function deleteProduct(id) {
  // 1. Pehle Swal se poochho (Confirmation)
  const confirm = await Swal.fire({
    title: "Bhai, pakka udaana hai?",
    text: "Ek baar delete hua toh wapas nahi aayega!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#374151",
    confirmButtonText: "Haan, Delete kar do!",
    background: "#111827",
    color: "#fff",
  });

  // 2. Agar user ne 'Haan' bola tabhi delete karo
  if (confirm.isConfirmed) {
    try {
      // Loading dikhao jab tak delete ho raha hai
      Swal.fire({
        title: "Uda raha hoon...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#111827",
        color: "#fff",
      });

      const res = await fetch(
        `${CONFIG.BASE_API_URL}/admin/delete-course/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-auth-token": localStorage.getItem("token"),
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json();

      if (res.ok) {
        // ✅ Success Alert
        await Swal.fire({
          icon: "success",
          title: "Khalaas! 🚀",
          text: "Course database se parmanently uda diya gaya hai.",
          background: "#111827",
          color: "#fff",
          timer: 2000,
          showConfirmButton: false,
        });

        // Table refresh karo
        fetchAdminProducts();
      } else {
        throw new Error(data.msg || "Delete failed");
      }
    } catch (err) {
      // ❌ Error Alert
      Swal.fire({
        icon: "error",
        title: "Lafda ho gaya!",
        text: err.message,
        background: "#111827",
        color: "#fff",
      });
    }
  }
}

// 👁️ HIDE/SHOW COURSE
async function toggleVisibility(id, currentStatus) {
  // API call to toggle isApproved field
}

// 🎟️ DELETE CURRENT COUPON
async function resetCoupon(id) {
  // API call to set discount = 0
}

// 🔍 1. LIVE SEARCH LOGIC (Universal for both pages)
window.searchTableLive = function () {
  // 1. Search input ki value uthao
  const input =
    document.getElementById("courseSearch")?.value.toLowerCase().trim() || "";

  // 2. Sahi table body pakdo
  const tableBody = document.getElementById("adminProductList");
  if (!tableBody)
    return console.error("❌ Table body 'adminProductList' nahi mili!");

  // 3. Saari rows uthao (NoDataRow ko chhod kar)
  const rows = tableBody.querySelectorAll("tr:not(#noDataRow)");
  let visibleCount = 0;

  console.log("⌨️ Searching for:", input); // Debugging ke liye

  rows.forEach((row) => {
    // Poori row ka text (Title, Category, Email, ID) check karo
    const rowText = row.innerText.toLowerCase();

    if (rowText.includes(input)) {
      row.style.display = ""; // Match mila toh dikhao
      visibleCount++;
    } else {
      row.style.display = "none"; // Nahi mila toh chhupao
    }
  });

  // 4. Agar ek bhi result nahi mila toh 'No Results' wala message dikhao
  const noData = document.getElementById("noDataRow");
  if (noData) {
    noData.style.display =
      visibleCount === 0 && input !== "" ? "table-row" : "none";
  }

  console.log(`✅ Filtered: ${visibleCount} courses visible.`);
};

// auto detect serch input for global
// 🔥 SELF-EXECUTING SEARCH LOGIC
document.addEventListener("input", function (e) {
  // Check karo ki kya 'courseSearch' waale input mein typing ho rahi hai
  if (e.target && e.target.id === "courseSearch") {
    const input = e.target.value.toLowerCase().trim();
    const tableBody =
      document.getElementById("adminProductList") ||
      document.getElementById("adminOrderList");

    if (!tableBody) return;

    const rows = tableBody.querySelectorAll("tr:not(#noDataRow)");
    let visibleCount = 0;

    rows.forEach((row) => {
      const text = row.innerText.toLowerCase();
      if (text.includes(input)) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    // No Data Message Show/Hide
    const noData = document.getElementById("noDataRow");
    if (noData) {
      noData.style.display =
        visibleCount === 0 && input !== "" ? "table-row" : "none";
    }
  }
});

// ============================================================
// 🔍 1. LIVE SEARCH LOGIC (Email, Title, ID)
// ============================================================
window.applyFilters = function () {
  const startVal = document.getElementById("startDate")?.value;
  const endVal = document.getElementById("endDate")?.value;
  const tableBody =
    document.getElementById("adminProductList") ||
    document.getElementById("adminOrderList");

  if (!startVal || !endVal || !tableBody) return;

  const start = new Date(startVal);
  const end = new Date(endVal);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const rows = tableBody.querySelectorAll("tr:not(#noDataRow)");
  let visibleCount = 0;

  rows.forEach((row) => {
    const dateStr = row.cells[0].innerText.trim();
    const separator = dateStr.includes("-") ? "-" : "/";
    const parts = dateStr.split(separator);
    const rowDate = new Date(parts[2], parts[1] - 1, parts[0]);

    if (rowDate >= start && rowDate <= end) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  const noData = document.getElementById("noDataRow");
  if (noData) noData.style.display = visibleCount === 0 ? "table-row" : "none";
};

// ============================================================
// 🚀 AUTO-LOADER (Important Fix)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Agar Products page hai
  if (document.getElementById("adminProductList")) {
    console.log("📦 Loading Products...");
    if (typeof fetchAdminProducts === "function") fetchAdminProducts();
  }
  // 2. Agar Orders page hai
  if (document.getElementById("adminOrderList")) {
    console.log("💰 Loading Orders...");
    if (typeof fetchOrders === "function") fetchOrders();
  }
});
// ============================================================
// 🔄 3. RESET & REFRESH LOGIC
// ============================================================
// 🔥 1. CLEAR SEARCH ONLY (Zabardasti Table Reset)
window.clearSearchOnly = function () {
  console.log("🔄 Clearing Search Bar and Showing All Data...");

  const searchInput = document.getElementById("courseSearch");
  if (searchInput) searchInput.value = ""; // Search box saaf

  const tableBody =
    document.getElementById("adminProductList") ||
    document.getElementById("adminOrderList");

  if (tableBody) {
    const rows = tableBody.getElementsByTagName("tr");
    for (let row of rows) {
      if (row.id !== "noDataRow") {
        // 🔥 Browser ko force karo saari rows dikhane ke liye
        row.style.setProperty("display", "", "important");
      }
    }

    // No Data message ko chhupao
    const noData = document.getElementById("noDataRow");
    if (noData) noData.style.setProperty("display", "none", "important");
  }

  console.log("✅ Search cleared. All rows are now visible.");
};

// resetallfilter
window.resetAllFilters = function () {
  console.log("🧹 Resetting Dates Only...");

  // 1. Sirf Dates ko saaf karo
  const startInp = document.getElementById("startDate");
  const endInp = document.getElementById("endDate");
  if (startInp) startInp.value = "";
  if (endInp) endInp.value = "";

  // 2. Check karo konsi table page par hai
  const tableBody =
    document.getElementById("adminProductList") ||
    document.getElementById("adminOrderList");

  if (tableBody) {
    const rows = tableBody.getElementsByTagName("tr");

    // 🔥 Search bar ka text check karo taaki search filter bana rahe
    const searchText =
      document.getElementById("courseSearch")?.value.toLowerCase() || "";

    for (let row of rows) {
      if (row.id !== "noDataRow") {
        const rowText = row.innerText.toLowerCase();

        // Agar search box mein kuch likha hai, toh wahi rows dikhao
        if (rowText.includes(searchText)) {
          row.style.setProperty("display", "", "important");
        } else {
          row.style.setProperty("display", "none", "important");
        }
      }
    }

    // No Data message ko chhupao
    const noData = document.getElementById("noDataRow");
    if (noData) noData.style.setProperty("display", "none", "important");
  }

  console.log("✅ Dates cleared and Table refreshed!");
};

// 📂 5. CSV DOWNLOAD (Excel File) Admin course managment pannel
function exportCSV() {
  const table = document.querySelector(".master-table");

  let csv = [];

  // Header aur Data rows ko nikalna
  for (let i = 0; i < table.rows.length; i++) {
    let row = [],
      cols = table.rows[i].cells;
    for (let j = 0; j < cols.length; j++) {
      // Text se comma aur extra spaces hatana taaki CSV kharab na ho
      row.push(
        `"${cols[j].innerText.replace(/\n/g, " ").replace(/"/g, '""')}"`,
      );
    }
    csv.push(row.join(","));
  }

  // CSV File banana
  const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `BR30_Course_Report_${new Date().toLocaleDateString()}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

//#region pdf template custom  admin coursemanagment pannel
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  // 📄 Landscape mode 'l' taaki 7 columns sahi se fit ho jayein
  const doc = new jsPDF("l", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoUrl = "../images/BR30™  LOGO.jpeg";
  try {
    doc.addImage(logoUrl, "JPEG", pageWidth - 110, 25, 70, 50);
  } catch (e) {
    console.warn("Logo miss ho gaya!");
  }

  // --- 1. HEADER ---
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Blue Color
  doc.setFont("helvetica", "bold");
  doc.text("BR30 TRADER ACADEMY", 40, 50);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("OFFICIAL PRODUCT INVENTORY & COURSE MANAGEMENT REPORT", 40, 68);
  doc.line(40, 85, pageWidth - 40, 85);

  // --- 2. TABLE HEADER (Matched to your Product Page) ---
  doc.setFillColor(59, 130, 246);
  doc.rect(40, 100, pageWidth - 80, 28, "F");

  doc.setFontSize(9);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");

  // Positions: Date(50), Title(130), ID(280), Seller(440), Price(620), Off%(700), Status(750)
  doc.text("Date", 50, 118);
  doc.text("Course Title & Category", 130, 118);
  doc.text("Object ID", 280, 118);
  doc.text("Seller Info", 440, 118);
  doc.text("Price", 620, 118);
  doc.text("Off %", 700, 118);
  doc.text("Status", 750, 118);

  // --- 3. DATA ROWS (Mapping from .master-table) ---
  const tableBody = document.querySelector(".master-table tbody");
  if (!tableBody) return Swal.fire("Error", "Table data nahi mila!", "error");

  const rows = tableBody.querySelectorAll("tr");
  let y = 145;

  rows.forEach((tr) => {
    const tds = tr.querySelectorAll("td");
    // Humein ensure karna hai ki ye hidden rows na hon (Search filter ke waqt)
    if (tds.length >= 7 && tr.style.display !== "none") {
      if (y > pageHeight - 80) {
        addFooter(doc, pageWidth, pageHeight);
        doc.addPage();
        y = 50;
      }

      // --- CLEAN DATA EXTRACTION (Currency Fix) ---
      const date = tds[0].innerText.trim();
      const title = tds[1].innerText.split("\n")[0].trim().toUpperCase();
      const objId = tds[2].innerText.trim();
      const seller = tds[3].innerText.split("\n")[0].trim();

      // 🔥 YAHAN FIX HAI: Rupee symbol ko Rs. se replace kiya
      const priceRaw = tds[4].innerText.trim();
      const price = priceRaw.replace("₹", "Rs. ");

      const discount = tds[5].innerText.trim();
      const status = tds[6].innerText.trim().toUpperCase();

      doc.setFontSize(8);
      doc.setTextColor(50);
      doc.setFont("helvetica", "normal");

      doc.text(date, 50, y);
      doc.setFont("helvetica", "bold");
      doc.text(title.substring(0, 30), 130, y);

      doc.setFontSize(7);
      doc.text(objId, 280, y);

      doc.setFontSize(8);
      doc.text(seller.substring(0, 25), 440, y);

      // ✅ Ab ye "Rs. 17,400" print karega bina error ke
      doc.text(price, 620, y);
      doc.text(discount, 700, y);

      // Status Color (LIVE = Green, HIDDEN = Red)
      if (status.includes("LIVE")) {
        doc.setTextColor(5, 150, 105);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.setFont("helvetica", "bold");
      doc.text(status, 750, y);

      // Reset color for next line
      doc.setDrawColor(240);
      doc.line(40, y + 12, pageWidth - 40, y + 12);
      y += 28;
    }
  });

  addFooter(doc, pageWidth, pageHeight);
  doc.save(`BR30_Inventory_Report_${Date.now()}.pdf`);
}

function addFooter(doc, pageWidth, pageHeight) {
  const dateStr = new Date().toLocaleString("en-IN");
  doc.setDrawColor(230, 230, 230);
  doc.line(40, pageHeight - 60, pageWidth - 40, pageHeight - 60);

  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This report is generated by BR30 TRADER MASTER ADMIN PANEL.",
    40,
    pageHeight - 45,
  );

  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${dateStr}`, 40, pageHeight - 32);

  const pageNo = doc.internal.getNumberOfPages();
  doc.text(`Page ${pageNo}`, pageWidth - 60, pageHeight - 32);
}

//#endregion

// admil all order tracker pannel function bellow
async function fetchAllOrders() {
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/orders`, {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const orders = await res.json();
    renderOrderTable(orders);
  } catch (err) {
    console.error("❌ Order Fetch Error:", err);
  }
}

// admin course managment
// render td admin order list
function renderOrderTable(orders) {
  const body = document.getElementById("adminOrderList");
  if (!body) return;

  // 1. Saara Orders ka data load karo
  body.innerHTML = orders
    .map(
      (o) => `
        <tr>
            <td>${new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
            <td><b>${o.customerName || "User"}</b><br><small>${o.customerEmail}</small></td>
            <td><b>${o.productName}</b><br><small class="obj-id">ID: ${o.productId}</small></td>
            <td style="color:#00ffcc; font-weight:bold;">₹${o.amount}</td>
            <td>${o.sellerName}<br><small>${o.sellerEmail}</small></td>
            <td><span class="status-success">SUCCESS</span></td>
            <td><button class="btn-sm btn-details" onclick="viewOrder('${o._id}')">DETAILS</button></td>
        </tr>
    `,
    )
    .join("");

  // 🔥 2. "No Data" wali Row Table ke end mein add karo (Shuru mein hidden)
  const noDataHTML = `
    <tr id="noDataRow" style="display: none !important;">
        <td colspan="7" style="padding: 100px 0; text-align: center; background: transparent; border: none;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i class="fas fa-search-minus" style="font-size: 50px; color: #ff4757; margin-bottom: 20px;"></i>
     <h2 style="font-size: 20px; color: #ffffff; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
    No Transactions Found 🔍
</h2>
<p style="color: #94a3b8; font-size: 14px; margin-top: 10px; font-weight: 400;">
    We couldn't find any orders matching your criteria. Please verify the email address or adjust the date range.
</p>
            </div>
        </td>
    </tr>`;

  // loop ke baad ye line add karo
  body.insertAdjacentHTML(
    "beforeend",
    `<tr id="noDataRow" style="display: none;"><td colspan="7" style="text-align:center; padding:80px; color:#ff4757; font-size:18px; font-weight:bold;">Bhai, koi order nahi mila! 🔍</td></tr>`,
  );
}

// 🚀 Load on start
document.addEventListener("DOMContentLoaded", fetchAllOrders);

// 🔍 1. SEARCH LOGIC (Live Search)
window.searchTableLive = function () {
  const input = document.getElementById("courseSearch").value.toLowerCase();

  // 🔥 Sabse important: :not(#noDataRow) lagana zaroori hai
  const rows = document.querySelectorAll("#adminOrderList tr:not(#noDataRow)");
  const noData = document.getElementById("noDataRow");

  let visibleCount = 0;

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    if (text.includes(input)) {
      row.style.display = ""; // Data mila toh row dikhao
      visibleCount++;
    } else {
      row.style.display = "none"; // Nahi mila toh hide karo
    }
  });

  // 🚩 Agar ek bhi row nahi dikh rahi (visibleCount === 0)
  if (noData) {
    if (visibleCount === 0) {
      noData.style.setProperty("display", "table-row", "important");
    } else {
      noData.style.setProperty("display", "none", "important");
    }
  }
};

// 📅 2. DATE FILTER LOGIC
window.applyFilters = function () {
  const searchInput = document.getElementById("courseSearch");
  const startVal = document.getElementById("startDate")?.value;
  const endVal = document.getElementById("endDate")?.value;

  // 🔥 Sabse bada fix: Check karo konsi table body page par hai
  const tableBody =
    document.getElementById("adminProductList") ||
    document.getElementById("adminOrderList");

  if (!tableBody) {
    console.error(
      "❌ Error: Koi bhi table body (Products ya Orders) nahi mili!",
    );
    return;
  }

  if (!startVal || !endVal) {
    return Swal.fire(
      "Dates Missing!",
      "Pehle From aur To dono dates select karo.",
      "warning",
    );
  }

  const start = new Date(startVal);
  const end = new Date(endVal);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Sirf usi table ki rows uthao jo page par hai
  const rows = tableBody.querySelectorAll("tr:not(#noDataRow)");
  let visibleCount = 0;

  rows.forEach((row) => {
    const dateStr = row.cells[0].innerText.trim();
    const separator = dateStr.includes("-") ? "-" : "/";
    const parts = dateStr.split(separator);

    // JS Months 0-11 hote hain
    const rowDate = new Date(parts[2], parts[1] - 1, parts[0]);

    if (rowDate >= start && rowDate <= end) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  const noData = document.getElementById("noDataRow");
  if (noData) noData.style.display = visibleCount === 0 ? "table-row" : "none";

  console.log(`✅ Filtered: ${visibleCount} results found.`);
};
// 📊 1. UPDATED STATS LOGIC (Pending Payouts + Amount Fix)
function updateOrderStats(orders) {
  console.log("📊 Final Precise DB Sync...");

  // 1. Total Sold
  const totalSalesEl = document.getElementById("totalSalesCount");
  if (totalSalesEl) totalSalesEl.innerText = orders.length;

  // 2. Pending Payouts Count
  const pendingOrders = orders.filter(
    (o) =>
      String(o.payoutStatus || "")
        .toLowerCase()
        .trim() === "pending",
  );
  const pendingCountEl = document.getElementById("pendingPayoutsCount");
  if (pendingCountEl) pendingCountEl.innerText = pendingOrders.length;

  // 3. Total Pending Amount
  const pendingSum = pendingOrders.reduce((acc, curr) => {
    const val = String(curr.amount || 0).replace(/[₹,]/g, "");
    return acc + (parseFloat(val) || 0);
  }, 0);
  const totalPendingEl = document.getElementById("totalPendingAmount");
  if (totalPendingEl)
    totalPendingEl.innerText = `₹${pendingSum.toLocaleString("en-IN")}`;

  // 4. Total Completed Amount
  const completedOrders = orders.filter(
    (o) =>
      String(o.payoutStatus || "")
        .toLowerCase()
        .trim() === "completed",
  );
  const completedSum = completedOrders.reduce((acc, curr) => {
    const val = String(curr.amount || 0).replace(/[₹,]/g, "");
    return acc + (parseFloat(val) || 0);
  }, 0);
  const totalRevenueEl = document.getElementById("totalRevenueAmount");
  if (totalRevenueEl)
    totalRevenueEl.innerText = `₹${completedSum.toLocaleString("en-IN")}`;
}

// 🚀 3. Page load hote hi run karo
document.addEventListener("DOMContentLoaded", fetchOrders);

// 1. 🔥 SEARCH REFRESH (Zabardasti Table ko Reset karega)
window.clearSearchOnly = function () {
  console.log("🔄 Force Resetting Search...");
  const searchInput = document.getElementById("courseSearch");
  if (searchInput) searchInput.value = "";

  const tableBody =
    document.getElementById("adminProductList") ||
    document.getElementById("adminOrderList");
  if (tableBody) {
    const rows = tableBody.getElementsByTagName("tr");
    for (let row of rows) {
      if (row.id !== "noDataRow") {
        row.style.setProperty("display", "", "important"); // 🔥 Browser ko force dikhao
      }
    }
    const noData = document.getElementById("noDataRow");
    if (noData) noData.style.setProperty("display", "none", "important");
  }
};

// 2. 🔥 RESET ALL FILTERS (Date + Search)
window.resetAllFilters = function () {
  console.log("🧹 Resetting Dates Only...");

  // 1. 🔥 FIX: Search ko mat chhodo, sirf Dates saaf karo
  if (document.getElementById("startDate"))
    document.getElementById("startDate").value = "";
  if (document.getElementById("endDate"))
    document.getElementById("endDate").value = "";

  const tableBody =
    document.getElementById("adminProductList") ||
    document.getElementById("adminOrderList");

  if (tableBody) {
    const rows = tableBody.getElementsByTagName("tr");
    const searchText =
      document.getElementById("courseSearch")?.value.toLowerCase() || "";

    for (let row of rows) {
      if (row.id !== "noDataRow") {
        const rowText = row.innerText.toLowerCase();

        // 🚀 SMART CHECK: Agar search bar mein kuch likha hai,
        // toh sirf wahi rows dikhao jo search se match karti hain.
        if (rowText.includes(searchText)) {
          row.style.setProperty("display", "", "important");
        } else {
          row.style.setProperty("display", "none", "important");
        }
      }
    }

    // No Data message handle karo
    const noData = document.getElementById("noDataRow");
    if (noData) noData.style.setProperty("display", "none", "important");
  }

  console.log("✅ Dates cleared. Search filter preserved!");
};

// 📡 3. FETCH ORDERS FROM BACKEND
async function fetchOrders() {
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/orders`, {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const orders = await res.json();

    renderOrderTable(orders);
    updateOrderStats(orders);
  } catch (err) {
    console.error("❌ Order Fetch Error:", err);
  }
}

// 📝 4. RENDER TABLE
function renderOrderTable(orders) {
  const body = document.getElementById("adminOrderList");
  if (!body) return;

  // 1. Pehle pura data render karo
  body.innerHTML = orders
    .map(
      (o) => `
        <tr>
            <td>${new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
            <td><b>${o.customerName || "User"}</b><br><small>${o.customerEmail}</small></td>
           <td>
    <b>${o.productName}</b>
    <br>
    <small class="obj-id" style="color: #666;">
        ID: ${o.productId?._id || o.productId || "N/A"}
    </small>
</td>
            <td style="color:#00ffcc; font-weight:bold;">₹${o.amount}</td>
            <td>${o.sellerName}<br><small>${o.sellerEmail}</small></td>
            <td><span class="status-success">SUCCESS</span></td>
            <td><button class="btn-sm btn-details" onclick="viewOrder('${o._id}')">DETAILS</button></td>
        </tr>
    `,
    )
    .join("");

  // 🔥 FIX: Render khatam hone ke baad "No Data" row ko wapas dalo
  const noDataHTML = `
    <tr id="noDataRow" style="display: none !important;">
        <td colspan="7" style="padding: 100px 0; text-align: center; vertical-align: middle; background: transparent; border: none;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i class="fas fa-search-minus" style="font-size: 50px; color: #ff4757; margin-bottom: 20px;"></i>
               <h2 style="font-size: 20px; color: #fff; margin:0; font-weight: 600; letter-spacing: 0.5px;">
    No Results Found 🔍
</h2>
<p style="color: #64748b; font-size: 14px; margin-top: 8px;">
    We couldn't find any orders matching your search. Please check the email or date range.
</p>

            </div>
        </td>
    </tr>`;

  body.insertAdjacentHTML("beforeend", noDataHTML);
}

// 📂 5. CSV DOWNLOAD (Excel File) Admin course managment pannel
async function downloadCSV() {
  // 1. Ask for Confirmation
  const result = await Swal.fire({
    title: "Download Report?",
    text: "Do you want to export this table to a CSV file?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745", // Green for download
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Export!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      // 2. Show a quick processing alert
      Swal.fire({
        title: "Generating CSV...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const table = document.querySelector(".master-table");
      let csv = [];

      // Extract Header and Data rows
      for (let i = 0; i < table.rows.length; i++) {
        let row = [],
          cols = table.rows[i].cells;
        for (let j = 0; j < cols.length; j++) {
          row.push(
            `"${cols[j].innerText.replace(/\n/g, " ").replace(/"/g, '""')}"`,
          );
        }
        csv.push(row.join(","));
      }

      // Create CSV File
      const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `BR30_Elite_Course_Report_${new Date().toLocaleDateString()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 3. Success Toast (Top-right notification)
      Swal.fire({
        icon: "success",
        title: "Report Downloaded!",
        text: "CSV file has been saved to your device.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (error) {
      console.error("Export Error:", error);
      Swal.fire("Error", "Something went wrong while exporting.", "error");
    }
  }
}

//#region PDF Template - Sales & Orders Ledger
async function downloadtoPDF() {
  // 1. Initial Confirmation
  const confirmResult = await Swal.fire({
    title: "Generate PDF Report?",
    text: "This will create a professional Sales Ledger in Landscape mode.",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Download",
    cancelButtonText: "Cancel",
  });

  if (!confirmResult.isConfirmed) return;

  // 2. Show Loading Spinner
  Swal.fire({
    title: "Generating PDF...",
    text: "Please wait while we prepare your sales report.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const { jsPDF } = window.jspdf;
    // 📄 Landscape mode 'l' taaki saare columns fit ho jayein
    const doc = new jsPDF("l", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const logoUrl = "../images/BR30™  LOGO.jpeg";
    try {
      doc.addImage(logoUrl, "JPEG", pageWidth - 110, 25, 70, 50);
    } catch (e) {
      console.warn("Logo miss ho gaya!");
    }

    // --- 1. HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Blue Color
    doc.setFont("helvetica", "bold");
    doc.text("BR30 TRADER ACADEMY", 40, 50);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL SALES LEDGER & TRANSACTION HISTORY REPORT", 40, 68);
    doc.line(40, 85, pageWidth - 40, 85);

    // --- 2. TABLE HEADER (Matched to your Order Tracker) ---
    doc.setFillColor(59, 130, 246);
    doc.rect(40, 100, pageWidth - 80, 28, "F");

    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");

    doc.text("Sale Date", 50, 118);
    doc.text("Student Detail", 130, 118);
    doc.text("Course Name", 300, 118);
    doc.text("Price (Rs.)", 500, 118);
    doc.text("Seller Info", 600, 118);
    doc.text("Status", 750, 118);

    // --- 3. DATA ROWS ---
    const tableBody = document.querySelector("#adminOrderList");
    if (!tableBody) {
      Swal.fire("Error", "Order table not found in the DOM!", "error");
      return;
    }

    const rows = tableBody.querySelectorAll("tr");
    let y = 145;

    rows.forEach((tr) => {
      const tds = tr.querySelectorAll("td");

      if (
        tds.length >= 6 &&
        tr.style.display !== "none" &&
        tr.id !== "noDataRow"
      ) {
        if (y > pageHeight - 80) {
          addFooter(doc, pageWidth, pageHeight);
          doc.addPage();
          y = 50;
        }

        const saleDate = tds[0].innerText.trim();
        const student = tds[1].innerText.split("\n")[0].trim();
        const course = tds[2].innerText.split("\n")[0].trim();

        const priceRaw = tds[3].innerText.trim();
        const price = priceRaw.replace("₹", "Rs. ");

        const seller = tds[4].innerText.split("\n")[0].trim();
        const status = tds[5].innerText.trim().toUpperCase();

        doc.setFontSize(8);
        doc.setTextColor(50);
        doc.setFont("helvetica", "normal");

        doc.text(saleDate, 50, y);
        doc.text(student.substring(0, 25), 130, y);

        doc.setFont("helvetica", "bold");
        doc.text(course.substring(0, 35), 300, y);

        doc.setFont("helvetica", "normal");
        doc.text(price, 500, y);
        doc.text(seller.substring(0, 25), 600, y);

        if (status.includes("SUCCESS") || status.includes("COMPLETED")) {
          doc.setTextColor(5, 150, 105);
        } else {
          doc.setTextColor(217, 119, 6);
        }
        doc.setFont("helvetica", "bold");
        doc.text(status, 750, y);

        doc.setDrawColor(240);
        doc.line(40, y + 12, pageWidth - 40, y + 12);
        y += 28;
      }
    });

    addFooter(doc, pageWidth, pageHeight);
    doc.save(`BR30_Elite_Sales_Report_${Date.now()}.pdf`);

    // 3. Success Notification
    Swal.fire({
      icon: "success",
      title: "Report Ready!",
      text: "Your sales report has been downloaded successfully.",
      timer: 2500,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  } catch (error) {
    console.error("PDF Error:", error);
    Swal.fire(
      "Failed",
      "Could not generate PDF. Check console for details.",
      "error",
    );
  }
}
function addFooter(doc, pageWidth, pageHeight) {
  const dateStr = new Date().toLocaleString("en-IN");
  doc.setDrawColor(230, 230, 230);
  doc.line(40, pageHeight - 60, pageWidth - 40, pageHeight - 60);

  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer-generated Sales Report from BR30 Master Admin Panel.",
    40,
    pageHeight - 45,
  );

  doc.setFont("helvetica", "normal");
  doc.text(`Report Generated On: ${dateStr}`, 40, pageHeight - 32);

  const pageNo = doc.internal.getNumberOfPages();
  doc.text(`Page ${pageNo}`, pageWidth - 60, pageHeight - 32);
}

//#endregion

// 🔥 VIEW ORDER DETAILS POPUP
window.viewOrder = async function (orderId) {
  console.log("🧐 Viewing Order Details for ID:", orderId);

  // 1. Loading dikhao
  Swal.fire({
    title: "Fetching Details...",
    background: "#0a0a0a",
    color: "#fff",
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 2. Backend se specific order ka data lao (Aapka API route)
    // Agar aapke paas poora data 'orders' array mein pehle se hai, toh find use karo:
    // const order = allOrdersArray.find(o => o._id === orderId);

    const res = await fetch(
      `${CONFIG.BASE_API_URL}/admin/order-details/${orderId}`,
      {
        headers: { "x-auth-token": localStorage.getItem("token") },
      },
    );
    const order = await res.json();

    if (!res.ok) throw new Error("Order details nahi mili!");

    // 3. Ek makkhan jaisa SweetAlert Popup dikhao
    Swal.fire({
      title: `<span style="color: #00ffcc;">Order Details</span>`,
      html: `
                <div style="text-align: left; font-size: 14px; color: #cbd5e1; line-height: 1.8;">
                    <p><b>Order ID:</b> <span style="color:#94a3b8;">${order._id}</span></p>
                    <p><b>Transaction ID:</b> <span style="color:#94a3b8;">${order.transactionId || "N/A"}</span></p>
                    <hr style="border: 0.5px solid #1e293b; margin: 15px 0;">
                    <p><b>Student:</b> ${order.customerName}</p>
                    <p><b>Email:</b> ${order.customerEmail}</p>
                    <p><b>Course:</b> ${order.productName}</p>
                    <p><b>Amount Paid:</b> <span style="color:#00ffcc; font-weight:bold;">₹${order.amount}</span></p>
                    <p><b>Seller:</b> ${order.sellerName}</p>
                    <p><b>Date:</b> ${new Date(order.createdAt).toLocaleString("en-IN")}</p>
                    <p><b>Payout Status:</b> <span style="color:${order.payoutStatus === "completed" ? "#22c55e" : "#f59e0b"}">${order.payoutStatus.toUpperCase()}</span></p>
                </div>
            `,
      background: "#0f172a",
      confirmButtonColor: "#007bff",
      confirmButtonText: "Close",
      customClass: {
        popup: "premium-popup-border",
      },
    });
  } catch (err) {
    console.error("❌ View Order Error:", err);
    Swal.fire({
      icon: "error",
      title: "Lafda Ho Gaya!",
      text: "Details load nahi ho pa rahi hain.",
      background: "#0a0a0a",
      color: "#fff",
    });
  }
};

// over view btn click ligic
// 1. Sidebar Buttons Navigation
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    // Active class toggle
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");

    const target = this.getAttribute("data-target");

    // 🔥 Navigation Logic
    if (target === "overview") {
      // Overview के लिए अगर कोई loadOverview है तो वो कॉल कर, नहीं तो reload/stats call कर
      loadDashboardStats();
    } else if (target === "payouts") {
      // ✅ सबसे पहले Payout का HTML ढांचा बनाओ (जो तूने ऊपर भेजा है)
      loadPayouts(7);
      console.log("🚀 Friday Payouts Structure Loaded!");
    } else if (target === "student") {
      loadUsers("student");
    } else if (target === "seller") {
      loadUsers("seller");
    } else if (target === "vip") {
      loadVIPs();
    } else if (target === "requests") {
      loadSellerRequests();
    }
  });
});
