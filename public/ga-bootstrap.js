/**
 * Google tag bootstrap.
 *
 * Injected into the production index.html by vite.config.js, immediately before
 * gtag.js. It must be present in the raw HTML so Google's installation checker
 * can detect the tag, but it declares a denied Consent Mode v2 default first so
 * no analytics cookies are stored. The app upgrades consent only after the
 * visitor accepts analytics in the cookie banner.
 */
(function () {
  var current = document.currentScript;
  var id = current && current.getAttribute("data-ga-id");
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
  });
  gtag("js", new Date());
  gtag("config", id, { send_page_view: false });

  window.__htashopGaBootstrapped = true;
})();
