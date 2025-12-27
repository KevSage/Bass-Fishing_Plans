import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component - automatically scrolls to top on route changes.
 * Place this component inside BrowserRouter in App.tsx.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
