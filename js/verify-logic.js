// 🎥 1. Camera Scanner Logic (Same as before)
const html5QrCode = new Html5Qrcode("reader");
const config = { fps: 10, qrbox: { width: 250, height: 250 } };

html5QrCode
  .start({ facingMode: "environment" }, config, (decodedText) => {
    let id = decodedText;
    if (decodedText.includes("id=")) {
      id = decodedText.split("id=")[1];
    }
    document.getElementById("certInput").value = id;
    verifyCert();
  })
  .catch((err) => console.warn("Camera access denied or error:", err));

// 🔍 2. Verification API Logic
async function verifyCert() {
  const certId = document.getElementById("certInput").value.trim();
  const resBox = document.getElementById("result-box");

  if (!certId) {
    return Swal.fire({
      icon: "warning",
      title: "ID Required",
      text: "Please enter or scan a Certificate ID to verify.",
      background: "#111827",
      color: "#fff",
    });
  }

  try {
    // Show Processing State
    Swal.fire({
      title: "Authenticating...",
      text: "Verifying certificate credentials with BR30 database.",
      allowOutsideClick: false,
      background: "#111827",
      color: "#fff",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 🔥 FIXED URL LINE: 'window.API_BASE_URL' ki jagah 'CONFIG.BASE_API_URL' use kiya hai
    // Kyunki CONFIG.BASE_API_URL mein pehle se hi "/api" included hai.
    const res = await fetch(
      `${CONFIG.BASE_API_URL}/auth/verify-certificate/${certId}`,
    );

    const data = await res.json();

    if (data.success) {
      Swal.close();

      resBox.style.display = "block";
      document.getElementById("res-name").innerText =
        data.studentName.toUpperCase();
      document.getElementById("res-course").innerText = data.course;

      // 📅 3. DATE FORMATTING
      const dateObj = new Date(data.issueDate);
      const formattedDate = isNaN(dateObj)
        ? new Date().toLocaleDateString("en-IN")
        : dateObj.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

      document.getElementById("res-date").innerText =
        "Issued on: " + formattedDate;

      // 📥 4. DYNAMIC DOWNLOAD BUTTON
      const oldBtn = document.getElementById("dl-btn");
      if (oldBtn) oldBtn.remove();

      const dlBtn = document.createElement("button");
      dlBtn.id = "dl-btn";
      dlBtn.innerHTML = "DOWNLOAD CERTIFICATE 📥";
      dlBtn.style.cssText =
        "width:100%; padding:14px; margin-top:20px; background:#D4AF37; color:#000; border:none; border-radius:12px; font-weight:900; cursor:pointer; text-transform:uppercase; letter-spacing:1px; transition: 0.3s; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);";

      dlBtn.onmouseover = () => (dlBtn.style.background = "#e5c05b");
      dlBtn.onmouseout = () => (dlBtn.style.background = "#D4AF37");
      dlBtn.onclick = () => window.open(data.downloadUrl, "_blank");

      resBox.appendChild(dlBtn);
      resBox.scrollIntoView({ behavior: "smooth" });

      Swal.fire({
        icon: "success",
        title: "Verified Successfully!",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        background: "#111827",
        color: "#fff",
      });
    } else {
      resBox.style.display = "none";
      Swal.fire({
        icon: "error",
        title: "Invalid Certificate",
        text: "This Certificate ID does not exist in our records.",
        background: "#111827",
        color: "#fff",
      });
    }
  } catch (err) {
    console.error("Verification Error:", err);
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Unable to connect. Please check if your API server is running.",
      background: "#111827",
      color: "#fff",
    });
  }
}

// 5. Auto-load from URL
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (id) {
    document.getElementById("certInput").value = id;
    verifyCert();
  }
};
