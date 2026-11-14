import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useSearchResultReset(reset) {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.searchTarget) reset("");
  }, [location.key, location.state, reset]);
}
