document.addEventListener("DOMContentLoaded", function () {
  // 1. CONFIGURATION
  const searchModalEl = document.getElementById("searchModal");
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("searchResults");

  // Key penyimpanan index submenu (isi modul) di localStorage
  const SUBMENU_STORE_KEY = "sidebar_submenu_index";

  // --- SUBMENU (ISI SIDEBAR) ---------------------------------------------
  // Sidebar Simhai bersifat "flat": tiap modul (mis. Rekam Medis) hanya 1 link,
  // sedangkan isinya (Pasien, Tarif Tindakan, ICD 9, dst) dirender sebagai kartu
  // pada halaman modul. Kartu-kartu itu kita rekam ke localStorage supaya tetap
  // bisa dicari dari halaman manapun (single source of truth = kartu yg dirender).

  function loadSubmenuStore() {
    try {
      return JSON.parse(localStorage.getItem(SUBMENU_STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveSubmenuStore(store) {
    try {
      localStorage.setItem(SUBMENU_STORE_KEY, JSON.stringify(store));
    } catch (e) {
      /* storage penuh / diblokir: abaikan */
    }
  }

  // Rekam kartu (isi modul) pada halaman saat ini ke localStorage.
  function indexPageCards() {
    const cards = document.querySelectorAll(
      "#cardSearchList .card-search-item a.card-icon-link, .card-icon-link",
    );
    if (!cards.length) return;

    // Nama modul diambil dari judul kartu halaman (mis. "Modul Master Data Rekam Medis")
    const titleEl = document.querySelector(
      ".content-wrapper .card .card-title, .content .card-title",
    );
    const moduleName = titleEl ? titleEl.textContent.trim() : "Isi Modul";

    const store = loadSubmenuStore();
    let changed = false;

    cards.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#" || href === "javascript:void(0)") return;
      const name = (a.getAttribute("title") || a.textContent).trim();
      if (!name) return;

      const prev = store[href];
      if (!prev || prev.name !== name || prev.category !== moduleName) {
        store[href] = { name: name, category: moduleName };
        changed = true;
      }
    });

    if (changed) saveSubmenuStore(store);
  }

  // Rekam kartu halaman ini sesegera mungkin (tidak bergantung pada modal)
  indexPageCards();

  // Check if elements exist
  if (!searchModalEl || !searchInput || !resultsContainer) {
    console.error("Find Menu: Required elements not found", {
      searchModalEl: !!searchModalEl,
      searchInput: !!searchInput,
      resultsContainer: !!resultsContainer,
    });
    return;
  }

  const bsModal = new bootstrap.Modal(searchModalEl);

  let menuItems = [];

  // Fungsi Helper: Menentukan Kategori (Navbar vs Sidebar vs Submenu)
  function getCategory(link) {
    // Cek 1: Apakah di dalam Navbar Dropdown?
    const dropdownMenu = link.closest(".dropdown-menu");
    if (dropdownMenu) {
      const triggerId = dropdownMenu.getAttribute("aria-labelledby");
      const trigger = triggerId ? document.getElementById(triggerId) : null;
      if (trigger) return "Navbar: " + trigger.textContent.trim();
      return "Navbar Submenu";
    }

    // Cek 2: Apakah di dalam Sidebar Submenu?
    // Simhai structure: .sidebar nav ul li ul.submenu li a
    const submenu = link.closest(".submenu");
    if (submenu && link.closest(".sidebar")) {
      const parentLi = submenu.parentElement;
      if (parentLi) {
        // Parent trigger is the <a> sibling of <ul> (usually the first child of li)
        const parentLink = parentLi.querySelector("a");
        if (parentLink) {
          const textSpan = parentLink.querySelector(".text");
          const parentName = textSpan
            ? textSpan.textContent.trim()
            : parentLink.textContent.trim();
          return "Sidebar: " + parentName;
        }
      }
    }

    // Cek 3: Tentukan Parent Utama
    if (link.closest(".nav-header") || link.closest(".nav-account"))
      return "Navbar";
    if (link.closest(".sidebar")) return "Sidebar";

    return "General";
  }

  // 2. INDEXING FUNCTION
  function indexMenuItems() {
    menuItems = [];

    // SELECTOR GABUNGAN:
    // 1. .nav-header a (Link Navbar)
    // 2. .dropdown-item (Submenu Navbar including Profile)
    // 3. .sidebar a (Semua link di dalam Sidebar)
    const selectors =
      ".nav-header a, .dropdown-menu .dropdown-item, .sidebar a";

    const links = document.querySelectorAll(selectors);
    const seenHref = new Set();

    links.forEach((link) => {
      // Abaikan link disabled, kosong, atau yang hanya berfungsi sebagai toggle (bukan link navigasi nyata)
      // Simhai sidebar toggles have href="#" or href="javascript:void(0)"
      const href = link.getAttribute("href");
      if (
        link.classList.contains("disabled") ||
        link.textContent.trim() === "" ||
        !href ||
        href === "#" ||
        href === "javascript:void(0)" ||
        link.hasAttribute("data-bs-toggle")
      ) {
        return;
      }

      const category = getCategory(link);

      // Extract name - prioritize .text span for Sidebar items
      let name = link.textContent.trim();
      const textSpan = link.querySelector(".text");
      if (textSpan) {
        name = textSpan.textContent.trim();
      }

      seenHref.add(href);
      menuItems.push({
        name: name,
        category: category,
        href: href,
      });
    });

    // Gabungkan submenu (isi modul) yang sudah terekam di localStorage,
    // sehingga isi sidebar tetap bisa dicari dari halaman manapun.
    const store = loadSubmenuStore();
    Object.keys(store).forEach((href) => {
      if (seenHref.has(href)) return; // sudah ada sebagai link nyata di halaman
      seenHref.add(href);
      menuItems.push({
        name: store[href].name,
        category: store[href].category,
        href: href,
        isSubmenu: true,
      });
    });
  }

  // 3. SEARCH LOGIC (Sama seperti sebelumnya)
  searchInput.addEventListener("input", function (e) {
    const query = e.target.value.toLowerCase();
    resultsContainer.innerHTML = "";

    if (query.length === 0) return;

    const filtered = menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML =
        '<div class="p-3 text-muted text-center">Tidak ada hasil ditemukan</div>';
      return;
    }

    filtered.forEach((item) => {
      const a = document.createElement("a");
      a.href = item.href;
      a.className = "list-group-item list-group-item-action";
      // Styling badge kategori
      let badgeClass = "bg-secondary";
      if (item.isSubmenu) {
        badgeClass = "bg-success";
      } else if (item.category.includes("Sidebar")) {
        badgeClass = "bg-primary";
      }

      a.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <span class="fw-bold">${item.name}</span>
                    <small class="badge ${badgeClass} bg-opacity-75">${item.category}</small>
                </div>
            `;
      a.addEventListener("click", () => bsModal.hide());
      resultsContainer.appendChild(a);
    });
  });

  // 4. HOTKEY LISTENER (Ctrl + K atau Ctrl + F)
  document.addEventListener("keydown", function (event) {
    // Ctrl + F (atau Ctrl + K yang umum dipakai untuk Command Palette)
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "f" || event.key === "k")
    ) {
      console.log("Find Menu: Hotkey pressed", event.key);
      event.preventDefault();
      indexMenuItems(); // Re-index saat dibuka untuk memastikan data terbaru
      bsModal.show();
    }
  });

  // 5. AUTO FOCUS - Delay to allow Bootstrap to complete aria-hidden update
  searchModalEl.addEventListener("shown.bs.modal", function () {
    searchInput.value = "";
    resultsContainer.innerHTML = "";
    // Small delay to ensure Bootstrap has removed aria-hidden
    setTimeout(() => {
      searchInput.focus();
    }, 100);
  });
});
