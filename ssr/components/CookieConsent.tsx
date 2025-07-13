"use client";

import { useEffect } from "react";
import { initializeCookieConsent } from "../lib/cookieConsent";

export default function CookieConsent() {
  useEffect(() => {
    initializeCookieConsent();
  }, []);

  return null;
}
