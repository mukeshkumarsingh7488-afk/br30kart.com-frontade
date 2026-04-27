// BR30 security cheak
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("Best Seller Dashboard: Active");
  fetchBestSellerData();
});

// fect best seller course
async function fetchBestSellerData() {
  try {
    const email = localStorage.getItem("sellerEmail");
    if (!email) return console.error("LocalStorage: Email missing!");

    const url = `${CONFIG.BASE_API_URL}/seller/bestsellers-data?email=${email}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("🔥 Full API Response:", data);

    if (data.success) {
      // --- 1. Boxes Update ---
      const top = data.topSellers || [];

      const updateBox = (id, course, rankLabel) => {
        const el = document.getElementById(id);
        if (el && course) {
          const rev = course.revenue ? course.revenue.toLocaleString() : "0";
          el.innerHTML = `
                        <div class="text-[10px] text-gray-400 mb-1 uppercase">${course._id}</div>
                        <div class="text-xl font-black">₹${rev}</div>
                    `;
          if (el.previousElementSibling)
            el.previousElementSibling.innerText = rankLabel;
        }
      };

      // आपके HTML IDs (bestSellerAmount आदि) के हिसाब से:
      if (top.length > 0)
        updateBox("bestSellerAmount", top[0], "1ST BEST SELLER");
      if (top.length > 1)
        updateBox("secondSellerAmount", top[1], "2ND BEST SELLER");
      if (top.length > 2)
        updateBox("thirdSellerAmount", top[2], "3RD BEST SELLER");

      if (data.worstSeller) {
        const low = data.worstSeller;
        const el = document.getElementById("lowSellerAmount");
        if (el) {
          const lowRev = low.revenue ? low.revenue.toLocaleString() : "0";
          el.innerHTML = `<div class="text-[10px] text-gray-400 mb-1 uppercase">${low._id}</div><div class="text-xl font-black text-red-500">₹${lowRev}</div>`;
          if (el.previousElementSibling)
            el.previousElementSibling.innerText = "LOWEST SELLER";
        }
      }

      // --- 2. Table Update (Using Your ID: bestsellerTableBody) ---
      const finalData = data.allData || data.orders || data.data || [];
      console.log("Records for Table:", finalData);
      renderBestsellerTable(finalData);
    }
  } catch (err) {
    console.error("Logic Error:", err);
  }
}

function renderBestsellerTable(records) {
  const tbody = document.getElementById("bestsellerTableBody");
  if (!tbody) return;

  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-500 font-bold uppercase text-[10px]">No records found 📂</td></tr>`;
    return;
  }

  // 1. प्रोडक्ट काउंट निकालो
  const productStats = records.reduce((acc, curr) => {
    const pName = curr.productName || "N/A";
    acc[pName] = (acc[pName] || 0) + 1;
    return acc;
  }, {});

  // 2. सॉर्टिंग: सबसे ज़्यादा बिकने वाले कोर्सेस के ऑर्डर्स एक साथ ऊपर आएंगे
  const sortedRecords = [...records].sort(
    (a, b) => productStats[b.productName] - productStats[a.productName],
  );

  // 3. ट्रैकिंग के लिए एक 'Set' ताकि पता चले कि इस प्रोडक्ट का 'Badge' हम दिखा चुके हैं या नहीं
  const shownBadges = new Set();

  tbody.innerHTML = sortedRecords
    .map((item, index) => {
      const pName = item.productName || "N/A";
      const sellCount = productStats[pName];
      let displayBadge = "";
      let displayName = pName;

      // 🔥 LOGIC: सिर्फ पहली बार दिखने पर Badge और Count दिखाओ
      if (!shownBadges.has(pName)) {
        shownBadges.add(pName); // इस प्रोडक्ट को 'Shown' मार्क कर दो

        // 🥇 1st Best Seller (रैंक के हिसाब से बैज)
        const rank = shownBadges.size;
        if (rank === 1) {
          displayBadge = `<span class="ml-2 animate-pulse bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[8px] px-1.5 py-0.5 rounded-sm font-black shadow-lg">🏆 TOP SELLER</span>`;
          displayName = `${pName} <span class="text-yellow-500 ml-1">*${sellCount}</span>`;
        } else if (rank === 2) {
          displayBadge = `<span class="ml-2 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-bold">🥈 2ND BEST</span>`;
          displayName = `${pName} <span class="text-blue-400 ml-1">*${sellCount}</span>`;
        } else if (rank === 3) {
          displayBadge = `<span class="ml-2 bg-orange-600 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-bold">🥉 3RD BEST</span>`;
          displayName = `${pName} <span class="text-orange-400 ml-1">*${sellCount}</span>`;
        }
      }

      // Premium Status Logic (सिर्फ टॉप सेलर की सभी लाइनों के लिए)
      const isTopSeller = pName === Array.from(shownBadges)[0];

      return `
        <tr class="hover:bg-[#0a0c10] transition border-b border-[#1f2937]">
          <td class="p-4 text-gray-500 text-[10px] uppercase font-bold text-center">
            ${new Date(item.createdAt).toLocaleDateString("en-GB")}
          </td>
          
          <td class="p-4 font-bold text-white text-xs uppercase text-center flex items-center justify-center">
            ${displayName} ${displayBadge}
          </td>
          
          <td class="p-4 font-black text-white text-sm text-center">
            ₹${(item.amount || 0).toLocaleString()}
          </td>
          
          <td class="p-4 text-blue-400 font-bold text-[10px] uppercase text-center">
            ${item.customerName || "Guest"}
          </td>
          
          <td class="p-4 text-center">
            <span class="${isTopSeller ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" : "text-green-500 border-green-500/30 bg-green-500/10"} text-[9px] font-black uppercase tracking-widest border px-2 py-1 rounded-full">
              ${isTopSeller ? "💎 PREMIUM" : "ACTIVE"}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

// --- 3. Filter Functions (Search & Date) ---
window.applyFilters = function () {
  const searchInput = document.getElementById("courseSearch");
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase().trim();

  const startDate = document.getElementById("startDate")?.value;
  const endDate = document.getElementById("endDate")?.value;

  let filtered = window.allSalesData || [];

  // ---------------- SEARCH FIX ----------------
  if (searchTerm) {
    filtered = filtered.filter((item) =>
      (item.productName || "").toLowerCase().includes(searchTerm),
    );
  }

  // ---------------- DATE FILTER ----------------
  if (startDate && endDate) {
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.createdAt).toISOString().split("T")[0];

      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  renderBestsellerTable(filtered);
};

window.resetFilters = function () {
  document.getElementById("courseSearch").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  renderBestsellerTable(window.allSalesData || []);
};

// सर्च बार को रिफ्रेश/क्लियर करने का फंक्शन
window.clearSearch = function () {
  const searchInput = document.getElementById("courseSearch");
  if (searchInput) {
    searchInput.value = ""; // इनपुट खाली करेगा
    console.log("Search Cleared!");
    renderBestsellerTable(window.allSalesData || []); // पूरी टेबल वापस लोड करेगा
  }
};

// 🔥 ULTRA PRO CSV EXPORT FUNCTION
async function exportToCSV() {
  console.log("🚀 Exporting Table to CSV...");
  const tableBody = document.getElementById("bestsellerTableBody");

  if (!tableBody) {
    return Swal.fire({
      icon: "error",
      title: "Table Not Found",
      text: "The best seller table ID was not found in the system.",
      background: "#0a0a0a",
      color: "#fff",
    });
  }

  // 1. Confirm Export
  const result = await Swal.fire({
    title: "Export to CSV?",
    text: "Do you want to download the Best Sellers report?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745", // Green for export
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Download",
    cancelButtonText: "Cancel",
    background: "#0a0a0a",
    color: "#fff",
  });

  if (result.isConfirmed) {
    try {
      // 2. Show Loading
      Swal.fire({
        title: "Generating CSV...",
        background: "#0a0a0a",
        color: "#fff",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const rows = tableBody.querySelectorAll("tr");
      let csvContent = "data:text/csv;charset=utf-8,";

      // Header Row
      csvContent += "SALE DATE,COURSE TITLE,AMOUNT (Rs.),BUYER NAME,STATUS\n";

      // Data Rows
      rows.forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length >= 5) {
          const saleDate = tds[0].innerText.trim();
          const courseTitle = tds[1].innerText.trim().replace(/,/g, "");
          const amount = tds[2].innerText.replace(/[^0-9.]/g, "").trim();
          const buyerName = tds[3].innerText.trim().replace(/,/g, "");
          const status = tds[4].innerText.trim();

          csvContent += `${saleDate},${courseTitle},${amount},${buyerName},${status}\n`;
        }
      });

      // 3. Download Logic
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `BR30_Elite_Best_Sellers_${Date.now()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✅ CSV Downloaded Successfully!");

      // 4. Success Toast
      Swal.fire({
        icon: "success",
        title: "Export Successful!",
        text: "Best Sellers report has been saved.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (error) {
      console.error("Export Error:", error);
      Swal.fire("Error", "Failed to generate the CSV file.", "error");
    }
  }
}

// 7. PDF एक्सपोर्ट (डार्क थीम प्रिजर्वेशन के साथ)
//#region Professional pdf Export Function
async function exportToPDF() {
  // 1. Ask for Confirmation
  const confirmResult = await Swal.fire({
    title: "Generate Best Sellers Report?",
    text: "This will create a professional PDF file of the current best sellers list.",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Generate PDF",
    cancelButtonText: "Cancel",
    background: "#0a0a0a",
    color: "#fff",
  });

  if (!confirmResult.isConfirmed) return;

  // 2. Show Loading Spinner
  Swal.fire({
    title: "Generating Report...",
    text: "Please wait while we prepare your document.",
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

    const logoUrl = "../https://i.ibb.co/KxnQc4gx/BR30-LOGO1.png";

    try {
      doc.addImage(logoUrl, "JPEG", pageWidth - 100, 28, 60, 45);
    } catch (e) {
      console.warn("Logo load nahi hua, skipping...");
    }

    // --- 1. PRESTIGE HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.setFont("helvetica", "bold");
    doc.text("BR30 TRADER ACADEMY", 40, 55);

    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL BEST SELLERS REPORT", 40, 72);

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(40, 85, pageWidth - 40, 85);

    // --- 2. COMPACT TABLE HEADER ---
    doc.setFillColor(59, 130, 246);
    doc.rect(40, 105, pageWidth - 80, 28, "F");

    doc.setFontSize(8);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("SALE DATE", 50, 123);
    doc.text("COURSE TITLE", 150, 123);
    doc.text("AMOUNT (Rs.)", 320, 123);
    doc.text("STUDENT NAME", 420, 123);
    doc.text("STATUS", 495, 123);

    // --- 3. DATA ROWS ---
    const tableBody = document.getElementById("bestsellerTableBody");
    if (!tableBody) {
      throw new Error("Table ID 'bestsellerTableBody' not found!");
    }

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

        const saleDate = tds[0].innerText.trim();
        const courseTitle = tds[1].innerText.trim().toUpperCase();

        let rawAmount = tds[2].innerText.trim();
        let amount = "Rs. " + rawAmount.replace(/[^0-9,.]/g, "");

        const StudentName = tds[3].innerText.trim();
        const status = tds[4].innerText.trim().toUpperCase();

        // PDF RENDERING
        doc.setFontSize(7.5);
        doc.setTextColor(80);
        doc.setFont("helvetica", "normal");
        doc.text(saleDate, 50, y);

        doc.setFontSize(8);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text(courseTitle.substring(0, 30), 130, y);

        doc.setFontSize(8.5);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text(amount, 330, y);

        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(StudentName.substring(0, 25), 420, y);

        doc.setTextColor(5, 150, 105);
        doc.setFont("helvetica", "bold");
        doc.text(status, 495, y);

        doc.setDrawColor(245, 245, 245);
        doc.line(40, y + 16, pageWidth - 40, y + 16);
        y += 32;
      }
    });

    addFooter(doc, pageWidth, pageHeight);
    doc.save(`BR30_Best_Sellers_${Date.now()}.pdf`);

    // 3. Success Notification
    Swal.fire({
      icon: "success",
      title: "Report Downloaded!",
      text: "The Best Sellers report is ready.",
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
      text: error.message || "Something went wrong while creating the PDF.",
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
// uper ka all clear hai
