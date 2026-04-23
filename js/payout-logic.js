/**
 * BR30 - Professional Payout History (100% Dynamic)
 * Uses Order Model fields: payoutDate, orderId, mailTrack
 */
// Br30 Security cheak
// 🔥 MUKESH KING - IRON WALL SECURITY (SweetAlert Edition)
(async function protectPage() {
  const role = localStorage.getItem("userRole");
  const allowed = ["admin", "seller"];

  if (!allowed.includes(role)) {
    // 1. Pura content gayab karo turant
    document.documentElement.style.display = "none";

    // 2. SweetAlert dikhao (Ye redirect hone se pehle dikhega)
    // Note: Kyunki page hidden hai, hume alert ko confirm ke baad redirect karna hoga
    alert("🚨 ACCESS DENIED: Only Admin & Sellers Allowed!");

    // Agar aap chahte ho ki bina alert ke seedha bahar kare toh niche wala use karo
    window.location.href = "../index.html";
  }
})();

let payoutData = [];

// 1. पेज लोड होते ही डेटाबेस से डेटा लाओ
window.onload = fetchPayoutHistory;

async function fetchPayoutHistory() {
  // localStorage से सेलर का ईमेल उठाना
  const email = localStorage.getItem("sellerEmail");

  if (!email) {
    console.error("Seller Email not found! Redirecting to login...");
    window.location.href = "login.html"; // लॉगिन नहीं है तो बाहर भेज दो
    return;
  }

  try {
    const response = await fetch(
      `${window.API_BASE_URL}/api/seller/sales-records?sellerEmail=${email}`,
    );
    const result = await response.json();

    if (result.success) {
      payoutData = result.data.orders; // DB का सारा डेटा स्टोर किया
      applyPayoutFilters(); // टेबल और बॉक्सेस में डेटा सजाओ
    }
  } catch (err) {
    console.error("History Load Error:", err);
  }
}

// 2. सर्च और डेट के हिसाब से डेटा को फ़िल्टर और रेंडर करना
function applyPayoutFilters() {
  const tableBody = document.getElementById("payoutTableBody");
  const searchInput = document.getElementById("payoutSearch");
  const fromInput = document.getElementById("startDate");
  const toInput = document.getElementById("endDate");

  // Safety Check: Agar input fields missing hain toh error na aaye
  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const from = fromInput ? fromInput.value : ""; // Format: YYYY-MM-DD
  const to = toInput ? toInput.value : ""; // Format: YYYY-MM-DD

  // --- DEBUGGING LOGS (F12 mein dekho) ---
  console.log("1. From Input Value:", from);
  console.log("2. To Input Value:", to);
  console.log(
    "3. Total Data in DB:",
    payoutData ? payoutData.length : "NO DATA!",
  );
  // --- 1. Filter Logic (FULL DYNAMIC FIX) ---
  // --- 1. Combined Filter Logic (Search + Date) ---
  let filtered = payoutData.filter((o) => {
    // A. SEARCH LOGIC (Course Title या Order ID के लिए)
    const searchText = search.trim().toLowerCase();
    const matchesSearch =
      (o.productName || "").toLowerCase().includes(searchText) ||
      (o._id || "").toString().toLowerCase().includes(searchText);

    // B. DATE LOGIC (payoutDate या createdAt के हिसाब से)
    // अगर तारीखें खाली हैं तो matchesDate हमेशा true रहेगा
    if (!from && !to) return matchesSearch;

    // डेटाबेस की तारीख को पकड़ें (payoutDate को प्राथमिकता दें)
    const dbDateRaw = o.payoutDate || o.createdAt;
    if (!dbDateRaw) return matchesSearch; // अगर डेट नहीं है तो सिर्फ सर्च पर निर्भर रहें

    const d = new Date(dbDateRaw);
    d.setHours(0, 0, 0, 0); // तुलना के लिए समय 0 करें

    const fromDate = from ? new Date(from) : null;
    if (fromDate) fromDate.setHours(0, 0, 0, 0);

    const toDate = to ? new Date(to) : null;
    if (toDate) toDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (fromDate && d < fromDate) matchesDate = false;
    if (toDate && d > toDate) matchesDate = false;

    // दोनों शर्तें पूरी होनी चाहिए
    return matchesSearch && matchesDate;
  });

  // --- 2. Calculations & Counters ---
  // --- 2. Calculations & Counters (Pro Fix: No More Math Magic) ---
  let paidSum = 0,
    pendingSum = 0,
    feeSum = 0,
    mailsSent = 0;

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found. 📂</td></tr>`;
  }

  filtered.forEach((o) => {
    const amt = Number(o.amount) || 0;
    const earn = Number(o.sellerEarnings) || 0;
    const comm = Number(o.platformCommission) || 0;
    const pStatus = (o.payoutStatus || "Pending").trim().toLowerCase();

    const isCompleted = pStatus === "completed";

    feeSum += comm;

    if (pStatus === "completed") {
      paidSum += earn;

      if (o.mailTrack && o.mailTrack.toUpperCase().includes("SUCCESS")) {
        mailsSent++;
      }
    } else {
      pendingSum += earn;
    }

    // --- 3. Dynamic Display Data ---

    // Payout Date logic
    const displayDate =
      isCompleted && o.payoutDate
        ? new Date(o.payoutDate).toLocaleDateString("en-GB")
        : '<span class="text-gray-600">Pending</span>';

    // Dynamic Mail Track Logic
    let mailHTML = "";
    const dbMailStatus = o.mailTrack ? o.mailTrack.toUpperCase() : "N/A";

    if (isCompleted) {
      if (dbMailStatus.includes("SUCCESS")) {
        mailHTML = `<span class="mail-success" style="color: #3b82f6; font-size: 11px; font-weight: bold;">
                           <i class="fas fa-check-double"></i> SUCCESS MAIL
                        </span>`;
      } else {
        mailHTML = `<span class="text-gray-500 text-[10px] font-bold">MAIL: ${dbMailStatus}</span>`;
      }
    } else {
      mailHTML = `<span class="text-gray-600 text-[10px] italic">Awaiting Payment...</span>`;
    }

    const statusClass = isCompleted ? "status-completed" : "status-pending";

    // --- [ORDER ID FIX FROM _id] ---
    // DB की ObjectId के आखरी 8 अक्षर उठाना
    const realOrderID = o._id
      ? o._id.toString().slice(-8).toUpperCase()
      : "N/A";

    // --- 4. Table Row Injection ---
    tableBody.innerHTML += `
        <tr class="hover:bg-[#0a0c10] transition border-b border-[#1f2937]">
            <!-- 1. Payout Date -->
            <td class="px-6 py-4 text-xs text-gray-500 font-medium">${displayDate}</td>
            
            <!-- 2. Course Details & Order ID -->
            <td class="px-6 py-4">
                <div class="text-sm font-bold text-white uppercase">${o.productName}</div>
                <div class="text-[10px] text-blue-400 font-bold">Course ID: #${realOrderID}</div>
            </td>

            <!-- ✅ 3. Sell Price (Asli Kimat) -->
            <td class="px-6 py-4 text-sm font-semibold text-gray-400">₹${Number(o.amount || 0).toLocaleString()}</td>

            <!-- ✅ 4. Platform Fee (20% - Red) -->
            <td class="px-6 py-4 text-sm font-semibold text-red-500">₹${Number(o.platformCommission || 0).toLocaleString()}</td>

            <!-- ✅ 5. Earnings (80% - Green & Bold) -->
            <td class="px-6 py-4 font-black text-green-400 text-lg">₹${Number(o.sellerEarnings || 0).toLocaleString()}</td>

            <!-- 6. Mail Track -->
            <td class="px-6 py-4">${mailHTML}</td>

            <!-- 7. Payout Status -->
            <td class="px-6 py-4 text-center">
                <span class="badge ${statusClass}" style="padding: 4px 12px; border-radius: 6px; font-size: 10px;">${pStatus}</span>
            </td>
        </tr>`;
  });

  // --- 5. Stats Update (सिर्फ एक बार फंक्शन के अंदर रखें) ---
  const updateStats = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = `₹${value.toLocaleString()}`;
  };

  updateStats("totalPaid", paidSum);
  updateStats("totalPending", pendingSum);
  updateStats("totalFees", feeSum);

  if (document.getElementById("mailCount")) {
    document.getElementById("mailCount").innerText = mailsSent;
  }
} // <--- यहाँ applyPayoutFilters फंक्शन बंद हो रहा है

// 3. फ़िल्टर रीसेट करना (एक बार)
function resetFilters() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("payoutSearch").value = "";
  applyPayoutFilters();
}

// 4. PDF एक्सपोर्ट (एक बार)
// 1. Professional Print Function
function downloadPDF() {
  Swal.fire({
    title: "Preparing Print...",
    text: 'Please adjust your printer settings to "Save as PDF" if needed.',
    icon: "info",
    timer: 2000,
    showConfirmButton: false,
    didOpen: () => {
      setTimeout(() => {
        window.print();
      }, 500);
    },
  });
}

// 2. CSV Download Function with SweetAlert
window.printCSV = async function () {
  const tableBody = document.getElementById("payoutTableBody");

  // Check if data exists
  if (!tableBody || tableBody.rows.length === 0) {
    return Swal.fire({
      icon: "error",
      title: "No Data Found",
      text: "Bhai, there is no payout data available to download!",
      background: "#0a0a0a",
      color: "#fff",
    });
  }

  // Confirmation before download
  const result = await Swal.fire({
    title: "Download CSV?",
    text: "Do you want to export the Payout Report to a CSV file?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Download!",
    cancelButtonText: "Cancel",
    background: "#0a0a0a",
    color: "#fff",
  });

  if (result.isConfirmed) {
    try {
      // Show loading
      Swal.fire({
        title: "Generating CSV...",
        background: "#0a0a0a",
        color: "#fff",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let csv = [];

      // Header (Professional English)
      csv.push(
        ["Date", "Product", "Amount", "Mail Status", "Payout Status"].join(","),
      );

      const rows = tableBody.querySelectorAll("tr");

      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length === 0) return;

        let rowData = [];
        cols.forEach((col) => {
          let text = col.innerText.replace(/,/g, "").replace(/\n/g, " "); // Comma & Newline remove
          rowData.push(`"${text}"`);
        });
        csv.push(rowData.join(","));
      });

      // File Creation & Download
      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `BR30_Elite_Payout_Report_${new Date().toISOString().split("T")[0]}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Success Toast
      Swal.fire({
        icon: "success",
        title: "Report Downloaded!",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch (error) {
      console.error("CSV Export Error:", error);
      Swal.fire("Error", "Failed to generate CSV file.", "error");
    }
  }
};

function resetSearch() {
  // 1. सर्च इनपुट को खाली करो
  const searchInput = document.getElementById("payoutSearch");
  if (searchInput) {
    searchInput.value = "";
  }
  // 3. फ़िल्टर फंक्शन को दोबारा चलाओ ताकि पूरा डेटा वापस आ जाए
  applyPayoutFilters();

  console.log("Search Cleared & Table Reset!");
}

//#region   custom pdf templet
async function exportToPDF() {
  // 1. Initial Confirmation
  const confirmResult = await Swal.fire({
    title: "Download Payout Report?",
    text: "This will generate a professional Payout History PDF.",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Download",
    cancelButtonText: "Cancel",
    background: "#0a0a0a",
    color: "#fff",
  });

  if (!confirmResult.isConfirmed) return;

  // 2. Show Loading Spinner
  Swal.fire({
    title: "Generating Report...",
    text: "Please wait while we prepare the document.",
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
      console.warn(
        "Bhai, logo path check karo ya image format PNG/JPEG verify karo.",
      );
    }

    // --- 1. PRESTIGE HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Royal Blue
    doc.setFont("helvetica", "bold");
    doc.text("BR30 TRADER ACADEMY", 40, 55);

    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL PAYOUT HISTORY REPORT", 40, 72);

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(40, 85, pageWidth - 40, 85);

    // --- 2. COMPACT TABLE HEADER ---
    doc.setFillColor(59, 130, 246);
    doc.rect(40, 105, pageWidth - 80, 28, "F");

    doc.setFontSize(8);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("DATE", 50, 123);
    doc.text("COURSE & ORDER DETAILS", 135, 123);
    doc.text("AMOUNT (80%)", 335, 123);
    doc.text("MAIL STATUS", 435, 123);
    doc.text("STATUS", 510, 123);

    // --- 3. DATA ROWS ---
    const tableBody = document.getElementById("payoutTableBody");
    if (!tableBody) throw new Error("Table body 'payoutTableBody' not found!");

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

        const date = tds[0].innerText.trim();
        const details = tds[1].innerText.split("\n");
        const title = details[0].trim().toUpperCase();
        const orderId = details[1] ? details[1].trim() : "";
        const amount = tds[2].innerText.replace("₹", "Rs. ").trim();
        const mail = tds[3].innerText.replace(/[^\x00-\x7F]/g, "").trim();
        const status = tds[4].innerText.trim().toUpperCase();

        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.text(date, 50, y);

        doc.setFontSize(8);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text(title.substring(0, 38), 135, y);

        doc.setFontSize(6.5);
        doc.setTextColor(150);
        doc.setFont("helvetica", "normal");
        doc.text(orderId, 135, y + 9);

        doc.setFontSize(8.5);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text(amount, 335, y);

        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(mail || "SUCCESS", 435, y);

        doc.setTextColor(5, 150, 105);
        doc.setFont("helvetica", "bold");
        doc.text(status, 510, y);

        doc.setDrawColor(245, 245, 245);
        doc.line(40, y + 16, pageWidth - 40, y + 16);
        y += 32;
      }
    });

    addFooter(doc, pageWidth, pageHeight);
    doc.save(`BR30_Payout_Report_${Date.now()}.pdf`);

    // 3. Success Toast
    Swal.fire({
      icon: "success",
      title: "Report Downloaded!",
      text: "Payout history is ready.",
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

// --- 4. ULTRA PRO FOOTER ---
function addFooter(doc, pageWidth, pageHeight) {
  const date = new Date().toLocaleString("en-GB");
  doc.setDrawColor(230, 230, 230);
  doc.line(40, pageHeight - 60, pageWidth - 40, pageHeight - 60);

  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer-generated report. No physical signature is required.",
    40,
    pageHeight - 45,
  );

  doc.setFont("helvetica", "normal");
  doc.text(`Report Date: ${date}`, 40, pageHeight - 32);

  const pageNo = doc.internal.getNumberOfPages();
  doc.text(
    `Page ${pageNo} | BR30 TRADER OFFICIAL`,
    pageWidth - 150,
    pageHeight - 32,
  );
}

//#endregion
