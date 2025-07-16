"use client";

import { useEffect } from "react";
import { initializeCookieConsent } from "../utils/cookieConsent";

export default function CookieConsent(): null {
  useEffect(() => {
    initializeCookieConsent();
  }, []);

  return null;
}
