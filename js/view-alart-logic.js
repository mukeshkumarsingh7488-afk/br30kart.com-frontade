//#region
async function fetchAllAlerts() {
  const token = localStorage.getItem("token");
  const list = document.getElementById("all-notif-list");
  try {
    list.innerHTML = `
        <div style="text-align:center; padding:40px; color:#9ca3af;">
          <div class="spinner" style="margin-bottom:10px;">⏳</div>
          <p>Syncing latest alerts from the server...</p>
        </div>
      `;
    const response = await fetch(window.API_BASE_URL + "/api/notifications/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
    });
    if (response.status === 401 || response.status === 403) {
      list.innerHTML = `
          <div style="text-align:center; padding:20px; color:#facc15;">
            <p>Authentication Required. Please login to view alerts.</p>
            <button onclick="window.location.href='login.html'" style="margin-top:10px; padding:8px 20px; cursor:pointer;">Login</button>
          </div>
        `;
      return;
    }
    const alerts = await response.json();
    list.innerHTML = "";
    if (!Array.isArray(alerts) || alerts.length === 0) {
      list.innerHTML = `
          <div style="text-align:center; padding:60px; color:#6b7280;">
            <div style="font-size:40px; margin-bottom:10px;">🔔</div>
            <p>Your notification tray is empty.</p>
          </div>
        `;
      return;
    }
    alerts.forEach((data) => {
      const name = data.senderName || "System Administrator";
      const date = new Date(data.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const time = new Date(data.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const card = `
          <div class="notif-card" style="padding:15px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid #333; margin-bottom:12px;">
              <p style="color:#e5e7eb; line-height:1.5;">
                <span style="color:#3b82f6; font-weight:bold;">📢 ${name}:</span> ${data.message}
              </p>
              <div style="margin-top:10px; font-size:11px; color:#9ca3af; display:flex; justify-content:space-between;">
                <span>📅 ${date}</span>
                <span>⏰ ${time}</span>
              </div>
          </div>
        `;
      list.insertAdjacentHTML("beforeend", card);
    });
  } catch (err) {
    console.error("Critical Error:", err);
    list.innerHTML = `
        <div style="text-align:center; padding:20px; color:#ef4444;">
          <p>System offline. Unable to connect to the notification server.</p>
          <button onclick="fetchAllAlerts()" style="margin-top:10px; background:none; border:1px solid #ef4444; color:#ef4444; padding:5px 15px; cursor:pointer; border-radius:5px;">Retry Sync</button>
        </div>
      `;
  }
}
document.addEventListener("DOMContentLoaded", fetchAllAlerts);
//#endregion
