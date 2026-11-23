document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("main-content");

  const loadPage = async (pageName) => {
    try {
      const response = await fetch(`pages/${pageName}.html`);
      if (!response.ok) throw new Error(`Halaman ${pageName} belum dibuat`);

      const htmlText = await response.text();
      mainContent.innerHTML = htmlText;

      // Update status active di menu sidebar kiri
      document.querySelectorAll(".main-nav .nav-link").forEach((nav) => {
        nav.classList.remove("active");
        if (nav.getAttribute("data-target") === pageName) {
          nav.classList.add("active");
        }
      });
    } catch (error) {
      mainContent.innerHTML = `<div style="padding: 2rem; color: #ff5555;"><h3>Error: ${error.message}</h3></div>`;
    }
  };

  // Event Delegation: Menangkap semua klik pada elemen yang punya class .nav-link
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (link) {
      e.preventDefault();
      const targetPage = link.getAttribute("data-target");
      if (targetPage) loadPage(targetPage);
    }
  });

  // Load Home pertama kali
  loadPage("home");
});
