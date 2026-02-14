"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { useLocale } from "@/lib/i18n";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const supabase = getBrowserSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        await supabase.auth.signOut();
        window.location.href = "/about";
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen max-w-lg mx-auto px-6 py-20">
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={() => router.back()}
          className="text-stone-400 hover:text-stone-700 transition-colors"
          aria-label={t("ariaGoHome")}
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="font-[var(--font-playfair-display)] text-2xl font-semibold tracking-tight text-stone-900">
          {t("settingsTitle")}
        </h1>
      </div>

      <div className="space-y-8">
        {/* Language */}
        <section>
          <h2 className="text-sm font-medium text-stone-900 mb-3">
            {t("settingsLanguage")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setLocale("ja")}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                locale === "ja"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-600 hover:border-stone-500"
              }`}
            >
              {t("langJa")}
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                locale === "en"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-600 hover:border-stone-500"
              }`}
            >
              {t("langEn")}
            </button>
          </div>
        </section>

        {/* Delete account */}
        <section className="pt-8 border-t border-stone-200">
          {showConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600 leading-relaxed">
                {t("deleteAccountConfirm")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleting}
                  className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? "..." : t("deleteAccountButton")}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:border-stone-500 transition-colors disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              {t("deleteAccount")}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
