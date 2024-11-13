// hooks/useClickCapture.ts
import { useEffect } from "react";

const useClickCapture = (onClick: (event: MouseEvent) => void) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      onClick(event);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [onClick]);
};

export default useClickCapture;

