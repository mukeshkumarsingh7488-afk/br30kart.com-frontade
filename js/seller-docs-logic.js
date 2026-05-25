//#region
(async function protectPage() {
  const role = localStorage.getItem("userRole");
  const allowed = ["admin", "seller"];
  if (!allowed.includes(role)) {
    document.documentElement.style.display = "none";
    alert("🚨 ACCESS DENIED: Only Admin & Sellers Allowed!");
    window.location.href = "/";
  }
})();

document.addEventListener("DOMContentLoaded", fetchAllSellers);

async function fetchAllSellers() {
  const tableBody = document.getElementById("sellerTableBody");
  tableBody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding:30px;'>Loading Documents... ⏳</td></tr>";
  try {
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/all-sellers-docs`);
    const responseData = await res.json();
    if (responseData.success) {
      const allSellers = [...responseData.sellers, ...responseData.requests];
      if (allSellers.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='11' style='text-align:center; padding:30px;'>No sellers found.</td></tr>";
        return;
      }
      renderTable(allSellers);
    } else {
      throw new Error("Backend ne success false bheja");
    }
  } catch (err) {
    console.error("🔥 Fetch Error:", err);
    tableBody.innerHTML = `<tr><td colspan='11' style='text-align:center; color:red; padding:30px;'>Server Error! (${err.message})</td></tr>`;
  }
}

function renderTable(sellers) {
  const tableBody = document.getElementById("sellerTableBody");
  tableBody.innerHTML = sellers
    .map((seller) => {
      const isApproved = seller.isApproved;
      return `
        <tr class="seller-row">
            <td><b>${seller.name}</b></td>
            <td class="seller-email">${seller.email}</td>
            <!-- STATUS COLUMN -->
            <td>
                <span style="color: ${isApproved ? "#2ecc71" : "#e74c3c"}; font-weight:bold;">
                    ${isApproved ? "Approved ✅" : "Pending ⏳"}
                </span>
            </td>
            <td>${seller.kycDetails?.aadharNo || "N/A"}</td>
            <td><a href="${seller.kycDetails?.aadharFront}" target="_blank"><img src="${seller.kycDetails?.aadharFront}" class="doc-preview" style="width:50px; border-radius:4px;"></a></td>
            <td><a href="${seller.kycDetails?.aadharBack}" target="_blank"><img src="${seller.kycDetails?.aadharBack}" class="doc-preview" style="width:50px; border-radius:4px;"></a></td>
            <td>${seller.bankDetails?.bankName || "N/A"}</td>
            <td>${seller.bankDetails?.accountNo || "N/A"}</td>
            <td>${seller.bankDetails?.ifscCode || "N/A"}</td>
            <td><a href="${seller.bankDetails?.bankDoc}" target="_blank" style="color: #a020f0;"><i class="fas fa-eye"></i> View</a></td>
            <td style="display: flex; gap: 8px;">
                ${
                  isApproved
                    ? `<!-- UNVERIFY BUTTON (Sirf tab dikhega jab approved ho) -->
                    <button onclick="toggleVerification('${seller._id}')" 
                            style="background: #f39c12; border:none; padding:8px 12px; border-radius:6px; color:#fff; cursor:pointer;">
                        <i class="fas fa-undo"></i> Unverify
                    </button>`
                    : `<!-- APPROVE BUTTON (Sirf tab dikhega jab approved NA ho) -->
                    <button onclick="toggleVerification('${seller._id}')" 
                            style="background: #238636; border:none; padding:8px 12px; border-radius:6px; color:#fff; cursor:pointer;">
                        <i class="fas fa-check"></i> Approve
                    </button>`
                }
                <!-- REJECT BUTTON (Hamesha dikhega) -->
                <button onclick="openRejectModal('${seller._id}', '${seller.email}')" 
                        style="background: #da3633; border:none; padding:8px 12px; border-radius:6px; color:#fff; cursor:pointer;">
                    <i class="fas fa-times"></i> Reject
                </button>
            </td>
        </tr>
        `;
    })
    .join("");
}

async function toggleVerification(userId, currentStatus) {
  const isActive = currentStatus === true || currentStatus === "active" || currentStatus === "approved" || currentStatus === "Approved";

  const actionText = isActive ? "deactivate" : "activate";
  const themeColor = isActive ? "#d33" : "#28a745";

  const result = await Swal.fire({
    title: "Update Seller Status?",
    text: `Are you sure you want to ${actionText} this seller?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: themeColor,
    cancelButtonColor: "#6e7881",
    confirmButtonText: `Yes, ${actionText}!`,
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    Swal.fire({
      title: "Updating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/toggle-seller-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      throw new Error(data.message || data.msg || "Server responded with an error");
    }

    await Swal.fire({
      title: "Success!",
      text: data.msg || `Seller status has been ${actionText}d.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchAllSellers();
  } catch (err) {
    console.error("Toggle Error:", err);
    Swal.fire("Update Failed", err.message || "Could not update status. Please try again.", "error");
  }
}

async function rejectSeller(userId, email) {
  const { value: reason } = await Swal.fire({
    title: "Reject Seller",
    input: "textarea",
    inputLabel: "Reason for Rejection",
    inputPlaceholder: "Write the reason here (e.g., Aadhar Card not clear)...",
    inputAttributes: {
      "aria-label": "Type your reason here",
    },
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Send Rejection & Email",
    cancelButtonText: "Cancel",
    inputValidator: (value) => {
      if (!value) {
        return "You need to provide a reason for rejection!";
      }
    },
  });
  if (!reason) return;
  try {
    Swal.fire({
      title: "Processing Rejection...",
      text: "Sending email to the seller...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const res = await fetch(`${CONFIG.BASE_API_URL}/admin/reject-seller`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email, reason }),
    });
    if (res.ok) {
      console.log("✅ Seller rejected and email sent");
      Swal.fire({
        title: "Seller Rejected! ❌",
        text: "The rejection email has been sent successfully.",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
      });
      fetchAllSellers();
    } else {
      throw new Error("Failed to process rejection on server.");
    }
  } catch (err) {
    console.error("❌ Rejection Error:", err);
    Swal.fire({
      title: "Error!",
      text: "Something went wrong while rejecting the seller.",
      icon: "error",
    });
  }
}

let currentSellerId = "";
let currentSellerEmail = "";
window.openRejectModal = async function (id, email) {
  const { value: selectedReasons } = await Swal.fire({
    title: "Select Rejection Reasons",
    html: `
      <div id="swal-reason-options" style="text-align: left; font-size: 14px; padding: 10px;">
        <label><input type="checkbox" value="Aadhar Card not clear" class="swal-cb"> Aadhar Card is not clear</label><br><br>
        <label><input type="checkbox" value="Invalid Bank Details" class="swal-cb"> Invalid Bank Details</label><br><br>
        <label><input type="checkbox" value="Profile Picture missing" class="swal-cb"> Profile Picture is missing</label><br><br>
        <label><input type="checkbox" value="Suspicious Activity" class="swal-cb"> Suspicious Activity detected</label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Confirm Rejection",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const checked = Array.from(document.querySelectorAll(".swal-cb:checked")).map((cb) => cb.value);
      if (checked.length === 0) {
        Swal.showValidationMessage("Please select at least one reason!");
      }
      return checked.join(" | ");
    },
  });
  if (selectedReasons) {
    try {
      Swal.fire({
        title: "Processing...",
        text: "Rejecting seller and sending email notification.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const res = await fetch(`${CONFIG.BASE_API_URL}/admin/reject-seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          email: email,
          reason: selectedReasons,
        }),
      });
      if (res.ok) {
        await Swal.fire({
          title: "Rejected! ❌",
          text: "Seller has been rejected and the email was sent.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        location.reload();
      } else {
        Swal.fire("Failed", "Rejection request failed on server.", "error");
      }
    } catch (err) {
      console.error("Connection Error:", err);
      Swal.fire("Error", "Could not connect to the server.", "error");
    }
  }
};

function searchSeller() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll(".seller-row");
  rows.forEach((row) => {
    const email = row.querySelector(".seller-email").innerText.toLowerCase();
    row.style.display = email.includes(input) ? "" : "none";
  });
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  const tbody = document.getElementById("sellerTableBody");
  const rows = tbody.getElementsByTagName("tr");
  input.value = "";
  for (let i = 0; i < rows.length; i++) {
    rows[i].style.display = "";
  }
  if (typeof loadSellerTracker === "function") {
    loadSellerTracker();
  }
  input.focus();
}
//#endregion
