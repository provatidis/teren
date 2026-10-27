// Keep the static fallback usable even when this module cannot be fetched.
// Inert content keeps its layout for native scroll restoration during loading.
// Only a fully initialized page may reveal and enable it.
export async function startPage(load) {
  const notice = document.getElementById('app-startup');
  const content = document.getElementById('app-content');
  const reload = document.getElementById('app-reload');
  reload.hidden = false;
  reload.addEventListener('click', () => location.reload());

  try {
    await load();
    if (content) {
      content.hidden = false;
      content.inert = false;
    }
    notice.dataset.state = 'ready';
    notice.hidden = true;
  } catch (error) {
    if (content) content.hidden = true;
    notice.dataset.state = 'failed';
    document.getElementById('app-startup-title').textContent = 'This page couldn’t finish opening.';
    document.getElementById('app-startup-message').textContent = content
      ? 'The interactive tools are unavailable. Reload this page to try again.'
      : 'Saved shortcuts are unavailable. You can still use the links below, or reload this page to try again.';
    console.error('Teren could not start this page.', error);
  }
}
