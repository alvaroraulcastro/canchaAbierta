"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState, useTransition } from "react";
import { processCheckInToken, type CheckInActionResult } from "@/lib/actions/check-in";
import { Button } from "@/components/ui/button";

export function CheckInScanner() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [result, setResult] = useState<CheckInActionResult | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "check-in-qr-reader",
      { fps: 8, qrbox: { width: 240, height: 240 } },
      false,
    );
    scannerRef.current = scanner;
    scanner.render(
      (decoded) => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("token", decoded.trim());
          const response = await processCheckInToken(fd);
          setResult(response);
        });
      },
      () => {},
    );
    return () => {
      void scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  function submitManual() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("token", manualToken.trim());
      const response = await processCheckInToken(fd);
      setResult(response);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div id="check-in-qr-reader" className="overflow-hidden rounded-2xl border border-line" />
      <label className="flex flex-col gap-1 text-sm">
        Pegar código manualmente
        <textarea
          className="field min-h-20 w-full resize-y py-2"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          spellCheck={false}
        />
      </label>
      <Button type="button" disabled={pending || !manualToken.trim()} onClick={submitManual}>
        Validar código
      </Button>
      {result ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${result.ok ? "bg-brand-100 text-brand-950" : "bg-destructive/10 text-destructive"}`}
          role="status"
          aria-live="polite"
        >
          {result.ok
            ? result.alreadyCheckedIn
              ? `${result.playerEmail} ya había ingresado (${result.matchLabel}).`
              : `Ingreso registrado: ${result.playerEmail} · ${result.matchLabel}`
            : result.error}
        </p>
      ) : null}
    </div>
  );
}
