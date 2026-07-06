const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    const target = button.dataset.target;
    views.forEach((view) => {
      view.classList.toggle("active", view.id === target);
    });
  });
});

async function loadData() {
  const response = await fetch("data/tandem.csv");
  const text = await response.text();
  const lines = text.trim().split("\n");

  const dataRows = lines.length - 1;

  const home = document.querySelector("#home .hero-text p");
  if (home) {
    home.insertAdjacentHTML(
      "afterend",
      `<p><strong>Loaded ${dataRows} data rows from tandem.csv.</strong></p>`
    );
  }
}

loadData().catch((error) => {
  console.error("Failed to load data:", error);
});
