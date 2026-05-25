//#region
let socket;
let allNotifications = [];

function getNotifElements() {
  return {
    bell: document.getElementById("bellBtn"),
    dropdown: document.getElementById("notifDropdown"),
    notifBody: document.getElementById("notifBody"),
    countBadge: document.querySelector(".notif-count"),
    clearBtn: document.getElementById("clearNotif"),
  };
}

function renderNotifications() {
  const { countBadge, notifBody } = getNotifElements();
  const count = allNotifications.length;

  if (countBadge) {
    countBadge.innerText = count;
    countBadge.style.display = count > 0 ? "flex" : "none";
  }

  if (!notifBody) return;

  if (count > 0) {
    notifBody.innerHTML = allNotifications
      .map((item) => {
        const id = item.productId || item._id || "";
        return `<div class="notif-item" onclick="window.location.href='/?highlight=${id}#card-${id}'"><p><strong>${item.title || "New Notification"}</strong></p><p>${item.message || ""}</p><small>${new Date(item.createdAt || Date.now()).toLocaleString()}</small></div>`;
      })
      .join("");
  } else {
    notifBody.innerHTML = '<p class="empty-msg">No new notifications</p>';
  }
}

async function fetchOldNotifications() {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await fetch(`${CONFIG.BASE_API_URL}/products/notifications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
    });

    if (!response.ok) throw new Error("Fetch failed");

    allNotifications = await response.json();
    renderNotifications();
  } catch (err) {
    allNotifications = [];
    renderNotifications();
    console.warn("📢 Purane notifications nahi mile:", err.message);
  }
}

function initSocketNotifications() {
  if (typeof io === "undefined") {
    console.warn("❌ Socket.io CDN missing in HTML!");
    return;
  }

  if (!window.API_BASE_URL) {
    console.warn("❌ API_BASE_URL missing!");
    return;
  }

  socket = io(window.API_BASE_URL, {
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("✅ Socket Client Connected!");
  });

  socket.on("new_notification", (data) => {
    allNotifications.unshift(data);
    renderNotifications();

    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: data.title || "New Notification",
        text: data.message || "",
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 4000,
        showConfirmButton: false,
      });
    }
  });
}

function initNotificationUI() {
  const { bell, dropdown, clearBtn } = getNotifElements();

  if (bell && dropdown) {
    bell.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle("show");
      document.body.style.overflow = window.innerWidth <= 768 && isOpen ? "hidden" : "auto";
    };
  }

  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      allNotifications = [];
      renderNotifications();
      document.body.style.overflow = "auto";

      if (typeof Swal !== "undefined") {
        Swal.fire({
          toast: true,
          position: "top-end",
          title: "Cleared",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    };
  }

  document.addEventListener("click", () => {
    if (dropdown && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  });
}

function updateNavbar() {
  const username = localStorage.getItem("username");
  const accountBtn = document.getElementById("navAccountBtn");

  if (username && accountBtn) {
    const firstName = username.split(" ")[0];
    accountBtn.innerHTML = `👤 ${firstName} <span class="triangle-icon">▼</span>`;

    const loginLink = document.querySelector('a[href="/login"]');
    if (loginLink) loginLink.innerHTML = "🔄 Switch Account";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNotificationUI();
  initSocketNotifications();
  fetchOldNotifications();
  updateNavbar();
});
//#endregion
