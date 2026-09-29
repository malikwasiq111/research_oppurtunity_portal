// Change this if your Flask server runs on a different host/port.
const API_BASE = "http://localhost:5000/api/opportunities";

// ---- Elements ----
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const sidebarStats = document.getElementById("sidebarStats");
const btnNew = document.getElementById("btnNew");

const panelHeading = document.getElementById("panelHeading");
const panelCount = document.getElementById("panelCount");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const oppList = document.getElementById("oppList");
const toastStack = document.getElementById("toastStack");

const drawerOverlay = document.getElementById("drawerOverlay");
const drawer = document.getElementById("drawer");
const drawerClose = document.getElementById("drawerClose");
const drawerStatusPill = document.getElementById("drawerStatusPill");
const drawerBody = document.getElementById("drawerBody");

const confirmOverlay = document.getElementById("confirmOverlay");
const confirmMessage = document.getElementById("confirmMessage");
const confirmCancel = document.getElementById("confirmCancel");
const confirmOk = document.getElementById("confirmOk");

// ---- State ----
let activeStatus = "";
let searchTimer = null;
let confirmHandler = null;

// ---- Top-level events ----
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadOpportunities, 300);
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeStatus = btn.dataset.status;
    panelHeading.textContent = activeStatus ? `${activeStatus} opportunities` : "All opportunities";
    loadOpportunities();
  });
});

btnNew.addEventListener("click", () => openDrawerForm(null));
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDrawer();
    hideConfirm();
  }
});

confirmCancel.addEventListener("click", hideConfirm);
confirmOk.addEventListener("click", () => {
  if (confirmHandler) confirmHandler();
  hideConfirm();
});

// ---- Toasts ----
function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${escapeHtml(message)}</span><button aria-label="Dismiss">&times;</button>`;
  el.querySelector("button").addEventListener("click", () => el.remove());
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// ---- Confirm dialog ----
function showConfirm(message, onConfirm) {
  confirmMessage.textContent = message;
  confirmHandler = onConfirm;
  confirmOverlay.classList.add("visible");
}
function hideConfirm() {
  confirmOverlay.classList.remove("visible");
  confirmHandler = null;
}

// ---- Load + render list ----
async function loadOpportunities() {
  loadingState.classList.remove("d-none");
  emptyState.classList.add("d-none");
  oppList.innerHTML = "";

  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (activeStatus) params.set("status", activeStatus);

  try {
    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    const data = await response.json();

    renderStats(data);
    renderList(data);
  } catch (err) {
    showToast("Could not load opportunities. Is the backend running?", "danger");
  } finally {
    loadingState.classList.add("d-none");
  }
}

function renderStats(items) {
  const openCount = items.filter((op) => op.status === "Open").length;
  sidebarStats.innerHTML = `
    <span><strong>${items.length}</strong> opportunities</span>
    <span><strong>${openCount}</strong> currently open</span>
  `;
}

function renderList(items) {
  panelCount.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;

  if (!items.length) {
    emptyState.classList.remove("d-none");
    return;
  }
  emptyState.classList.add("d-none");

  oppList.innerHTML = items
    .map(
      (op, index) => `
      <li class="opp-row" data-id="${op.id}" tabindex="0">
        <span class="opp-index-num">${String(index + 1).padStart(2, "0")}</span>
        <div class="opp-row-main">
          <h2>${escapeHtml(op.title)}</h2>
          <p class="opp-row-meta">${escapeHtml(op.faculty_name)} · ${escapeHtml(op.department)}</p>
        </div>
        <div class="opp-row-side">
          <span class="status-pill status-${op.status.toLowerCase()}">${op.status}</span>
          <span class="opp-row-deadline">Due ${formatDate(op.application_deadline)}</span>
          <span class="opp-row-arrow">→</span>
        </div>
      </li>`
    )
    .join("");

  oppList.querySelectorAll(".opp-row").forEach((row) => {
    const id = Number(row.dataset.id);
    row.addEventListener("click", () => openDrawerView(id));
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawerView(id);
      }
    });
  });
}

// ---- Drawer open/close ----
function openDrawer() {
  drawerOverlay.classList.add("visible");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  drawerOverlay.classList.remove("visible");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

// ---- Drawer: view mode ----
async function openDrawerView(id) {
  drawerStatusPill.textContent = "";
  drawerStatusPill.className = "status-pill";
  drawerBody.innerHTML = `<p class="drawer-loading">Loading details…</p>`;
  openDrawer();

  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    const op = await response.json();

    drawerStatusPill.textContent = op.status;
    drawerStatusPill.classList.add(`status-${op.status.toLowerCase()}`);

    const skillTags = op.required_skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<span class="tag">${escapeHtml(s)}</span>`)
      .join("");

    drawerBody.innerHTML = `
      <h2 class="drawer-title">${escapeHtml(op.title)}</h2>
      <p class="drawer-desc">${escapeHtml(op.description)}</p>
      <dl class="drawer-facts">
        <div><dt>Faculty</dt><dd>${escapeHtml(op.faculty_name)}</dd></div>
        <div><dt>Department</dt><dd>${escapeHtml(op.department)}</dd></div>
        <div><dt>Research area</dt><dd>${escapeHtml(op.research_area)}</dd></div>
        <div><dt>Available positions</dt><dd>${op.available_positions}</dd></div>
        <div><dt>Application deadline</dt><dd>${formatDate(op.application_deadline)}</dd></div>
        <div class="full-span"><dt>Required skills</dt><dd class="skill-tags">${skillTags}</dd></div>
      </dl>
      <div class="drawer-actions">
        <button class="btn-ghost" id="actEdit" type="button">Edit</button>
        <button class="btn-ghost" id="actToggle" type="button">${op.status === "Open" ? "Mark as closed" : "Reopen"}</button>
        <button class="btn-danger-ghost" id="actDelete" type="button">Delete</button>
      </div>
    `;

    document.getElementById("actEdit").addEventListener("click", () => openDrawerForm(op));
    document.getElementById("actToggle").addEventListener("click", () => handleToggleStatus(op));
    document.getElementById("actDelete").addEventListener("click", () => handleDelete(op.id, op.title));
  } catch (err) {
    drawerBody.innerHTML = `<p class="drawer-loading" style="color:var(--danger)">Could not load details.</p>`;
  }
}

// ---- Drawer: create / edit form ----
function openDrawerForm(op) {
  const isEdit = Boolean(op);
  drawerStatusPill.textContent = isEdit ? "Editing" : "New";
  drawerStatusPill.className = "status-pill status-open";

  drawerBody.innerHTML = `
    <h2 class="drawer-title">${isEdit ? "Edit opportunity" : "New opportunity"}</h2>
    <form id="oppForm" novalidate>
      <div class="form-field" data-field="title">
        <label>Title <span class="required">*</span></label>
        <input type="text" name="title" value="${isEdit ? escapeAttr(op.title) : ""}" maxlength="255" />
        <p class="field-error">Title is required.</p>
      </div>

      <div class="form-field" data-field="description">
        <label>Description <span class="required">*</span></label>
        <textarea name="description" rows="4">${isEdit ? escapeHtml(op.description) : ""}</textarea>
        <p class="field-error">Description is required.</p>
      </div>

      <div class="form-row">
        <div class="form-field" data-field="research_area">
          <label>Research area <span class="required">*</span></label>
          <input type="text" name="research_area" value="${isEdit ? escapeAttr(op.research_area) : ""}" maxlength="150" />
          <p class="field-error">Required.</p>
        </div>
        <div class="form-field" data-field="department">
          <label>Department <span class="required">*</span></label>
          <input type="text" name="department" value="${isEdit ? escapeAttr(op.department) : ""}" maxlength="150" />
          <p class="field-error">Required.</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field" data-field="faculty_name">
          <label>Faculty name <span class="required">*</span></label>
          <input type="text" name="faculty_name" value="${isEdit ? escapeAttr(op.faculty_name) : ""}" maxlength="150" />
          <p class="field-error">Required.</p>
        </div>
        <div class="form-field" data-field="required_skills">
          <label>Required skills <span class="required">*</span></label>
          <input type="text" name="required_skills" value="${isEdit ? escapeAttr(op.required_skills) : ""}" placeholder="e.g. Python, Data Analysis" maxlength="255" />
          <p class="field-error">Required.</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field" data-field="available_positions">
          <label>Positions <span class="required">*</span></label>
          <input type="number" name="available_positions" min="0" value="${isEdit ? op.available_positions : ""}" />
          <p class="field-error">Enter a valid number.</p>
        </div>
        <div class="form-field" data-field="application_deadline">
          <label>Deadline <span class="required">*</span></label>
          <input type="date" name="application_deadline" value="${isEdit ? op.application_deadline : ""}" />
          <p class="field-error">Required.</p>
        </div>
      </div>

      <div class="form-field" data-field="status">
        <label>Status</label>
        <select name="status">
          <option value="Open" ${!isEdit || op.status === "Open" ? "selected" : ""}>Open</option>
          <option value="Closed" ${isEdit && op.status === "Closed" ? "selected" : ""}>Closed</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-ghost" id="formCancel">Cancel</button>
        <button type="submit" class="btn-primary">${isEdit ? "Save changes" : "Post opportunity"}</button>
      </div>
    </form>
  `;

  openDrawer();

  const form = document.getElementById("oppForm");
  document.getElementById("formCancel").addEventListener("click", () => {
    if (isEdit) openDrawerView(op.id);
    else closeDrawer();
  });
  form.addEventListener("submit", (e) => handleFormSubmit(e, isEdit ? op.id : null));
}

function clearFieldErrors(form) {
  form.querySelectorAll(".form-field").forEach((f) => f.classList.remove("error"));
}

function markFieldError(form, fieldName) {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  if (field) field.classList.add("error");
}

async function handleFormSubmit(e, id) {
  e.preventDefault();
  const form = e.target;
  clearFieldErrors(form);

  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    research_area: form.research_area.value.trim(),
    department: form.department.value.trim(),
    faculty_name: form.faculty_name.value.trim(),
    required_skills: form.required_skills.value.trim(),
    available_positions: form.available_positions.value,
    application_deadline: form.application_deadline.value,
    status: form.status.value,
  };

  // Client-side check first, so obviously empty fields never even hit the network.
  let hasError = false;
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "status") return;
    if (value === "" || value === null) {
      markFieldError(form, key);
      hasError = true;
    }
  });
  if (hasError) {
    showToast("Please fill in all required fields.", "danger");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving…";

  try {
    const url = id ? `${API_BASE}/${id}` : API_BASE;
    const method = id ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();

    if (!response.ok) {
      // Surface the backend's real validation reason, not a generic message.
      if (Array.isArray(body.details) && body.details.length) {
        showToast(body.details[0], "danger");
      } else {
        showToast(body.error || "Something went wrong.", "danger");
      }
      return;
    }

    showToast(id ? "Opportunity updated." : "Opportunity posted.");
    closeDrawer();
    loadOpportunities();
  } catch (err) {
    showToast("Could not reach the server.", "danger");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

// ---- Status toggle ----
async function handleToggleStatus(op) {
  const newStatus = op.status === "Open" ? "Closed" : "Open";
  try {
    const response = await fetch(`${API_BASE}/${op.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) throw new Error();
    showToast(`Marked as ${newStatus}.`);
    closeDrawer();
    loadOpportunities();
  } catch (err) {
    showToast("Could not update status.", "danger");
  }
}

// ---- Delete ----
function handleDelete(id, title) {
  showConfirm(`Delete "${title}"? This can't be undone.`, async () => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      showToast("Opportunity deleted.");
      closeDrawer();
      loadOpportunities();
    } catch (err) {
      showToast("Could not delete opportunity.", "danger");
    }
  });
}

// ---- Utilities ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

loadOpportunities();