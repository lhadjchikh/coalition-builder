import "vanilla-cookieconsent/dist/cookieconsent.css";
import { run } from "vanilla-cookieconsent";

export function initializeCookieConsent() {
  run({
    guiOptions: {
      consentModal: {
        layout: "box",
        position: "bottom right",
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: "box",
        position: "right",
        equalWeightButtons: true,
        flipButtons: false,
      },
    },
    categories: {
      necessary: {
        readOnly: true,
      },
      analytics: {},
    },
    language: {
      default: "en",
      translations: {
        en: {
          consentModal: {
            title: "We use cookies!",
            description:
              "This website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent.",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Only necessary",
            showPreferencesBtn: "Manage preferences",
            footer: '<a href="/privacy">Privacy Policy</a>',
          },
          preferencesModal: {
            title: "Consent Preferences Center",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Only necessary",
            savePreferencesBtn: "Save preferences",
            closeIconLabel: "Close modal",
            serviceCounterLabel: "Service|Services",
            sections: [
              {
                title: "Cookie Usage",
                description:
                  'We use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in/out whenever you want. For more details relative to cookies and other sensitive data, please read the full <a href="/privacy" class="cc-link">privacy policy</a>.',
              },
              {
                title:
                  'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
                description:
                  "These cookies are essential for the proper functioning of the website. Without these cookies, the website would not work properly.",
                linkedCategory: "necessary",
              },
              {
                title: "Analytics Cookies",
                description:
                  "These cookies allow the website to remember the choices you have made in the past.",
                linkedCategory: "analytics",
              },
            ],
          },
        },
      },
    },
  });
}
