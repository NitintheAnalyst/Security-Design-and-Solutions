const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const editStorageKey = "rakshasecure-page-edits-v1";
const editableSelector = "[data-edit-key]";
let editModeActive = false;

const syncHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

const readSavedEdits = () => {
  try {
    return JSON.parse(window.localStorage.getItem(editStorageKey)) || {};
  } catch {
    try {
      return JSON.parse(window.sessionStorage.getItem(editStorageKey)) || {};
    } catch {
      return {};
    }
  }
};

const writeSavedEdits = (edits) => {
  const payload = JSON.stringify(edits);

  try {
    window.localStorage.setItem(editStorageKey, payload);
    return true;
  } catch {
    try {
      window.sessionStorage.setItem(editStorageKey, payload);
      return true;
    } catch {
      return false;
    }
  }
};

const cleanEditableText = (element) => {
  return (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ");
};

const applySavedEdits = () => {
  const edits = readSavedEdits();
  document.querySelectorAll(editableSelector).forEach((element) => {
    const value = edits[element.dataset.editKey];
    if (typeof value === "string" && value.length > 0) {
      element.textContent = value;
    }
  });
};

const setEditStatus = (message) => {
  const status = document.querySelector("[data-edit-status]");
  if (status) {
    status.textContent = message;
  }
};

const savePageEdits = () => {
  const edits = {};
  document.querySelectorAll(editableSelector).forEach((element) => {
    edits[element.dataset.editKey] = cleanEditableText(element);
    element.textContent = edits[element.dataset.editKey];
  });
  const saved = writeSavedEdits(edits);
  setEditStatus(saved ? "Saved" : "Storage blocked");
};

const createEditToolbar = () => {
  if (document.querySelector("[data-edit-toolbar]")) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "edit-toolbar";
  toolbar.setAttribute("data-edit-toolbar", "");
  toolbar.setAttribute("role", "region");
  toolbar.setAttribute("aria-label", "Page editing controls");
  toolbar.innerHTML = `
    <strong>Edit mode</strong>
    <button type="button" data-edit-save>Save</button>
    <button type="button" data-edit-reset>Reset</button>
    <button type="button" data-edit-exit>Exit</button>
    <span class="edit-status" data-edit-status>Click text to change it</span>
  `;

  toolbar.querySelector("[data-edit-save]").addEventListener("click", savePageEdits);
  toolbar.querySelector("[data-edit-reset]").addEventListener("click", () => {
    try {
      window.localStorage.removeItem(editStorageKey);
      window.sessionStorage.removeItem(editStorageKey);
    } catch {
      try {
        window.sessionStorage.removeItem(editStorageKey);
      } catch {}
    }
    window.location.reload();
  });
  toolbar.querySelector("[data-edit-exit]").addEventListener("click", () => {
    savePageEdits();
    document.body.classList.remove("edit-mode");
    document.querySelectorAll(editableSelector).forEach((element) => {
      element.removeAttribute("contenteditable");
      element.removeAttribute("tabindex");
      element.removeAttribute("spellcheck");
    });
    toolbar.remove();
    editModeActive = false;
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    if (window.location.hash === "#edit") {
      url.hash = "";
    }
    window.history.replaceState({}, "", url);
  });

  document.body.appendChild(toolbar);
};

const enableEditMode = () => {
  if (editModeActive) {
    return;
  }

  editModeActive = true;
  document.body.classList.add("edit-mode");
  document.querySelectorAll(editableSelector).forEach((element) => {
    element.setAttribute("contenteditable", "plaintext-only");
    element.setAttribute("spellcheck", "true");
    element.setAttribute("tabindex", "0");
    element.addEventListener("input", () => setEditStatus("Unsaved"));
  });
  createEditToolbar();

  const url = new URL(window.location.href);
  url.searchParams.set("edit", "1");
  window.history.replaceState({}, "", url);
};

applySavedEdits();
syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("nav-open", isOpen);
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  contactForm.reset();
  formNote.textContent = "Thanks. Our team will call you back shortly.";
  formNote.classList.add("success");
});

document.addEventListener("keydown", (event) => {
  const isEditShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "e";
  if (isEditShortcut) {
    event.preventDefault();
    enableEditMode();
  }
});

const editRequested = new URLSearchParams(window.location.search).has("edit") || window.location.hash === "#edit";
if (editRequested) {
  enableEditMode();
}
