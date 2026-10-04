"use client";

import { useEffect } from "react";

export function HomepageNavBridge() {
  useEffect(() => {
    const link = document.querySelector<HTMLAnchorElement>('.site-header nav a[href="#about"]');
    if (!link) return;
    const previous = link.getAttribute("href");
    link.setAttribute("href", "/about");
    return () => {
      if (previous) link.setAttribute("href", previous);
    };
  }, []);

  return null;
}
