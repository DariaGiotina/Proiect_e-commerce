// Asks before submitting any form marked with data-confirm (used for deletes).
document.addEventListener('submit', (event) => {
  const message = event.target.dataset?.confirm;
  if (message && !window.confirm(message)) {
    event.preventDefault();
  }
});

// Shows a preview of the image picked in the admin product form.
document.addEventListener('change', (event) => {
  const input = event.target;
  if (!input.matches?.('[data-preview-input]')) return;
  const preview = input.closest('form')?.querySelector('[data-image-preview]');
  const file = input.files?.[0];
  if (!preview || !file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    preview.src = reader.result;
    preview.hidden = false;
  });
  reader.readAsDataURL(file);
});
