const menuToggle = document.querySelector(".menu-toggle");
const navigationLinks = document.querySelector(".navigation-links");

if (menuToggle && navigationLinks) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
    navigationLinks.classList.toggle("is-open", !isExpanded);
  });

  navigationLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      // Hide the menu after someone chooses a page on a small screen.
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      navigationLinks.classList.remove("is-open");
    }
  });
}

const yearElement = document.querySelector("#current-year");
if (yearElement) {
  // Keep the footer year up to date without editing the HTML each year.
  yearElement.textContent = String(new Date().getFullYear());
}
