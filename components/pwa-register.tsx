"use client";

import * as React from "react";

export function PwaRegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onLoad = () => {
      if ("serviceWorker" in navigator) {
        (async () => {
          try {
            await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          } catch {
            // noop
          }
        })();
      }
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

export default PwaRegister;
