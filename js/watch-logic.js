let player;
let currentCourseName = "";

const token = localStorage.getItem("token");
const baseUrl = window.API_BASE_URL || "https://br30kart-api.onrender.com";
const API = baseUrl + "/api/products";

const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

console.log("📥 Course ID:", courseId);

// 🔐 AUTH CHECK
if (!token) {
  window.location.href = "login.html";
}

if (!courseId) {
  alert("Invalid Course!");
  window.location.href = "mycourse.html";
}

// 🎥 YOUTUBE ID EXTRACTOR
function getYTID(url) {
  try {
    if (!url) return null;
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.pathname.includes("/shorts/")) return u.pathname.split("/shorts/")[1];

    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

// ✅ YT READY
function onYouTubeIframeAPIReady() {
  console.log("✅ YouTube Ready");
  loadCourseContent();
}

// 🚀 LOAD COURSE
async function loadCourseContent() {
  try {
    console.log("📡 Loading course...");

    const res = await fetch(`${API}/${courseId}`, {
      headers: { "x-auth-token": token },
    });

    if (res.status === 401 || res.status === 403) {
      alert("Access Denied!");
      window.location.href = "../index.html";
      return;
    }

    const course = await res.json();
    console.log("📦 Course:", course);

    currentCourseName = course.title;
    document.getElementById("course-title").innerText = course.title;

    // 💥🔥 FINAL FIX (DUAL SUPPORT)
    let lessons = [];

    if (Array.isArray(course.lessons) && course.lessons.length > 0) {
      lessons = course.lessons;
    } else if (course.videoLink) {
      lessons = [
        {
          lessonTitle: course.title,
          videoUrl: course.videoLink,
        },
      ];
    }

    if (!lessons.length) {
      document.getElementById("playlist").innerHTML = "❌ No videos found";
      return;
    }

    // 🎬 FIRST VIDEO LOAD
    loadVideo(lessons[0]);

    // 📚 PLAYLIST
    renderPlaylist(lessons);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

// 🎬 LOAD VIDEO
function loadVideo(lesson, index) {
  const videoId = getYTID(lesson.videoUrl);

  if (!videoId) return;

  if (!player) {
    player = new YT.Player("main-video-iframe", {
      videoId: videoId,
      events: {
        onStateChange: onPlayerStateChange,
      },
    });
  } else {
    player.loadVideoById(videoId);
  }

  // Title update karo
  const titleEl = document.getElementById("current-video-title");
  if (titleEl) titleEl.innerText = lesson.lessonTitle;

  // 🔥 ACTIVE CLASS (SAFE VERSION)
  const videoItems = document.querySelectorAll(".video-item");

  // Pehle saari active classes hatao
  videoItems.forEach((el) => el.classList.remove("active"));

  // 🛑 FIX: Check karo ki ye index wala element asli mein exist karta hai ya nahi
  if (videoItems[index]) {
    videoItems[index].classList.add("active");
  } else {
    console.warn(`[UI] Index ${index} wala video-item nahi mila!`);
  }
}

// 📚 PLAYLIST
function renderPlaylist(lessons) {
  const html = lessons
    .map(
      (lesson, i) => `
    <div class="video-item"
      onclick='loadVideo(${JSON.stringify(lesson)}, ${i})'>
      ▶ ${i + 1}. ${lesson.lessonTitle}
    </div>
  `,
    )
    .join("");

  document.getElementById("playlist").innerHTML = html;

  const container = document.getElementById("playlist");
  container.innerHTML = html;

  // 🔥 SAFE CLICK HANDLER (NO JSON BUG)
  container.querySelectorAll(".video-item").forEach((el) => {
    el.addEventListener("click", () => {
      const index = el.getAttribute("data-index");
      loadVideo(lessons[index]);
    });
  });
}

// 🎯 VIDEO END
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    document.getElementById("cert-overlay").style.display = "flex";
  }
}

// 🏆 CERTIFICATE (UNCHANGED)
async function submitCertificate() {
  const name = document.getElementById("certName").value;
  const mobile = document.getElementById("certMobile").value;
  const btn = document.querySelector(".claim-btn");

  if (!name) return alert("Enter full name");

  btn.innerText = "Generating...";
  btn.disabled = true;
  console.log("📤 Sending to Backend:", {
    name,
    mobile,
    courseName: currentCourseName,
  });
  try {
    const res = await fetch(`${baseUrl}/api/auth/claim-certificate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({
        fullName: name,
        mobile,
        courseId,
        courseName: currentCourseName,
      }),
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        title: "🏆 Certificate Ready!",
        text: "Aapka certificate successfully generate ho gaya hai.",
        icon: "success",
        background: "#0a0a0a",
        confirmButtonColor: "#00ff88",
        confirmButtonText: "View Certificate 📄",
        showCancelButton: true,
        cancelButtonText: "Later",
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(data.downloadUrl, "_blank");
        }
      });

      document.getElementById("cert-overlay").style.display = "none";
    }
  } catch (err) {
    console.error(err);
    alert("Error generating certificate");
  } finally {
    btn.innerText = "Claim Certificate";
    btn.disabled = false;
  }
}
