document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();

  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  // Follow interaction
  const followButton = document.getElementById("follow-button");
  const followerCount = document.getElementById("follower-count");
  let following = false;
  followButton.addEventListener("click", () => {
    following = !following;
    followButton.textContent = following ? "Following" : "Follow";
    followButton.classList.toggle("following", following);
    followerCount.textContent = following ? "4" : "3";
    showToast(following ? "You're now following Edrain." : "You unfollowed Edrian.");
  });

  // Tabs
  const tabs = [...document.querySelectorAll(".profile-tab")];
  const panels = [...document.querySelectorAll(".tab-panel")];
  function activateTab(tabName) {
    const known = ["overview", "repositories", "projects", "packages", "stars"];
    const name = known.includes(tabName) ? tabName : "overview";
    tabs.forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    panels.forEach(panel => panel.classList.toggle("active-panel", panel.id === `panel-${name}`));
    if (name === "repositories") renderRepositories();
    if (window.lucide) window.lucide.createIcons();
  }
  tabs.forEach(tab => tab.addEventListener("click", event => {
    event.preventDefault();
    const name = tab.dataset.tab;
    history.replaceState(null, "", `#${name}`);
    activateTab(name);
  }));
  document.querySelectorAll("[data-tab-link]").forEach(link => link.addEventListener("click", event => {
    const target = link.dataset.tabLink;
    if (["overview", "repositories", "projects", "packages", "stars"].includes(target)) {
      event.preventDefault();
      history.replaceState(null, "", `#${target}`);
      activateTab(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      event.preventDefault();
      showToast(`${link.textContent.trim()} is a demo navigation item.`);
    }
  }));
  const initial = location.hash.replace("#", "");
  if (initial) activateTab(initial);

  // Mock contribution graph (52 weeks x 7 days)
  const grid = document.getElementById("contribution-grid");
  const tooltip = document.getElementById("graph-tooltip");
  const totalWeeks = 52;
  const totalDays = totalWeeks * 7;
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1));
  start.setHours(12, 0, 0, 0);
  const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
  let total = 0;
  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    // Stable pseudo-random pattern, with quieter weekends.
    let seed = Math.abs(Math.sin((i + 17) * 12.9898) * 43758.5453) % 1;
    if (day.getDay() === 0 || day.getDay() === 6) seed *= .64;
    let level = seed > .91 ? 4 : seed > .76 ? 3 : seed > .55 ? 2 : seed > .32 ? 1 : 0;
    if (Math.random() < .09) level = 0;
    const counts = [0, 1, 3, 6, 10];
    const count = counts[level];
    total += count;
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `contribution-cell level-${level}`;
    cell.setAttribute("aria-label", `${count} contributions on ${dateFmt.format(day)}`);
    cell.title = `${count} contributions on ${dateFmt.format(day)}`;
    cell.addEventListener("mouseenter", () => { tooltip.textContent = `${count} contribution${count === 1 ? "" : "s"} on ${dateFmt.format(day)}`; });
    cell.addEventListener("focus", () => { tooltip.textContent = `${count} contribution${count === 1 ? "" : "s"} on ${dateFmt.format(day)}`; });
    grid.appendChild(cell);
  }
  document.getElementById("contribution-total").textContent = total.toLocaleString("en-US");

  // Month labels aligned approximately to week columns.
  const monthLabels = document.getElementById("month-labels");
  const months = [];
  for (let w = 0; w < totalWeeks; w++) {
    const d = new Date(start);
    d.setDate(start.getDate() + w * 7);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    if (!months.length || months[months.length - 1].label !== label) months.push({ label, week: w });
  }
  monthLabels.innerHTML = "";
  months.forEach(item => {
    const span = document.createElement("span");
    span.textContent = item.label;
    span.style.gridColumn = `${Math.min(item.week + 1, 12)} / span 1`;
    monthLabels.appendChild(span);
  });

  // Search modal
  const modal = document.getElementById("search-modal");
  const searchInput = document.getElementById("global-search-input");
  const searchResults = document.getElementById("search-results");
  const repoCards = [...document.querySelectorAll(".repo-card")];
  const searchItems = [
    ...repoCards.map(card => ({ name: card.dataset.name, description: card.dataset.description, type: "Repository", icon: "book-marked", tab: "repositories" })),
    { name: "React", description: "JavaScript UI library", type: "Tech stack", icon: "code", tab: "overview" },
    { name: "Python", description: "Programming language", type: "Tech stack", icon: "code", tab: "overview" },
    { name: "Student Productivity Suite", description: "Project in progress", type: "Project", icon: "layout-dashboard", tab: "projects" },
    { name: "Campus Sustainability Map", description: "Project prototype", type: "Project", icon: "layout-dashboard", tab: "projects" },
    { name: "Achievements", description: "Badges and milestones", type: "Profile", icon: "award", tab: "overview" }
  ];
  function openSearch() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    searchInput.value = "";
    renderSearch("");
    setTimeout(() => searchInput.focus(), 30);
  }
  function closeSearch() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
  function renderSearch(query) {
    const q = query.trim().toLowerCase();
    const matches = searchItems.filter(item => `${item.name} ${item.description} ${item.type}`.toLowerCase().includes(q)).slice(0, 8);
    searchResults.innerHTML = "";
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "search-hint";
      empty.textContent = "No results found. Try another search.";
      searchResults.appendChild(empty);
      return;
    }
    matches.forEach(item => {
      const button = document.createElement("button");
      button.className = "search-result";
      button.type = "button";
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", item.icon);
      const name = document.createElement("span");
      name.textContent = item.name;
      const type = document.createElement("small");
      type.textContent = item.type;
      button.append(icon, name, type);
      button.addEventListener("click", () => {
        closeSearch();
        activateTab(item.tab);
        history.replaceState(null, "", `#${item.tab}`);
        if (item.tab === "repositories") {
          const filter = document.getElementById("repo-filter");
          if (filter) filter.value = item.name;
          renderRepositories();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      searchResults.appendChild(button);
    });
    if (window.lucide) window.lucide.createIcons();
  }
  searchInput.addEventListener("input", () => renderSearch(searchInput.value));
  document.getElementById("search-focus").addEventListener("click", openSearch);
  document.getElementById("mobile-search-focus").addEventListener("click", openSearch);
  document.querySelectorAll("[data-close-search]").forEach(el => el.addEventListener("click", closeSearch));
  document.addEventListener("keydown", event => {
    if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault(); openSearch();
    }
    if (event.key === "Escape") closeSearch();
  });

  // Repository list tab with filter and sort.
  const repositoryList = document.getElementById("repository-list");
  const filterInput = document.getElementById("repo-filter");
  let sortAZ = true;
  function renderRepositories() {
    if (!repositoryList) return;
    const q = filterInput ? filterInput.value.toLowerCase().trim() : "";
    const cards = [...repoCards].filter(card => `${card.dataset.name} ${card.dataset.description}`.toLowerCase().includes(q));
    cards.sort((a, b) => sortAZ ? a.dataset.name.localeCompare(b.dataset.name) : b.dataset.name.localeCompare(a.dataset.name));
    repositoryList.innerHTML = "";
    if (!cards.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No repositories match your search.";
      repositoryList.appendChild(empty);
      return;
    }
    cards.forEach(card => {
      const row = document.createElement("article");
      row.className = "repo-row";
      const title = card.querySelector(".repo-title").cloneNode(true);
      const desc = document.createElement("p");
      desc.textContent = card.dataset.description;
      const meta = card.querySelector(".repo-meta").cloneNode(true);
      row.append(title, desc, meta);
      row.querySelector(".repo-link").addEventListener("click", e => { e.preventDefault(); showToast(`${card.dataset.name}: demo repository preview.`); });
      repositoryList.appendChild(row);
    });
    if (window.lucide) window.lucide.createIcons();
  }
  if (filterInput) filterInput.addEventListener("input", renderRepositories);
  document.getElementById("sort-repos").addEventListener("click", event => {
    sortAZ = !sortAZ;
    event.currentTarget.innerHTML = `<i data-lucide="arrow-down-wide-narrow"></i> Sort: ${sortAZ ? "A–Z" : "Z–A"}`;
    if (window.lucide) window.lucide.createIcons();
    renderRepositories();
  });
  document.querySelectorAll(".repo-card .repo-link").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    showToast(`${link.textContent.trim()}: demo repository preview.`);
  }));
  document.querySelector(".mobile-menu").addEventListener("click", () => {
    showToast("Menu is under maintenance.");
  });
  document.querySelector(".select-button").addEventListener("click", () => showToast("Showing mock activity for the past year."));
});
