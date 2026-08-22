import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef } from "react";

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string) || "";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

export default function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance>(null);
  const emittedRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV && !emittedRef.current) {
      emittedRef.current = true;
      onVerify("dev-bypass-token");
    }
  }, [onVerify]);

  if (import.meta.env.DEV) return null;

  if (!SITE_KEY) {
    console.warn("TurnstileWidget: VITE_TURNSTILE_SITE_KEY is not set");
    return null;
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={SITE_KEY}
      onSuccess={(token) => onVerify(token)}
      onError={onError}
      options={{ theme: "auto", size: "normal" }}
    />
  );
}
