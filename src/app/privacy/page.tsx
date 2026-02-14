import type { Metadata } from "next";
import { detectLocaleFromHeaders } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPage() {
  const locale = await detectLocaleFromHeaders();
  const isJa = locale === "ja";

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-20">
      <h1 className="font-[var(--font-playfair-display)] text-3xl font-semibold tracking-tight text-stone-900 mb-10">
        {isJa ? "プライバシーポリシー" : "Privacy Policy"}
      </h1>

      <div className="space-y-8 text-sm text-stone-700 leading-relaxed">
        <p>{isJa ? "最終更新日: 2026年3月6日" : "Last updated: March 6, 2026"}</p>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "1. 運営者" : "1. Operator"}
          </h2>
          <p>
            {isJa
              ? <>tarieは<a href="https://x.com/moeki00" className="underline hover:text-stone-900">川上萌稀</a>（個人）が運営しています。</>
              : <>tarie is operated by <a href="https://x.com/moeki00" className="underline hover:text-stone-900">Moeki Kawakami</a> (individual).</>}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "2. 収集する情報" : "2. Information We Collect"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>{isJa ? "アカウント情報" : "Account information"}</strong> &mdash;{" "}
              {isJa
                ? "Googleでサインインすると、Googleからお名前、メールアドレス、プロフィール画像を受け取ります。"
                : "When you sign in with Google, we receive your name, email address, and profile picture from Google."}
            </li>
            <li>
              <strong>{isJa ? "作成コンテンツ" : "Content you create"}</strong> &mdash;{" "}
              {isJa
                ? "サービス内でアップロードまたは作成した原稿、画像、メタデータ。"
                : "Manuscripts, images, and metadata you upload or write within the service."}
            </li>
            <li>
              <strong>{isJa ? "利用データ" : "Usage data"}</strong> &mdash;{" "}
              {isJa
                ? "閲覧ページ、操作、ブラウザ種別、デバイス情報など、サービス改善のために自動的に収集される情報。"
                : "Pages visited, actions taken, browser type, and device information collected automatically for service improvement."}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "3. 情報の利用目的" : "3. How We Use Your Information"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isJa ? "サービスの提供および維持" : "To provide and maintain the service"}</li>
            <li>{isJa ? "本人確認" : "To authenticate your identity"}</li>
            <li>{isJa ? "写真集の保存と表示" : "To save and display your photo books"}</li>
            <li>{isJa ? "サービスの改善" : "To improve the service"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "4. データの保管" : "4. Data Storage"}
          </h2>
          <p>
            {isJa
              ? "データはSupabaseのインフラに保管されます。情報の保護に合理的な措置を講じていますが、絶対的な安全性を保証することはできません。"
              : "Your data is stored on Supabase infrastructure. We take reasonable measures to protect your information but cannot guarantee absolute security."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "5. 第三者サービス" : "5. Third-Party Services"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google OAuth</strong> &mdash; {isJa ? "認証のため" : "for authentication"}</li>
            <li><strong>Supabase</strong> &mdash; {isJa ? "データ保管および認証のため" : "for data storage and authentication"}</li>
          </ul>
          <p className="mt-2">
            {isJa
              ? "個人情報を第三者に販売することはありません。"
              : "We do not sell your personal information to third parties."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "6. 公開コンテンツ" : "6. Published Content"}
          </h2>
          <p>
            {isJa
              ? "写真集を公開すると、共有URLを通じて一般にアクセス可能になります。未公開の下書きはアカウント内でのみ閲覧可能です。"
              : "When you publish a photo book, its content becomes publicly accessible via a shareable URL. Unpublished drafts remain private to your account."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "7. データの削除" : "7. Data Deletion"}
          </h2>
          <p>
            {isJa
              ? "エディタからいつでも本を削除できます。アカウント全体の削除を希望される場合は、以下の連絡先までお問い合わせください。"
              : "You may delete your books at any time from the editor. To request full account deletion, please contact us at the address below."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "8. ポリシーの変更" : "8. Changes to This Policy"}
          </h2>
          <p>
            {isJa
              ? "本ポリシーは随時更新されることがあります。変更はこのページに更新日とともに掲載されます。"
              : "We may update this policy from time to time. Changes will be posted on this page with an updated date."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "9. お問い合わせ" : "9. Contact"}
          </h2>
          <p>
            <a href="https://x.com/moeki00" className="underline hover:text-stone-900">{isJa ? "川上萌稀" : "Moeki Kawakami"}</a><br />
            Email: hi@tarie.art<br />
            {isJa ? "電話" : "Phone"}: 080-3302-7486
          </p>
        </section>
      </div>
    </main>
  );
}
