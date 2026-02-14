"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiUser } from "react-icons/fi";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/i18n";

const HIDDEN_PREFIXES = [
  "/s/",
  "/about",
  "/privacy",
  "/terms",
  "/guide",
  "/i/",
];

export function AppHeader({ children }: { children?: ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (hidden) return;
    const supabase = getBrowserSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
    });
    return () => subscription.unsubscribe();
  }, [hidden]);

  if (hidden) return null;

  const handleLogout = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
  };

  return (
    <header className="py-2.5 z-40">
      <div className="w-full max-w-5xl mx-auto px-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center hover:opacity-70 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="tarie" className="h-6 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          {children}

          {loading && !userEmail && (
            <div className="w-[30px] h-[30px] rounded-full skeleton-shimmer bg-stone-100" />
          )}
          {userEmail && (
            <DropdownMenu.Root open={accountOpen} onOpenChange={setAccountOpen}>
              <DropdownMenu.Trigger asChild>
                <button
                  className="cursor-pointer text-stone-400 hover:text-stone-700 transition-colors select-none inline-flex items-center focus-ring rounded-full p-1.5"
                  aria-label={t("ariaAccountMenu")}
                >
                  <FiUser size={18} aria-hidden />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="min-w-56 rounded-lg border border-stone-200 bg-white py-2 shadow-md animate-scale-in dropdown-animate origin-[var(--radix-dropdown-menu-content-transform-origin)] z-50 text-base text-stone-500"
                >
                  <p className="break-all text-stone-500 px-4 py-1.5">
                    {userEmail}
                  </p>
                  <DropdownMenu.Separator className="my-1.5 border-t border-stone-100" />
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/settings"
                      className="block px-4 py-1.5 text-stone-600 hover:bg-stone-50 hover:text-stone-900 outline-none cursor-default transition-colors"
                    >
                      {t("settingsTitle")}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/about"
                      className="block px-4 py-1.5 text-stone-600 hover:bg-stone-50 hover:text-stone-900 outline-none cursor-default transition-colors"
                    >
                      {t("about")}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1.5 border-t border-stone-100" />
                  <DropdownMenu.Item
                    onSelect={() => void handleLogout()}
                    className="w-full text-left px-4 py-1.5 text-stone-400 hover:bg-stone-50 hover:text-stone-700 outline-none cursor-default transition-colors"
                  >
                    {t("logout")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
    </header>
  );
}
