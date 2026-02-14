"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/i18n";

export default function AboutPage() {
  const { locale, setLocale, t } = useLocale();
  const [checking, setChecking] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    void supabase.auth.getUser().then(() => {
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/photos.jpg";
    if (img.complete) { setImageLoaded(true); return; }
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
  }, []);

  const handleLogin = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  if (checking || !imageLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-32 rounded skeleton-shimmer" />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/photos.jpg" alt="" className="max-w-xs mx-auto mt-10 md:mt-10" />

      <section className="max-w-lg mx-auto px-6 pt-4 pb-20 md:pt-4 md:pb-28">
        <h1 className="animate-fade-in-up font-[var(--font-playfair-display)] text-4xl md:text-5xl font-semibold tracking-tight text-stone-900 mb-10">
          tarie
        </h1>
        <div className="animate-fade-in-up delay-200 space-y-4 text-base text-stone-600 leading-relaxed">
          <p>{t("aboutBody1")}</p>
          <p>{t("aboutBody2")}</p>
          <p>{t("aboutBody3")}</p>
          <p>{t("aboutBody4")}</p>
        </div>
        <div className="animate-fade-in-up delay-400 mt-10 flex flex-col sm:flex-row items-start gap-4">
          <button
            onClick={() => void handleLogin()}
            className="rounded-full bg-stone-900 px-8 py-3 text-base font-medium text-white hover:bg-stone-700 transition-colors focus-ring"
          >
            {t("getStarted")}
          </button>
          <Link
            href="https://www.tarie.art/s/cxasdcey"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-8 py-3 text-base text-stone-600 hover:border-stone-500 hover:text-stone-900 transition-colors focus-ring"
          >
            {t("viewSample")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <span className="text-base text-stone-400 tracking-widest uppercase">
            tarie
          </span>
          <button
            onClick={() => setLocale(locale === "ja" ? "en" : "ja")}
            className="text-base text-stone-400 hover:text-stone-600 transition-colors"
          >
            {locale === "ja" ? "English" : "日本語"}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-base text-stone-400 hover:text-stone-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-base text-stone-400 hover:text-stone-600 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </main>
  );
}
