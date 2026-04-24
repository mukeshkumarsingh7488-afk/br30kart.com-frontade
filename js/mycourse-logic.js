const courseDiv = document.getElementById("courseContent");
const token = localStorage.getItem("token");

// 🔥 Dynamic Base URL
const baseUrl = window.API_BASE_URL || "https://br30kart-api.onrender.com";
const API = baseUrl + "/api/products";

document.addEventListener("DOMContentLoaded", fetchMyCourses);

async function fetchMyCourses() {
  try {
    console.log(
      "%c[FETCH] Accessing your premium library...",
      "color: #00ff88; font-weight: bold;",
    );

    courseDiv.innerHTML = `
      <div class="loader" style="text-align:center; padding:60px;">
        <div style="font-size: 30px; margin-bottom: 10px;">⏳</div>
        <p style="color: #94a3b8;">Loading your premium library. Please wait...</p>
      </div>
    `;

    const res = await fetch(`${API}/my-courses`, {
      method: "GET",
      headers: {
        "x-auth-token": token,
      },
    });

    // 🔐 Auth Fail (SweetAlert Integration)
    if (res.status === 401 || res.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Session Expired",
        text: "Your session has timed out. Please login again to access your courses.",
        background: "#111827",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Go to Login",
      });
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();
    console.log("📦 Courses Found:", data.length || 0);

    const courses = Array.isArray(data) ? data : [];

    if (courses.length === 0) {
      renderEmptyState();
      return;
    }

    renderCourses(courses);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    courseDiv.innerHTML = `
      <div style="text-align:center; padding:40px; color:#f87171;">
        <h3>Connection Failed</h3>
        <p>Unable to load your courses. Please check your internet connection and try again.</p>
        <button onclick="fetchMyCourses()" style="background:#3b82f6; color:#fff; border:none; padding:10px 20px; border-radius:5px; margin-top:10px; cursor:pointer;">Retry</button>
      </div>
    `;
  }
}

function renderCourses(courses) {
  let html = `
    <div class="my-library-header" style="margin-bottom: 30px;">
      <h2 style="color:#fff;">📚 My Learning Library (${courses.length})</h2>
      <p style="color:#94a3b8;">You have access to ${courses.length} premium training programs.</p>
    </div>
    <div class="courses-grid">
  `;

  courses.forEach((course) => {
    const thumbUrl = course.thumbnail?.startsWith("http")
      ? course.thumbnail
      : `${baseUrl}/${course.thumbnail}`;

    // ✅ Backend se aaya hua direct status use karein
    const isLocked = course.isLocked === true;

    html += `
      <div class="course-card" style="${isLocked ? "border: 1px solid #ef4444; opacity: 0.9;" : ""}">
        <div class="thumb-container">
          <img 
            src="${thumbUrl}" 
            alt="${course.title}" 
            style="${isLocked ? "filter: blur(4px) grayscale(1);" : ""}"
            onerror="this.src='https://placeholder.com'"
          >
          <span class="category-tag" style="background:${isLocked ? "#ef4444" : "#3b82f6"}">
            ${isLocked ? "LOCKED 🔒" : course.category || "Premium"}
          </span>
        </div>
        <div class="card-body">
          <h3 style="color:#fff; font-size:18px; margin-bottom:10px;">${course.title}</h3>
          
          ${
            isLocked
              ? `
                 <!-- 🚫 LOCKED STATE -->
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                <p style="color:#ef4444; font-size:13px; font-weight:bold; margin:0; line-height:1.4;">
                   ⚠️ ACCESS RESTRICTED!<br>
                   <span style="font-size:11px; font-weight:normal; color:#f8fafc;">This course is hidden. Contact support to unlock.</span>
                </p>
            </div>
            
            <!-- 📱 SUPPORT OPTIONS (WhatsApp & Email) -->
           <div style="display: flex; gap: 8px;">
  
  <!-- ✅ WhatsApp Support -->
  <button class="watch-btn" 
    onclick="window.open('https://wa.me/916200986380?text=${encodeURIComponent(`Admin, My course ${course.title} is locked. ID: ${course._id}`)}', '_blank')" 
    style="background: #25d366; flex: 1; border: none; padding: 10px; border-radius: 8px; cursor: pointer; color: #fff; font-weight: bold; font-size: 11px;">
    <i class="fab fa-whatsapp"></i> WhatsApp
  </button>

  <!-- ✅ Email Support -->
  <button class="watch-btn" 
    onclick="window.location.href='mailto:support.br30@gmail.com?subject=${encodeURIComponent(`Course Locked: ${course.title}`)}&body=${encodeURIComponent(`User ID: ${course._id}`)}'" 
    style="background: #3b82f6; flex: 1; border: none; padding: 10px; border-radius: 8px; cursor: pointer; color: #fff; font-weight: bold; font-size: 11px;">
    <i class="fas fa-envelope"></i> Email
  </button>
            </div>
          `
              : `
            <!-- ✅ NORMAL STATE -->
            <p style="color:#94a3b8; font-size:14px; line-height:1.5; margin-bottom: 15px;">
              ${course.description ? course.description.substring(0, 80) + "..." : "Master the markets with our elite trading strategies 🚀"}
            </p>
            <button class="watch-btn" onclick="watchCourse('${course._id}')" style="width:100%; border:none; cursor:pointer;">
              ▶ Start Learning
            </button>
          `
          }
        </div>
      </div>
    `;
  });

  html += `</div>`;
  courseDiv.innerHTML = html;
}

function renderEmptyState() {
  courseDiv.innerHTML = `
    <div style="text-align:center; padding:80px 20px; background:#0f172a; border-radius:24px; border:1px solid rgba(59, 130, 246, 0.2); margin-top:30px;">
      <div style="font-size:70px; margin-bottom:20px;">🎒</div>
      <h2 style="color:#fff;">Your Library is Empty</h2>
      <p style="color:#94a3b8; margin:20px 0;">You haven’t enrolled in any premium courses yet. Start your trading journey today!</p>
      <button 
        onclick="window.location.href='../index.html#Premium-Trading-Courses'"
        style="background:#3b82f6; color:#fff; border:none; padding:14px 40px; border-radius:50px; font-weight:bold; cursor:pointer; font-size:16px;"
      >
        🚀 Browse Elite Courses
      </button>
    </div>
  `;
}

function watchCourse(courseId) {
  if (!courseId) return;
  console.log(
    "%c[REDIRECT] Opening course player...",
    "color: #3b82f6; font-weight: bold;",
  );
  window.location.href = `watch.html?id=${courseId}`;
}
