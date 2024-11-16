// CountdownNotification.tsx
import React, { useEffect, useState } from "react";
import Notification from "@/components/Notification";

interface CountdownNotificationProps {
  initialSeconds: number;
  onTimeout: () => void;
}

const CountdownNotification: React.FC<CountdownNotificationProps> = ({ initialSeconds, onTimeout }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onTimeout();
    }
  }, [seconds, onTimeout]);

  return (
    <Notification
      message={`Tu sesión expirará en ${seconds} segundos.`}
      type="error"
      onClose={() => setSeconds(0)}
    />
  );
};

export default CountdownNotification;
