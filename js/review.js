//#region
const API_BASE = `${window.API_BASE_URL}/api/reviews`;
let allReviews = [];
let selectedReviews = new Set();

async function fetchReviews() {
  try {
    const res = await fetch(`${API_BASE}/all`);
    if (!res.ok) throw new Error(`Fetch failed with status: ${res.status}`);
    allReviews = await res.json();
    selectedReviews.clear();
    updateBulkBar();
    const statReviewsElem = document.getElementById("statReviews");
    if (statReviewsElem) statReviewsElem.innerText = allReviews.length.toLocaleString("en-IN");
    renderReviews(allReviews);
  } catch (error) {
    console.error("Critical Error:", error);
    const listElem = document.getElementById("review-list");
    if (listElem) listElem.innerHTML = `<p style='color:red;text-align:center;'>Error: Database connection failed.</p>`;
  }
}

function renderReviews(data) {
  const list = document.getElementById("review-list");
  list.innerHTML = data.length === 0 ? "<p style='text-align:center;'>No reviews found!</p>" : "";
  data.forEach((rev) => {
    const card = document.createElement("div");
    const currentStatus = rev.status || "approved";
    const checked = selectedReviews.has(rev._id) ? "checked" : "";
    card.className = `review-card ${checked ? "selected-review" : ""}`;
    card.innerHTML = `
      <div class="review-select-row">
        <input type="checkbox" class="review-checkbox" value="${rev._id}" ${checked} onchange="toggleReviewSelection('${rev._id}', this.checked)" />
        <span class="review-id">#${String(rev._id).slice(-8).toUpperCase()}</span>
      </div>
      <div class="header">
        <div class="user-info">${rev.username || "Unknown User"} <span class="stars">${"★".repeat(Number(rev.rating) || 0)}</span></div>
        <span class="status-tag ${currentStatus === "approved" ? "status-approved" : "status-hidden"}">${currentStatus.toUpperCase()}</span>
      </div>
      <p class="comment">${rev.comment || ""}</p>
      <div class="admin-reply-text">
        ${rev.adminReply ? `<span style="color:#00ffa3;font-size:0.9rem"><strong>Admin:</strong> ${rev.adminReply}</span>` : ""}
      </div>
      <div class="actions">
        <button class="btn-reply" onclick="toggleReplyBox(event, '${rev._id}')">Reply</button>
        <button class="btn-hide" onclick="toggleStatus('${rev._id}')">${currentStatus === "approved" ? "Hide" : "Show"}</button>
        <button class="btn-delete" onclick="deleteReview('${rev._id}')">Delete</button>
      </div>
      <div class="reply-box" id="reply-box-${rev._id}" onclick="event.stopPropagation()">
        <textarea id="input-${rev._id}" placeholder="Apna jawab likho..."></textarea>
        <button class="btn-reply" style="margin-top:8px;width:100%;background:var(--primary);color:black" onclick="submitReply('${rev._id}')">Send Reply</button>
      </div>
    `;
    list.appendChild(card);
  });
  updateBulkBar();
}

function toggleReviewSelection(id, checked) {
  checked ? selectedReviews.add(id) : selectedReviews.delete(id);
  updateBulkBar();
}

function toggleSelectAllReviews() {
  const checked = document.getElementById("selectAllReviews").checked;
  document.querySelectorAll(".review-checkbox").forEach((cb) => {
    cb.checked = checked;
    checked ? selectedReviews.add(cb.value) : selectedReviews.delete(cb.value);
  });
  updateBulkBar();
}

function getSelectedReviewIds() {
  return Array.from(selectedReviews);
}

function updateBulkBar() {
  const bar = document.getElementById("bulkActionBar");
  const count = document.getElementById("selectedCount");
  const selectAll = document.getElementById("selectAllReviews");
  const total = selectedReviews.size;
  if (bar) bar.style.display = total > 0 ? "flex" : "none";
  if (count) count.innerText = `${total} Selected`;
  if (selectAll) {
    const visible = document.querySelectorAll(".review-checkbox").length;
    const checked = document.querySelectorAll(".review-checkbox:checked").length;
    selectAll.checked = visible > 0 && checked === visible;
  }
}

function clearReviewSelection() {
  selectedReviews.clear();
  document.querySelectorAll(".review-checkbox").forEach((cb) => (cb.checked = false));
  updateBulkBar();
}

async function bulkHideReviews() {
  await runBulkAction("bulk-hide", "PUT", "Hide selected reviews?");
}

async function bulkShowReviews() {
  await runBulkAction("bulk-show", "PUT", "Unhide selected reviews?");
}

async function bulkDeleteReviews() {
  await runBulkAction("bulk-delete", "DELETE", "Delete selected reviews permanently?", true);
}

async function runBulkAction(endpoint, method, confirmText, danger = false) {
  const reviewIds = getSelectedReviewIds();
  if (!reviewIds.length) return Swal.fire("No Selection", "Please select reviews first.", "warning");
  const confirm = await Swal.fire({
    title: confirmText,
    text: `${reviewIds.length} reviews selected`,
    icon: danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonColor: danger ? "#ff4d4d" : "#00ffa3",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Yes, Continue",
    background: "#0a0a0a",
    color: "#fff",
  });
  if (!confirm.isConfirmed) return;
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewIds }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.msg || "Bulk action failed");
    await Swal.fire("Success", data.msg || "Bulk action completed", "success");
    fetchReviews();
  } catch (err) {
    Swal.fire("Failed", err.message, "error");
  }
}

async function bulkReplyReviews() {
  const reviewIds = getSelectedReviewIds();
  if (!reviewIds.length) return Swal.fire("No Selection", "Please select reviews first.", "warning");
  const { value: reply } = await Swal.fire({
    title: `Reply to ${reviewIds.length} reviews`,
    input: "textarea",
    inputPlaceholder: "Type admin reply...",
    showCancelButton: true,
    confirmButtonText: "Send Reply",
    background: "#0a0a0a",
    color: "#fff",
  });
  if (!reply || !reply.trim()) return;
  try {
    const res = await fetch(`${API_BASE}/bulk-reply`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewIds, reply: reply.trim() }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.msg || "Bulk reply failed");
    await Swal.fire("Success", data.msg || "Bulk reply saved", "success");
    fetchReviews();
  } catch (err) {
    Swal.fire("Failed", err.message, "error");
  }
}

function searchReviews() {
  const searchTerm = document.getElementById("searchUser").value.toLowerCase();
  const filtered = allReviews.filter((rev) => (rev.username || "").toLowerCase().includes(searchTerm));
  renderReviews(filtered);
}

async function toggleStatus(id) {
  try {
    const res = await fetch(`${API_BASE}/status/${id}`, { method: "PATCH" });
    if (res.ok) fetchReviews();
    else Swal.fire("Error", "Backend route not working!", "error");
  } catch {
    Swal.fire("Error", "Error connecting to server!", "error");
  }
}

async function deleteReview(id) {
  const confirm = await Swal.fire({
    title: "Delete Review?",
    text: "This review will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff4d4d",
    background: "#0a0a0a",
    color: "#fff",
  });
  if (!confirm.isConfirmed) return;
  await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" });
  fetchReviews();
}

function toggleReplyBox(event, id) {
  event.stopPropagation();
  const box = document.getElementById(`reply-box-${id}`);
  const isAlreadyOpen = box.style.display === "block";
  closeAllReplyBoxes();
  if (!isAlreadyOpen) box.style.display = "block";
}

function closeAllReplyBoxes() {
  document.querySelectorAll(".reply-box").forEach((box) => (box.style.display = "none"));
}

async function submitReply(id) {
  const replyText = document.getElementById(`input-${id}`).value;
  if (!replyText) return Swal.fire("Empty Reply", "Bhai kuch likho to!", "warning");
  try {
    await fetch(`${API_BASE}/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminReply: replyText }),
    });
    Swal.fire("Saved", "Reply Saved! ✅", "success");
    fetchReviews();
  } catch {
    Swal.fire("Failed", "Reply failed!", "error");
  }
}

function resetAllFilters() {
  const searchInput = document.getElementById("searchUser");
  if (searchInput) searchInput.value = "";
  selectedReviews.clear();
  fetchReviews();
}

fetchReviews();
//#endregion
