/**
 * Injected into the app's blocked / new-tab page (http://127.0.0.1/blocked).
 *
 * The page's search form submits to Google as a no-extension fallback. When
 * this content script is present, it intercepts the submit and asks the service
 * worker to run the query through Google, so the locked-in results page is
 * always Google (and can be re-skinned by google-skin.js).
 *
 * Listening on the document in the capture phase means we catch the submit
 * before the form's native navigation, regardless of when the form renders.
 */
document.addEventListener(
  "submit",
  (e) => {
    const form = e.target;
    if (!form || form.id !== "lockin-search") return;
    const input = form.querySelector('input[name="q"]');
    const q = input && input.value ? input.value.trim() : "";
    if (!q) return;
    e.preventDefault();
    try {
      chrome.runtime.sendMessage({ type: "lockin-search", q });
    } catch {
      // Extension context gone — let the form's Google fallback proceed.
      form.submit();
    }
  },
  true,
);
