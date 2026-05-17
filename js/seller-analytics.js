//#region
function protectSellerDashboard() {
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");
  console.log(`🛡️ Security Check: Role is [${userRole}]`);
  if (!userEmail) {
    window.location.href = "login.html";
    return;
  }
  const allowedRoles = ["admin", "seller"];
  if (!allowedRoles.includes(userRole)) {
    Swal.fire({
      icon: "error",
      title: "Access Denied! 🚫",
      text: "Bhai, ye dashboard sirf Sellers aur Admin ke liye hai. Students allow nahi hain!",
      background: "#111827",
      color: "#fff",
      confirmButtonText: "Wapas Jao",
      confirmButtonColor: "#3b82f6",
    }).then(() => {
      window.location.href = "index.html";
    });
    document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Unauthorized Access... redirecting...</h1>";
  }
}
protectSellerDashboard();

async function fetchAnalyticsData() {
  const tableBody = document.getElementById("analyticsTableBody");
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData || !userData.email) {
    alert("Session Expired! Please login again.");
    window.location.href = "login.html";
    return;
  }
  const sellerEmail = userData.email;
  const start = document.getElementById("startDate")?.value || "";
  const end = document.getElementById("endDate")?.value || "";
  if (typeof CONFIG === "undefined") {
    console.error("🔥 Error: config.js nahi mila!");
    return;
  }
  var finalUrl = CONFIG.BASE_API_URL + "/seller/analytics?email=" + sellerEmail + "&start=" + start + "&end=" + end;
  console.log("🚀 Requesting URL:", finalUrl);
  try {
    const response = await fetch(finalUrl);
    const data = await response.json();
    if (data.success) {
      document.getElementById("totalRevenue").innerText = "₹" + (data.summary.totalRevenue || 0);
      document.getElementById("sellerProfit").innerText = "₹" + (data.summary.sellerProfit || 0);
      document.getElementById("pendingPayout").innerText = "₹" + (data.summary.pendingAmount || 0);
      document.getElementById("adminFee").innerText = "₹" + (data.summary.adminFee || 0);
      if (tableBody) {
        tableBody.innerHTML = "";
      }
      if (typeof renderTable === "function") {
        renderTable(data.sales);
      } else {
        console.warn("⚠️ renderTable function nahi mila, data table mein nahi dikhega!");
      }
      console.log("✅ Data Loaded Successfully");
    }
  } catch (err) {
    console.error("🔥 Fetch Error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAnalyticsData();
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) {
    filterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fetchAnalyticsData();
    });
  } else {
    console.warn("⚠️ Warning: HTML mein 'filterBtn' ID wala button nahi mila!");
  }
});

window.loadSection = function (type) {
  console.log(`🚀 Switching to section: ${type}`);
  document.querySelectorAll(".side-btn").forEach((btn) => btn.classList.remove("active"));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }
  if (!window.allDataSales || window.allDataSales.length === 0) return;
  let filteredData = [];
  switch (type) {
    case "overview":
      filteredData = window.allDataSales;
      break;
    case "sales":
      filteredData = window.allDataSales.filter((s) => s.amount > 0);
      break;
    case "payouts":
      filteredData = window.allDataSales.filter((s) => s.payoutStatus);
      break;
    case "best-sellers":
      filteredData = [...window.allDataSales].sort((a, b) => b.amount - a.amount);
      break;
    default:
      filteredData = window.allDataSales;
  }
  renderTable(filteredData);
};

function renderTable(sales) {
  const tableBody = document.getElementById("analyticsTableBody");
  if (!tableBody) return;
  window.allDataSales = sales;
  if (!sales || sales.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found. 📂</td></tr>`;
    return;
  }
  tableBody.innerHTML = sales
    .map((sale) => {
      const status = (sale.payoutStatus || "Paid").toLowerCase();
      return `
      <tr>
          <td><b>${sale.customerName || "Student"}</b></td> 
          <td>${sale.productName || "Course"}</td>        
          <td>${new Date(sale.createdAt).toLocaleDateString("en-GB")}</td>
          <td>₹${sale.amount}</td>
          <td>
              <span class="status-badge ${status === "pending" ? "pending" : "paid"}">
                  ${sale.payoutStatus || "Paid"}
              </span>
          </td>
      </tr>
    `;
    })
    .join("");
}

function applyFilters() {
  fetchAnalyticsData();
}

function resetFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  fetchAnalyticsData();
}

async function exportCSV() {
  if (!window.allDataSales || window.allDataSales.length === 0) {
    return Swal.fire({
      icon: "error",
      title: "No Data Found",
      text: "Bhai, there is no sales data available to download!",
      background: "#0a0a0a",
      color: "#fff",
    });
  }
  const result = await Swal.fire({
    title: "Download CSV?",
    text: "Do you want to export the Sales Report to a CSV file?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Export!",
    cancelButtonText: "Cancel",
    background: "#0a0a0a",
    color: "#fff",
  });
  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: "Generating CSV...",
        background: "#0a0a0a",
        color: "#fff",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      let csvContent = "Student Name,Course Name,Date,Amount,Status\n";
      window.allDataSales.forEach((sale) => {
        const date = new Date(sale.createdAt).toLocaleDateString("en-GB");
        const student = (sale.customerName || "N/A").replace(/"/g, '""');
        const course = (sale.productName || "N/A").replace(/"/g, '""');
        const amount = sale.amount || "0";
        const status = sale.payoutStatus || "PENDING";
        csvContent += `"${student}","${course}","${date}","${amount}","${status}"\n`;
      });
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `BR30_Elite_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Swal.fire({
        icon: "success",
        title: "Export Successful!",
        text: "Sales report has been saved.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch (error) {
      console.error("Export Error:", error);
      Swal.fire("Error", "Something went wrong during export.", "error");
    }
  }
}

//#region pdf
async function exportToPDF() {
  const confirmResult = await Swal.fire({
    title: "Export Sales History?",
    text: "Do you want to generate a professional PDF report of the sales history?",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Export",
    cancelButtonText: "Cancel",
    background: "#0a0a0a",
    color: "#fff",
  });
  if (!confirmResult.isConfirmed) return;
  Swal.fire({
    title: "Generating PDF...",
    text: "Please wait while we align the data rows.",
    background: "#0a0a0a",
    color: "#fff",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoUrl = "../images/BR30™%20%20LOGO.jpeg";
    try {
      doc.addImage(logoUrl, "JPEG", pageWidth - 100, 28, 60, 45);
    } catch (e) {
      console.error("Logo Error:", e);
      console.warn("Bhai, logo path check karo ya image format verify karo.");
    }
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.setFont("helvetica", "bold");
    doc.text("BR30 TRADER ACADEMY", 40, 55);
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL SALE HISTORY REPORT", 40, 72);
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(40, 85, pageWidth - 40, 85);
    doc.setFillColor(59, 130, 246);
    doc.rect(40, 105, pageWidth - 80, 28, "F");
    doc.setFontSize(8);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("Student Name", 50, 123);
    doc.text("Course Title", 150, 123);
    doc.text("SALE DATE", 320, 123);
    doc.text("Amount", 420, 123);
    doc.text("Payout Status", 495, 123);
    const tableBody = document.getElementById("analyticsTableBody");
    if (!tableBody) throw new Error("Table body 'analyticsTableBody' not found!");
    const rows = tableBody.querySelectorAll("tr");
    let y = 155;
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length >= 5) {
        if (y > pageHeight - 80) {
          addFooter(doc, pageWidth, pageHeight);
          doc.addPage();
          y = 50;
        }
        const studentName = tds[0].innerText.trim();
        const courseTitle = tds[1].innerText.trim().toUpperCase();
        const saleDate = tds[2].innerText.trim();
        const amount = tds[3].innerText.replace("₹", "Rs. ").trim();
        const Payoutstatus = tds[4].innerText.trim().toUpperCase();
        doc.setFontSize(7.5);
        doc.setTextColor(80);
        doc.setFont("helvetica", "normal");
        doc.text(studentName.substring(0, 20), 50, y);
        doc.setFontSize(8);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text(courseTitle.substring(0, 30), 150, y);
        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(saleDate, 320, y);
        doc.setFontSize(8.5);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text(amount, 420, y);
        doc.setTextColor(5, 150, 105);
        doc.text(Payoutstatus, 495, y);
        doc.setDrawColor(245, 245, 245);
        doc.line(40, y + 16, pageWidth - 40, y + 16);
        y += 32;
      }
    });
    addFooter(doc, pageWidth, pageHeight);
    doc.save(`BR30_Elite_Sales_Report_${Date.now()}.pdf`);
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Sales history report downloaded.",
      background: "#0a0a0a",
      color: "#fff",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  } catch (error) {
    console.error("PDF Export Error:", error);
    Swal.fire({
      icon: "error",
      title: "Export Failed",
      text: error.message || "Something went wrong.",
      background: "#0a0a0a",
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

function resetFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  console.log("♻️ Filters Reset");
}

function exportCSV() {
  alert("📥 Excel Report (CSV) download ho rahi hai...");
}

const sellerId = localStorage.getItem("sellerId");

const sellerText = document.getElementById("sellerIdText");

if (sellerId) {
  sellerText.innerText = sellerId;
} else {
  sellerText.innerText = "Guest";
}
//#endregion
