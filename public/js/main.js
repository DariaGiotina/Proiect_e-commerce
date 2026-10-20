// Asks before submitting any form marked with data-confirm (used for deletes).
document.addEventListener('submit', (event) => {
  const message = event.target.dataset?.confirm;
  if (message && !window.confirm(message)) {
    event.preventDefault();
  }
});
