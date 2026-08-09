import { useEffect, useRef, useState } from "react";

interface NavbarScrollState {
  isVisible: boolean;
  scrolled: boolean;
}

export function useNavbarScroll(closeMenu: () => void): NavbarScrollState {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let framePending = false;
    let frameRequest: number | null = null;

    const updateScrollState = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY <= 0 || currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false);
        closeMenu();
      }

      lastScrollY.current = currentScrollY;
      framePending = false;
    };

    const scheduleScrollUpdate = () => {
      if (!framePending) {
        framePending = true;
        frameRequest = window.requestAnimationFrame(updateScrollState);
      }
    };

    lastScrollY.current = window.scrollY;
    setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", scheduleScrollUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleScrollUpdate);
      if (frameRequest !== null) {
        window.cancelAnimationFrame(frameRequest);
      }
    };
  }, [closeMenu]);

  return { isVisible, scrolled };
}
