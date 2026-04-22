const API_BASE = `${window.API_BASE_URL}/api/reviews`;

let allReviews = []; // Global data for searching

// 1. Fetch Reviews
/**
 * @function fetchReviews
 * @description Fetches all reviews from the database and updates the UI stats.
 */
async function fetchReviews() {
  try {
    const res = await fetch(`${API_BASE}/all`);
    if (!res.ok) throw new Error(`Fetch failed with status: ${res.status}`);

    allReviews = await res.json();

    // Update Total Review Count Display
    const statReviewsElem = document.getElementById("statReviews");
    if (statReviewsElem) {
      statReviewsElem.innerText = allReviews.length.toLocaleString("en-IN");
    }

    renderReviews(allReviews);
  } catch (error) {
    console.error("Critical Error:", error);
    const listElem = document.getElementById("review-list");
    if (listElem) {
      listElem.innerHTML = `<p style='color:red; text-align:center;'>Error: Database connection failed.</p>`;
    }
  }
}

// 2. Render Function (इसमें कोई बदलाव नहीं, पहले जैसा ही है)
function renderReviews(data) {
  const list = document.getElementById("review-list");
  list.innerHTML =
    data.length === 0
      ? "<p style='text-align:center;'>No reviews found!</p>"
      : "";

  data.forEach((rev) => {
    const card = document.createElement("div");
    card.className = "review-card";
    const currentStatus = rev.status || "approved";

    card.innerHTML = `
              <div class="header">
                  <div class="user-info">${rev.username} <span class="stars">${"★".repeat(rev.rating)}</span></div>
                  <span class="status-tag ${currentStatus === "approved" ? "status-approved" : "status-hidden"}">${currentStatus.toUpperCase()}</span>
              </div>
              <p class="comment">${rev.comment}</p>
              <div class="admin-reply-text">
                  ${rev.adminReply ? `<span style="color:#00ffa3; font-size:0.9rem"><strong>Admin:</strong> ${rev.adminReply}</span>` : ""}
              </div>

              <div class="actions">
                  <button class="btn-reply" onclick="toggleReplyBox(event, '${rev._id}')">Reply</button>
                  <button class="btn-hide" onclick="toggleStatus('${rev._id}')">${currentStatus === "approved" ? "Hide" : "Show"}</button>
                  <button class="btn-delete" onclick="deleteReview('${rev._id}')">Delete</button>
              </div>

              <div class="reply-box" id="reply-box-${rev._id}" onclick="event.stopPropagation()">
                  <textarea id="input-${rev._id}" placeholder="Apna jawab likho..."></textarea>
                  <button class="btn-reply" style="margin-top:8px; width:100%; background:var(--primary); color:black" onclick="submitReply('${rev._id}')">Send Reply</button>
              </div>
          `;
    list.appendChild(card);
  });
}

// 3. Search Logic
function searchReviews() {
  const searchTerm = document.getElementById("searchUser").value.toLowerCase();
  const filtered = allReviews.filter((rev) =>
    rev.username.toLowerCase().includes(searchTerm),
  );
  renderReviews(filtered);
}

// 4. Hide/Show Logic (Click Fix)
async function toggleStatus(id) {
  try {
    const res = await fetch(`${API_BASE}/status/${id}`, {
      method: "PATCH",
    });
    if (res.ok) fetchReviews();
    else alert("Backend route not working!");
  } catch (err) {
    alert("Error connecting to server!");
  }
}

// 5. Delete Logic
async function deleteReview(id) {
  if (confirm("Pakka delete karna hai bhai?")) {
    await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" });
    fetchReviews();
  }
}

// 6. Pro Reply Box Logic (Toggle & Auto-Close)
function toggleReplyBox(event, id) {
  event.stopPropagation(); // Page click ko rokne ke liye
  const box = document.getElementById(`reply-box-${id}`);
  const isAlreadyOpen = box.style.display === "block";

  closeAllReplyBoxes(); // Pehle baaki sab band karo

  if (!isAlreadyOpen) {
    box.style.display = "block";
  }
}

function closeAllReplyBoxes(event) {
  document.querySelectorAll(".reply-box").forEach((box) => {
    box.style.display = "none";
  });
}

async function submitReply(id) {
  const replyText = document.getElementById(`input-${id}`).value;
  if (!replyText) return alert("Bhai kuch likho to!");

  try {
    await fetch(`${API_BASE}/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminReply: replyText }),
    });
    alert("Reply Saved! ✅");
    fetchReviews();
  } catch (err) {
    alert("Reply failed!");
  }
}

fetchReviews();

/**
 * @function resetAllFilters
 * @description Clears search filter and re-fetches latest data.
 */
function resetAllFilters() {
  const searchInput = document.getElementById("searchUser");

  if (searchInput) {
    searchInput.value = "";
  }

  // Refresh data from backend
  fetchReviews();
}
