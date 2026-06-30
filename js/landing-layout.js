const path = window.location.pathname;

const isRootPage = path === "/" || path === "/landing" || path === "/landing.html";

const partialBasePath = "/pages/partials/";

async function loadPartial(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }

    let html = await response.text();

    html = html.replaceAll("../landing.html", "/landing");
    html = html.replaceAll("../pages/", "/company/");

    html = html.replaceAll("landing-how-it-works.html", "/company/how-it-works");
    html = html.replaceAll("landing-supportcommunity.html", "/company/support-community");
    html = html.replaceAll("landing-verify.html", "/company/verify");
    html = html.replaceAll("landing-learn-more.html", "/company/learn-more");
    html = html.replaceAll("landing-view-seller-program.html", "/company/seller-program");
    html = html.replaceAll("landing-terms.html", "/company/terms-and-conditions");
    html = html.replaceAll("landing-privacy.html", "/company/privacy-policy");
    html = html.replaceAll("landing-refund.html", "/company/refund-policy");
    html = html.replaceAll("landing-disclaimer.html", "/company/disclaimer");
    html = html.replaceAll("landing-aboutbr30.html", "/company/about-br30");
    html = html.replaceAll("landing-contact.html", "/company/contact");

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
