import type { Metadata } from "next";
import { detectLocaleFromHeaders } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default async function TermsPage() {
  const locale = await detectLocaleFromHeaders();
  const isJa = locale === "ja";

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-20">
      <h1 className="font-[var(--font-playfair-display)] text-3xl font-semibold tracking-tight text-stone-900 mb-10">
        {isJa ? "利用規約" : "Terms of Service"}
      </h1>

      <div className="space-y-8 text-sm text-stone-700 leading-relaxed">
        <p>{isJa ? "最終更新日: 2026年3月6日" : "Last updated: March 6, 2026"}</p>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "1. 概要" : "1. Overview"}
          </h2>
          <p>
            {isJa
              ? <>本利用規約（以下「本規約」）は、<a href="https://x.com/moeki00" className="underline hover:text-stone-900">川上萌稀</a>が運営するtarie（以下「本サービス」）の利用条件を定めるものです。本サービスを利用することにより、本規約に同意したものとみなされます。</>
              : <>These Terms of Service (&quot;Terms&quot;) govern your use of tarie (the &quot;Service&quot;), operated by <a href="https://x.com/moeki00" className="underline hover:text-stone-900">Moeki Kawakami</a>. By using the Service, you agree to these Terms.</>}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "2. アカウント" : "2. Account"}
          </h2>
          <p>
            {isJa
              ? "写真集の作成・保存にはGoogleアカウントでのサインインが必要です。アカウントでのすべての操作はご本人の責任となります。"
              : "You must sign in with a Google account to create and save photo books. You are responsible for all activity under your account."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "3. コンテンツ" : "3. Your Content"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isJa ? "tarieで作成したコンテンツの権利はすべてご本人に帰属します。" : "You retain all rights to the content you create on tarie."}</li>
            <li>{isJa ? "写真集を公開すると、共有URLを通じてコンテンツをホスト・表示するライセンスをtarieに付与するものとします。" : "By publishing a photo book, you grant tarie a license to host and display that content publicly via the shareable URL."}</li>
            <li>{isJa ? "アップロードする画像およびテキストの使用権限について、ご本人が責任を負います。" : "You are solely responsible for ensuring you have the right to use any images and text you upload."}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "4. 禁止事項" : "4. Prohibited Use"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isJa ? "法令に違反する、または他者の権利を侵害するコンテンツ" : "Content that violates laws or infringes on the rights of others"}</li>
            <li>{isJa ? "自動化されたスクレイピングやサービスの悪用" : "Automated scraping or abuse of the Service"}</li>
            <li>{isJa ? "サービスまたはインフラへの不正アクセスの試み" : "Attempting to gain unauthorized access to the Service or its infrastructure"}</li>
            <li>{isJa ? "マルウェアや有害なコンテンツの配布" : "Distributing malware or harmful content"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "5. サービスの提供" : "5. Service Availability"}
          </h2>
          <p>
            {isJa
              ? "tarieは「現状有姿」で提供され、いかなる保証もありません。予告なくサービスの変更、停止、終了を行う場合があります。"
              : "tarie is provided \"as is\" without warranties of any kind. We may modify, suspend, or discontinue the Service at any time without prior notice."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "6. 免責事項" : "6. Limitation of Liability"}
          </h2>
          <p>
            {isJa
              ? "法律で許容される最大限の範囲において、川上萌稀は本サービスの利用に起因する間接的、偶発的、または結果的な損害（データやコンテンツの喪失を含む）について責任を負いません。"
              : "To the maximum extent permitted by law, Moeki Kawakami shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including loss of data or content."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "7. 利用停止" : "7. Termination"}
          </h2>
          <p>
            {isJa
              ? "本規約に違反した場合、サービスへのアクセスを停止または終了することがあります。いつでもサービスの利用を中止できます。"
              : "We may suspend or terminate your access to the Service if you violate these Terms. You may stop using the Service at any time."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "8. 規約の変更" : "8. Changes to These Terms"}
          </h2>
          <p>
            {isJa
              ? "本規約は随時更新されることがあります。変更後もサービスを継続して利用することで、更新された規約に同意したものとみなされます。"
              : "We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "9. 準拠法" : "9. Governing Law"}
          </h2>
          <p>
            {isJa
              ? "本規約は日本法に準拠します。"
              : "These Terms are governed by the laws of Japan."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-stone-900 mb-2">
            {isJa ? "10. お問い合わせ" : "10. Contact"}
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
