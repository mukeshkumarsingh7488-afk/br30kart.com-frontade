//#region
(async function protectPage() {
  const role = localStorage.getItem("userRole");
  const allowed = ["admin", "seller"];
  if (!allowed.includes(role)) {
    document.documentElement.style.display = "none";
    await Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "Security Alert: This section is reserved for Authorized Admins & Sellers only.",
      footer: "Unauthorised access attempt has been logged.",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#d33",
      confirmButtonText: "Exit Now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
    window.location.href = "../index.html";
  }
})();

const BASE_URL = CONFIG.BASE_API_URL;
let allOrdersData = [];

document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("sellerEmail") || "";
  loadSalesData(email);
});

function getStatusClass(status) {
  const s = (status || "").toString().toLowerCase().trim();
  if (s === "success" || s === "completed") return "status-success";
  if (s === "pending") return "status-pending";
  return "status-failed";
}

async function loadSalesData(email) {
  if (!email) return;
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/seller/sales-records?sellerEmail=${email}`);
    const result = await response.json();
    if (result.success) {
      allOrdersData = result.data.orders;
      applyFilters();
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

function applyFilters() {
  console.log("🔥 applyFilters RUN ho raha hai");
  const searchTerm = document.getElementById("courseSearch").value.toLowerCase();
  const fromDate = document.getElementById("startDate").value;
  const toDate = document.getElementById("endDate").value;
  const tableBody = document.getElementById("salesTableBody");
  let filtered = allOrdersData.filter((order) => {
    const matchesSearch = (order.productName || "").toLowerCase().includes(searchTerm);
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    const matchesDate = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
    return matchesSearch && matchesDate;
  });
  let totalRevenue = 0;
  let pendingAmount = 0;
  filtered.forEach((order) => {
    const amt = Number(order.amount) || 0;
    totalRevenue += amt;
    const pStatus = (order.payoutStatus || "").toString().toLowerCase().trim();
    if (pStatus === "pending") {
      pendingAmount += amt * 0.8;
    }
  });
  if (document.getElementById("totalRevenue")) document.getElementById("totalRevenue").innerText = `₹${totalRevenue.toLocaleString()}`;
  if (document.getElementById("sellerPayout")) document.getElementById("sellerPayout").innerText = `₹${(totalRevenue * 0.8).toLocaleString()}`;
  if (document.getElementById("platformFee")) document.getElementById("platformFee").innerText = `₹${(totalRevenue * 0.2).toLocaleString()}`;
  if (document.getElementById("pendingAmount")) document.getElementById("pendingAmount").innerText = `₹${pendingAmount.toLocaleString()}`;
  tableBody.innerHTML = "";
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found. 📂</td></tr>`;
    return;
  }
  let html = "";
  filtered.forEach((order, i) => {
    console.log("👉 FULL ORDER:", order);
    console.log("🆔 orderId:", order.orderId);
    console.log("🆔 orderID:", order.orderID);
    console.log("🆔 _id:", order._id);
    const displayOrderID = order?.orderId || order?.orderID || (order?._id ? order._id.toString().slice(-6).toUpperCase() : "N/A");
    const pStat = (order?.payoutStatus || "pending").toLowerCase();
    const sStat = (order?.status || "pending").toLowerCase();
    const getSStatColor = (s) => (s === "success" ? "text-green-400 bg-green-400/10 border-green-400/20" : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20");
    const getPStatColor = (p) => (p === "completed" ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : "text-orange-400 bg-orange-400/10 border-orange-400/20");
    html += `
      <tr class="group hover:bg-[#0f172a] transition-all duration-300 border-b border-[#1e293b]">
        <!-- 📅 Date -->
        <td class="px-6 py-5">
          <div class="text-xs text-gray-500 font-mono">
            ${
              order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"
            }
          </div>
        </td>
        <!-- 📚 Course + ID -->
        <td class="px-6 py-5">
          <div class="flex flex-col">
            <span class="font-bold text-slate-100 text-sm">
              ${order?.productName || "N/A"}
            </span>
            <span class="text-[10px] font-black text-slate-500 mt-1">
              #${displayOrderID}
            </span>
          </div>
        </td>
        <!-- 👤 Student -->
        <td class="px-6 py-5">
          <span class="text-sm text-slate-300 italic">
            ${order?.customerName || "Guest User"}
          </span>
        </td>
        <!-- 💳 Payment -->
        <td class="px-6 py-5">
          <span class="px-3 py-1 rounded-full text-[10px] font-black border ${getSStatColor(sStat)}">
            ${sStat}
          </span>
        </td>
        <!-- 💰 Amount -->
        <td class="px-6 py-5 text-right">
          <span class="text-sm font-black text-white">
            ₹${Number(order?.amount || 0).toLocaleString("en-IN")}
          </span>
        </td>
        <!-- 🏦 Payout -->
        <td class="px-6 py-5 text-center">
          <span class="px-3 py-1 rounded-md text-[9px] font-extrabold border ${getPStatColor(pStat)}">
            ${pStat}
          </span>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

function resetFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("courseSearch").value = "";
  applyFilters();
}

async function exportCSV() {
  const table = document.querySelector("table");
  if (!table || table.rows.length <= 1) {
    return Swal.fire({
      icon: "warning",
      title: "No Data Found",
      text: "There is no table data available to export! 📊",
      background: "#111827",
      color: "#fff",
    });
  }
  const result = await Swal.fire({
    title: "Download CSV?",
    text: "Do you want to export this sales record to a CSV file?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Download",
    background: "#111827",
    color: "#fff",
  });
  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: "Generating CSV...",
        background: "#111827",
        color: "#fff",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      let csv = [];
      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        let cols = row.querySelectorAll("td, th");
        let rowData = [];
        cols.forEach((col) => {
          let text = col.innerText.replace(/"/g, '""').replace(/\n/g, " ");
          rowData.push(`"${text}"`);
        });
        csv.push(rowData.join(","));
      });
      const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
      const downloadLink = document.createElement("a");
      const fileName = `BR30_Elite_Sales_Record_${new Date().toISOString().split("T")[0]}.csv`;
      downloadLink.download = fileName;
      downloadLink.href = window.URL.createObjectURL(csvFile);
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      Swal.fire({
        icon: "success",
        title: "Export Successful!",
        text: "The CSV file has been saved to your device.",
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
        text: "Something went wrong while generating the CSV.",
        background: "#111827",
        color: "#fff",
      });
    }
  }
}

document.getElementById("courseSearch")?.addEventListener("input", loadSalesData);
window.onload = loadSalesData;

let allDataSales = [];

window.onload = loadSalesData;

async function loadSalesData() {
  const email = localStorage.getItem("sellerEmail");
  if (!email) return;
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/seller/sales-records?sellerEmail=${email}`);
    const result = await response.json();
    if (result.success) {
      allDataSales = result.data.orders;
      applyFilters();
    }
  } catch (err) {
    console.error("DB Load Error:", err);
  }
}

function applyFilters() {
  const tableBody = document.getElementById("salesTableBody");
  const searchInput = document.getElementById("courseSearch");
  const fromInput = document.getElementById("startDate");
  const toInput = document.getElementById("endDate");
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const from = fromInput ? fromInput.value : "";
  const to = toInput ? toInput.value : "";
  let filtered = allDataSales.filter((item) => {
    const matchesSearch = (item.productName || "").toLowerCase().includes(searchTerm);
    if (!from && !to) return matchesSearch;
    const d = new Date(item.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const saleDateStr = `${year}-${month}-${day}`;
    const matchesDate = (!from || saleDateStr >= from) && (!to || saleDateStr <= to);
    return matchesSearch && matchesDate;
  });
  let totalRevenue = 0;
  let totalEarnings = 0;
  let platformFee = 0;
  let pendingAmount = 0;
  filtered.forEach((order) => {
    const amt = Number(order.amount) || 0;
    const comm = Number(order.platformCommission) || 0;
    const earn = Number(order.sellerEarnings) || 0;
    totalRevenue += amt;
    platformFee += comm;
    totalEarnings += earn;
    const pStat = (order.payoutStatus || "").toString().toLowerCase().trim();
    if (pStat === "pending") {
      pendingAmount += earn;
    }
  });
  const updateText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  updateText("totalRevenue", `₹${totalRevenue.toLocaleString()}`);
  updateText("sellerPayout", `₹${totalEarnings.toLocaleString()}`);
  updateText("platformFee", `₹${platformFee.toLocaleString()}`);
  updateText("pendingAmount", `₹${pendingAmount.toLocaleString()}`);
  tableBody.innerHTML = "";
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found. 📂</td></tr>`;
    return;
  }
  filtered.forEach((order) => {
    const payStatus = (order.status || "").toLowerCase().trim();
    const payoutStatus = (order.payoutStatus || "").toLowerCase().trim();
    const payClass = payStatus === "success" ? "status-success" : "status-pending";
    const payoutClass = payoutStatus === "completed" ? "status-success" : "status-pending";
    tableBody.innerHTML += `
      <tr class="hover:bg-[#0a0c10] transition border-b border-[#1f2937]">
    <!-- 1. Sale Date -->
    <td class="px-6 py-4 text-xs text-gray-500 font-medium">
        ${new Date(order.createdAt).toLocaleDateString("en-GB")}
    </td>
    <!-- 2. Course Title & ID -->
    <td class="px-6 py-4 text-sm uppercase">
        <div class="font-bold text-white">${order.productName}</div>
        <!-- ✅ Course ID added right below the Title -->
      <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">
    Order ID: ${order.orderId || "N/A"}
</div>
    </td>
    <!-- 3. Student Name -->
    <td class="px-6 py-4 text-sm text-blue-400 font-semibold">
        ${order.customerName || "N/A"}
    </td>
    <!-- 4. Payment Status -->
    <td class="px-6 py-4">
        <span class="badge ${payClass}">${order.status}</span>
    </td>
    <!-- 5. Amount -->
    <td class="px-6 py-4 font-black text-white text-right">
        ₹${Number(order.amount).toLocaleString()}
    </td>
    <!-- 6. Payout Status -->
    <td class="px-6 py-4 text-center">
        <span class="badge ${payoutClass}">${order.payoutStatus}</span>
    </td>
</tr>
        `;
  });
}

function resetFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("courseSearch").value = "";
  applyFilters();
}

function downloadPDF() {
  window.print();
}

//#region pdf
async function exportToPDF() {
  const confirmResult = await Swal.fire({
    title: "Generate Payout Report?",
    text: "This will create a professional 6-column sales ledger in Landscape mode.",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Download PDF",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#fff",
  });
  if (!confirmResult.isConfirmed) return;
  Swal.fire({
    title: "Processing Report...",
    text: "Please wait while we prepare your transaction history.",
    allowOutsideClick: false,
    background: "#111827",
    color: "#fff",
    didOpen: () => {
      Swal.showLoading();
    },
  });
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoUrl = "../https://i.ibb.co/KxnQc4gx/BR30-LOGO1.png";
    try {
      doc.addImage(logoUrl, "JPEG", pageWidth - 110, 25, 70, 50);
    } catch (e) {
      console.warn("Logo mission, skipping image rendering...");
    }
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.setFont("helvetica", "bold");
    doc.text("BR30 TRADER ACADEMY", 40, 50);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL PAYOUT & SALES HISTORY REPORT", 40, 68);
    doc.line(40, 85, pageWidth - 40, 85);
    doc.setFillColor(59, 130, 246);
    doc.rect(40, 100, pageWidth - 80, 28, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("Sale Date", 50, 118);
    doc.text("Course Title", 140, 118);
    doc.text("Student Name", 310, 118);
    doc.text("Payment Status", 460, 118);
    doc.text("Amount", 580, 118);
    doc.text("Payout (80%)", 700, 118);
    const tableBody = document.getElementById("salesTableBody");
    if (!tableBody) throw new Error("Table body 'salesTableBody' not found!");
    const rows = tableBody.querySelectorAll("tr");
    let y = 145;
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length >= 5) {
        if (y > pageHeight - 80) {
          addFooter(doc, pageWidth, pageHeight);
          doc.addPage();
          y = 50;
        }
        const date = tds[0].innerText.trim();
        const title = tds[1].innerText.trim().toUpperCase();
        const Student = tds[2].innerText.trim();
        const pStatus = tds[3].innerText.trim().toUpperCase();
        const amount = tds[4].innerText.replace("₹", "Rs. ").trim();
        const payoutValue = "Rs. " + (parseFloat(amount.replace("Rs. ", "").replace(",", "")) * 0.8 || 0).toLocaleString();
        doc.setFontSize(8);
        doc.setTextColor(50);
        doc.setFont("helvetica", "normal");
        doc.text(date, 50, y);
        doc.setFont("helvetica", "bold");
        doc.text(title.substring(0, 30), 140, y);
        doc.setFont("helvetica", "normal");
        doc.text(Student.substring(0, 25), 310, y);
        doc.setTextColor(5, 150, 105);
        doc.text(pStatus, 460, y);
        doc.setTextColor(50);
        doc.text(amount, 580, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246);
        doc.text(payoutValue, 700, y);
        doc.setDrawColor(240);
        doc.line(40, y + 12, pageWidth - 40, y + 12);
        y += 28;
      }
    });
    addFooter(doc, pageWidth, pageHeight);
    doc.save(`BR30_Elite_Sales_Report_${Date.now()}.pdf`);
    Swal.fire({
      icon: "success",
      title: "Report Downloaded!",
      text: "The 6-column sales ledger is ready 📄",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
      background: "#111827",
      color: "#fff",
    });
  } catch (error) {
    console.error("PDF Export Error:", error);
    Swal.fire({
      icon: "error",
      title: "Export Failed",
      text: error.message || "Something went wrong during PDF generation.",
      background: "#111827",
      color: "#fff",
    });
  }
}
function addFooter(doc, pageWidth, pageHeight) {
  const date = new Date().toLocaleString("en-GB");
  doc.setDrawColor(230, 230, 230);
  doc.line(40, pageHeight - 60, pageWidth - 40, pageHeight - 60);
  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated report. No physical signature is required.", 40, pageHeight - 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Date: ${date}`, 40, pageHeight - 32);
  const pageNo = doc.internal.getNumberOfPages();
  doc.text(`Page ${pageNo} | BR30 TRADER OFFICIAL`, pageWidth - 150, pageHeight - 32);
}

//#endregion
//#endregion
