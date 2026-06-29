const isPagesRoute = window.location.pathname.includes("/pages/");
const partialBasePath = isPagesRoute ? "./partials/" : "./pages/partials/";

async function loadPartial(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }

    let html = await response.text();

    if (!isPagesRoute) {
      html = html.replaceAll("../landing.html", "landing.html");
      html = html.replaceAll("../pages/", "pages/");
    }

    target.innerHTML = html;
  } catch (error) {
    console.error("BR30 Kart layout error:", error);
  }
}

function initLandingNavbar() {
  const mobileToggle = document.getElementById("mobileToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  mobileToggle?.addEventListener("click", () => {
    mobileMenu?.classList.toggle("show");
    mobileToggle.classList.toggle("active");
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("show");
      mobileToggle?.classList.remove("active");
    });
  });
}

async function initLandingLayout() {
  await loadPartial("landing-navbar", `${partialBasePath}navbar.html`);
  await loadPartial("landing-footer", `${partialBasePath}footer.html`);

  initLandingNavbar();
}

document.addEventListener("DOMContentLoaded", initLandingLayout);
