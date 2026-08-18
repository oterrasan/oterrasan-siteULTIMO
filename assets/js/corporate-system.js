document.addEventListener("DOMContentLoaded", () => {
  const cards = Array.from(document.querySelectorAll(".orbit-card"));
  if (!cards.length) return;

  let activeIndex = 0;
  const activate = () => {
    cards.forEach((card, index) => {
      card.classList.toggle("is-active", index === activeIndex);
    });
    activeIndex = (activeIndex + 1) % cards.length;
  };

  activate();
  window.setInterval(activate, 2400);
});
