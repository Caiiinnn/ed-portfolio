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
    }
  }));
  const initial = location.hash.replace("#", "");
  if (initial) activateTab(initial);

  // Mock contribution graph for the full 2026 calendar year.
  // Contributions are shown from January through October; November and December stay empty.
  const grid = document.getElementById("contribution-grid");
  const tooltip = document.getElementById("graph-tooltip");
  const year = 2026;
  const start = new Date(year, 0, 1, 12, 0, 0, 0);
  const end = new Date(year, 11, 31, 12, 0, 0, 0);
  const totalDays = Math.round((end - start) / 86400000) + 1;
  const totalWeeks = 53;
  const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
  let total = 0;

  // Pad the first week so columns align Sunday through Saturday, like GitHub.
  for (let pad = 0; pad < start.getDay(); pad++) {
    const blank = document.createElement("span");
    blank.className = "contribution-cell contribution-empty";
    blank.setAttribute("aria-hidden", "true");
    grid.appendChild(blank);
  }

  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    let count = 0;

    // Keep the same sparse activity level, and leave Nov-Dec completely empty.
    if (day.getMonth() < 10) {
      let seed = Math.abs(Math.sin((i + 17) * 12.9898) * 43758.5453) % 1;
      if (day.getDay() === 0 || day.getDay() === 6) seed *= .48;
      const level = seed > .985 ? 4 : seed > .95 ? 3 : seed > .88 ? 2 : seed > .72 ? 1 : 0;
      const counts = [0, 1, 2, 4, 7];
      count = counts[level];
    }

    total += count;
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 3 : 4;
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `contribution-cell level-${level}`;
    cell.setAttribute("aria-label", `${count} contributions on ${dateFmt.format(day)}`);
    cell.title = `${count} contributions on ${dateFmt.format(day)}`;
    cell.addEventListener("mouseenter", () => { tooltip.textContent = `${count} contribution${count === 1 ? "" : "s"} on ${dateFmt.format(day)}`; });
    cell.addEventListener("focus", () => { tooltip.textContent = `${count} contribution${count === 1 ? "" : "s"} on ${dateFmt.format(day)}`; });
    grid.appendChild(cell);
  }

  // Pad the final week to keep the year grid rectangular.
  while (grid.children.length < totalWeeks * 7) {
    const blank = document.createElement("span");
    blank.className = "contribution-cell contribution-empty";
    blank.setAttribute("aria-hidden", "true");
    grid.appendChild(blank);
  }
  document.getElementById("contribution-total").textContent = total.toLocaleString("en-US");

  // Place month labels above the week column where each month begins.
  const monthLabels = document.getElementById("month-labels");
  monthLabels.innerHTML = "";
  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
    const dayOffset = Math.round((firstDay - start) / 86400000) + start.getDay();
    const week = Math.floor(dayOffset / 7);
    const span = document.createElement("span");
    span.textContent = firstDay.toLocaleDateString("en-US", { month: "short" });
    span.style.gridColumn = `${week + 1} / span 1`;
    monthLabels.appendChild(span);
  }

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
  const mobileMenuButton = document.querySelector(".mobile-menu");
  const mobileNav = document.querySelector(".mobile-nav");
    if(mobileMenuButton & mobileNav){
      mobileMenuButton.addEventListener("click", () => {
        const isOpen = mobileNav.classList.toggle("open");

        mobileMenuButton.setAttribute("aria-expanded", isOpen);
        mobileNav.setAttribute("aria-hidden", !isOpen);
      })

      mobileNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          mobileNav.classList.remove("open");
          mobileMenuButton.setAttribute("aria-expanded", "false");
          mobileNav.setAttribute("aria-hidden", "true");
        })
      })
    }
});
