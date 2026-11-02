"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

export default function QrPage() {
  const [dataUrl, setDataUrl] = useState<string>("");
  const siteUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_SITE_URL || "";
    }
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }, []);

  useEffect(() => {
    if (!siteUrl) return;
    QRCode.toDataURL(siteUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#06120e", light: "#ffffff" },
    }).then(setDataUrl);
  }, [siteUrl]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "olympiad-vote-qr.png";
    a.click();
  }

  return (
    <main className="qr-page">
      <h1>QR-код голосования</h1>
      <p>
        Распечатайте или скачайте QR — он ведёт на страницу голосования. После
        деплоя задайте <code>NEXT_PUBLIC_SITE_URL</code>, чтобы QR всегда
        указывал на продакшен-адрес.
      </p>

      {dataUrl ? (
        <div className="qr-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} width={280} height={280} alt="QR-код на страницу голосования" />
        </div>
      ) : (
        <p>Генерация QR…</p>
      )}

      <p className="qr-url">{siteUrl || "URL ещё не определён"}</p>

      <div className="qr-actions">
        <button type="button" onClick={download} disabled={!dataUrl}>
          Скачать PNG
        </button>
        <Link href="/">К голосованию</Link>
      </div>
    </main>
  );
}
