"use client";

import { useEffect } from "react";
import { initializeCookieConsent } from "../lib/cookieConsent";

export default function CookieConsent(): null {
  useEffect(() => {
    initializeCookieConsent();
  }, []);

  return null;
}
