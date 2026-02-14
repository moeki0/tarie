"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-base">
      {children}
    </code>
  );
}

function ExampleBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="my-4">
      {title && <p className="text-base text-stone-400 mb-1">{title}</p>}
      <pre className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-base leading-relaxed text-stone-700 overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-stone-800 mt-12 mb-4 border-b border-stone-200 pb-2">
        {title}
      </h2>
      <div className="text-sm text-stone-600 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function GuidePage() {
  const { locale } = useLocale();
  const isJa = locale === "ja";

  return (
    <main className="min-h-screen px-6 pt-6 pb-20 max-w-2xl mx-auto">
      <header className="px-6 py-4">
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-[var(--font-playfair-display)] text-xl font-semibold text-stone-800 hover:text-stone-600 transition-colors"
          >
            tarie
          </Link>
          <span className="text-base text-stone-400">
            {isJa ? "書き方ガイド" : "Syntax Guide"}
          </span>
        </div>
      </header>

      <h1 className="text-2xl font-bold text-stone-900 mb-2">
        {isJa ? "原稿シンタックスガイド" : "Manuscript Syntax Guide"}
      </h1>
      <p className="text-sm text-stone-500 mb-8">
        {isJa
          ? "tarieの原稿はプレーンテキストです。テキストと画像URLを書き並べるだけで、自動的にページが組み上がります。"
          : "tarie manuscripts are plain text. Just write text and image URLs, and pages are composed automatically."}
      </p>

      {/* Table of Contents */}
      <nav className="bg-stone-50 rounded-lg p-4 text-sm mb-8">
        <p className="font-medium text-stone-700 mb-2">
          {isJa ? "目次" : "Contents"}
        </p>
        <ol className="list-decimal list-inside space-y-1 text-stone-500">
          <li><a href="#structure" className="hover:text-stone-800 transition-colors">{isJa ? "全体構造" : "Overall Structure"}</a></li>
          <li><a href="#frontmatter" className="hover:text-stone-800 transition-colors">{isJa ? "フロントマター（設定）" : "Frontmatter (Settings)"}</a></li>
          <li><a href="#cover" className="hover:text-stone-800 transition-colors">{isJa ? "表紙" : "Cover Page"}</a></li>
          <li><a href="#page-breaks" className="hover:text-stone-800 transition-colors">{isJa ? "ページ区切り" : "Page Breaks"}</a></li>
          <li><a href="#images" className="hover:text-stone-800 transition-colors">{isJa ? "画像" : "Images"}</a></li>
          <li><a href="#text" className="hover:text-stone-800 transition-colors">{isJa ? "テキスト" : "Text"}</a></li>
          <li><a href="#full-example" className="hover:text-stone-800 transition-colors">{isJa ? "完全な例" : "Full Example"}</a></li>
        </ol>
      </nav>

      {/* 1. Overall Structure */}
      <Section id="structure" title={isJa ? "1. 全体構造" : "1. Overall Structure"}>
        <p>
          {isJa
            ? "原稿は3つのパートで構成されます："
            : "A manuscript consists of three parts:"}
        </p>
        <ExampleBlock>{isJa
? `---
(フロントマター：設定値)
---
(タイトル行：最初の空でない行)

(本文：テキストと画像URL)`
: `---
(Frontmatter: settings)
---
(Title line: first non-empty line)

(Body: text and image URLs)`}</ExampleBlock>
        <p>
          {isJa
            ? "フロントマターは省略可能です。省略した場合、最初の行がタイトルになります。"
            : "Frontmatter is optional. If omitted, the first line becomes the title."}
        </p>
      </Section>

      {/* 2. Frontmatter */}
      <Section id="frontmatter" title={isJa ? "2. フロントマター（設定）" : "2. Frontmatter (Settings)"}>
        <p>
          {isJa
            ? <>原稿の先頭に <Code>---</Code> で囲んだブロックを書くと、本の設定を指定できます。</>
            : <>Place a block enclosed by <Code>---</Code> at the start to configure book settings.</>}
        </p>
        <ExampleBlock>{`---
author: Moeki Kawakami
coverPattern: photo-small-center
transition: fade
fontFamily: serif-jp
photoMargin: 12
---`}</ExampleBlock>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-300">
                <th className="text-left py-2 pr-4 text-stone-700 font-medium">{isJa ? "キー" : "Key"}</th>
                <th className="text-left py-2 pr-4 text-stone-700 font-medium">{isJa ? "説明" : "Description"}</th>
                <th className="text-left py-2 text-stone-700 font-medium">{isJa ? "値" : "Values"}</th>
              </tr>
            </thead>
            <tbody className="text-stone-600">
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4"><Code>author</Code></td>
                <td className="py-2 pr-4">{isJa ? "著者名（表紙に表示）" : "Author name (shown on cover)"}</td>
                <td className="py-2">{isJa ? "任意のテキスト" : "Any text"}</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4"><Code>coverPattern</Code></td>
                <td className="py-2 pr-4">{isJa ? "表紙レイアウト" : "Cover layout"}</td>
                <td className="py-2">
                  <span className="text-base">photo-overlay, photo-small-center, no-photo-centered, no-photo-minimal, title-only, image-only, split-photo-right</span>
                </td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4"><Code>transition</Code></td>
                <td className="py-2 pr-4">{isJa ? "ページ遷移" : "Page transition"}</td>
                <td className="py-2">none, fade, slide, zoom</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4"><Code>fontFamily</Code></td>
                <td className="py-2 pr-4">{isJa ? "フォント" : "Font"}</td>
                <td className="py-2">serif-jp, sans-jp, playfair, lora, zen-kaku, mplus</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4"><Code>aspectRatio</Code></td>
                <td className="py-2 pr-4">{isJa ? "画像アスペクト比" : "Image aspect ratio"}</td>
                <td className="py-2">3:4, 2:3, 1:1, 4:3, 16:9, 9:16</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4"><Code>photoMargin</Code></td>
                <td className="py-2 pr-4">{isJa ? "画像の余白（px）" : "Photo margin (px)"}</td>
                <td className="py-2">{isJa ? "数値またはCSS値" : "Number or CSS value"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-base text-stone-400 mt-2">
          {isJa
            ? "キーはcamelCase・snake_case両方対応しています（例：coverPattern / cover_pattern）。"
            : "Keys accept both camelCase and snake_case (e.g. coverPattern / cover_pattern)."}
        </p>
      </Section>

      {/* 3. Cover */}
      <Section id="cover" title={isJa ? "3. 表紙" : "3. Cover Page"}>
        <p>
          {isJa
            ? "フロントマターの後、最初の空でない行が表紙タイトルになります。タイトルの直後に続く内容が表紙の一部になります。"
            : "After frontmatter, the first non-empty line becomes the cover title. Content immediately following becomes part of the cover."}
        </p>

        <ExampleBlock title={isJa ? "基本パターン：タイトル + 画像が表紙になる" : "Basic: title + image become the cover"}>{`${isJa ? "夏の旅行記" : "Summer Journey"}

https://example.com/cover.jpg

${isJa ? "本文1ページ目のテキスト..." : "Body page 1 text..."}`}</ExampleBlock>

        <p>
          {isJa
            ? <>タイトルと本文の間に <strong>2行以上の空行</strong> を入れると、タイトルと本文が分離されます。この場合、本文中で最初に見つかった画像が表紙画像として使われます。</>
            : <>If there are <strong>2 or more blank lines</strong> between the title and body, they are separated. The first image found anywhere in the body becomes the cover image.</>}
        </p>

        <ExampleBlock title={isJa ? "分離パターン：タイトルと本文を分ける" : "Separated: title detached from body"}>{`${isJa ? "夏の旅行記" : "Summer Journey"}


${isJa ? "(↑ 2行以上の空行で分離)" : "(↑ 2+ blank lines to separate)"}

${isJa ? "本文1ページ目..." : "Body page 1..."}`}</ExampleBlock>
      </Section>

      {/* 4. Page Breaks */}
      <Section id="page-breaks" title={isJa ? "4. ページ区切り" : "4. Page Breaks"}>
        <p>
          {isJa
            ? "ページの区切り方は2つあります："
            : "There are two ways to break pages:"}
        </p>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "A. 空行2つ以上" : "A. Two or more blank lines"}
        </h3>
        <p>
          {isJa
            ? "テキストのみのページでは、2行以上の連続する空行がページ区切りになります。"
            : "For text-only pages, 2+ consecutive blank lines create a page break."}
        </p>
        <ExampleBlock>{isJa
? `1ページ目のテキスト


2ページ目のテキスト`
: `Page 1 text


Page 2 text`}</ExampleBlock>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "B. 画像がある場合の自動区切り" : "B. Auto-break with images"}
        </h3>
        <p>
          {isJa
            ? "ページに画像が含まれている場合、次の画像URLの前の空行1つでもページが区切られます。つまり画像→空行→画像で自動的にページが分かれます。"
            : "When a page contains an image, even a single blank line before the next image URL creates a page break. So image → blank line → image automatically splits into separate pages."}
        </p>
        <ExampleBlock>{isJa
? `https://example.com/photo1.jpg

https://example.com/photo2.jpg
(↑ これは別ページになる)

テキストとテキストの間は
空行1つではページが分かれない

この行は上と同じページ`
: `https://example.com/photo1.jpg

https://example.com/photo2.jpg
(↑ This becomes a separate page)

Between text and text,
a single blank line does NOT break pages

This line is on the same page as above`}</ExampleBlock>
      </Section>

      {/* 5. Images */}
      <Section id="images" title={isJa ? "5. 画像" : "5. Images"}>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "A. 単体の画像" : "A. Single image"}
        </h3>
        <p>
          {isJa
            ? "行全体がURLだけの場合、画像として表示されます。"
            : "A line that contains only a URL is displayed as an image."}
        </p>
        <ExampleBlock>{`https://example.com/photo.jpg`}</ExampleBlock>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "B. 画像 + キャプション" : "B. Image + caption"}
        </h3>
        <p>
          {isJa
            ? "画像URLの直後の行がURLでない場合、キャプション（説明文）として扱われます。"
            : "If the line immediately after an image URL is not a URL, it becomes a caption."}
        </p>
        <ExampleBlock>{isJa
? `https://example.com/photo.jpg
東京タワー 2026年3月`
: `https://example.com/photo.jpg
Tokyo Tower, March 2026`}</ExampleBlock>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "C. 2枚並び（横並び画像）" : "C. Two images side by side"}
        </h3>
        <p>
          {isJa
            ? "画像URLが2行連続すると、横並びで表示されます。ただし3行以上連続した場合は個別の画像として扱われます。"
            : "Two consecutive image URLs are displayed side by side. Three or more in a row are treated as individual images."}
        </p>
        <ExampleBlock>{`https://example.com/left.jpg
https://example.com/right.jpg`}</ExampleBlock>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "D. インラインラップ（テキスト回り込み）" : "D. Inline wrap (text wrapping)"}
        </h3>
        <p>
          {isJa
            ? "1行の中にテキストとURLが混在している場合、画像が右にフロートしてテキストが回り込みます。"
            : "When text and a URL appear on the same line, the image floats right with text wrapping around it."}
        </p>
        <ExampleBlock>{isJa
? `ここにテキスト https://example.com/photo.jpg さらにテキスト`
: `Some text here https://example.com/photo.jpg and more text`}</ExampleBlock>

        <h3 className="font-medium text-stone-700 mt-4 mb-2">
          {isJa ? "E. 対応する画像URL" : "E. Supported image URLs"}
        </h3>
        <p>
          {isJa
            ? <>http:// または https:// で始まるURLが画像として認識されます。GyazoのページURL（<Code>https://gyazo.com/xxxx</Code>）は自動的に <Code>/raw</Code> 付きの画像URLに変換されます。</>
            : <>URLs starting with http:// or https:// are recognized as images. Gyazo page URLs (<Code>https://gyazo.com/xxxx</Code>) are automatically converted to <Code>/raw</Code> image URLs.</>}
        </p>
      </Section>

      {/* 6. Text */}
      <Section id="text" title={isJa ? "6. テキスト" : "6. Text"}>
        <p>
          {isJa
            ? "URLでない行はすべてテキストブロックとして扱われます。連続するテキスト行は1つのブロックにまとめられます。"
            : "Any line that is not a URL is treated as a text block. Consecutive text lines are grouped into a single block."}
        </p>
        <p>
          {isJa
            ? <>テキストが150文字以上になると、自動的に左寄せレイアウトに切り替わります。短いテキストは中央揃えで表示されます。</>
            : <>When text exceeds 150 characters, the layout automatically switches to left-aligned. Shorter text is centered.</>}
        </p>
        <p>
          {isJa
            ? "テキスト間の空行1つは同じページ内の段落区切りとして保持されます（ページは分かれません）。"
            : "A single blank line between text is preserved as a paragraph break within the same page (no page break)."}
        </p>
      </Section>

      {/* 7. Full Example */}
      <Section id="full-example" title={isJa ? "7. 完全な例" : "7. Full Example"}>
        <p>
          {isJa
            ? "以下はすべての要素を使った原稿の例です："
            : "Here is an example manuscript using all elements:"}
        </p>
        <ExampleBlock>{isJa
? `---
author: 川上 萌木
coverPattern: photo-small-center
transition: fade
fontFamily: zen-kaku
---
夏の旅行記

https://example.com/cover.jpg

https://example.com/sea.jpg
海辺の朝 石川県 2026年8月

朝、海辺の街に着いた。
潮の香りが迎えてくれた。

窓から見える海は、
どこまでも青かった。


港の市場で昼食をとった。

https://example.com/market1.jpg
https://example.com/market2.jpg

午後は路地裏を歩いた。 https://example.com/alley.jpg 古い石畳の道が続いていた。

https://example.com/sunset.jpg
夕暮れの海`
: `---
author: Moeki Kawakami
coverPattern: photo-small-center
transition: fade
fontFamily: zen-kaku
---
Summer Journey

https://example.com/cover.jpg

https://example.com/sea.jpg
Morning by the sea, Ishikawa, August 2026

We arrived at the coastal town in the morning.
The salt air greeted us warmly.

The sea from the window
stretched endlessly blue.


Lunch at the harbor market.

https://example.com/market1.jpg
https://example.com/market2.jpg

We wandered the back streets. https://example.com/alley.jpg Old cobblestone paths stretched on.

https://example.com/sunset.jpg
Sunset over the sea`}</ExampleBlock>

        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mt-4 text-base text-stone-500 space-y-1">
          <p className="font-medium text-stone-600 mb-2">{isJa ? "この原稿が生成するページ：" : "Pages generated from this manuscript:"}</p>
          <p>{isJa ? "表紙" : "Cover"}: {isJa ? "「夏の旅行記」+ cover.jpg（photo-small-center）" : '"Summer Journey" + cover.jpg (photo-small-center)'}</p>
          <p>{isJa ? "2ページ目" : "Page 2"}: sea.jpg + {isJa ? "キャプション「海辺の朝...」" : 'caption "Morning by the sea..."'}</p>
          <p>{isJa ? "3ページ目" : "Page 3"}: {isJa ? "テキスト「朝、海辺の街に...」（空行1つで段落分け、同じページ）" : 'Text "We arrived..." (1 blank line = paragraph, same page)'}</p>
          <p>{isJa ? "4ページ目" : "Page 4"}: {isJa ? "テキスト「港の市場で...」（↑2行空行でページ区切り）" : 'Text "Lunch at..." (↑ 2 blank lines = page break)'}</p>
          <p>{isJa ? "5ページ目" : "Page 5"}: market1.jpg + market2.jpg{isJa ? "（横並び）" : " (side by side)"}</p>
          <p>{isJa ? "6ページ目" : "Page 6"}: {isJa ? "テキスト + alley.jpg（インラインラップ）" : "Text + alley.jpg (inline wrap)"}</p>
          <p>{isJa ? "7ページ目" : "Page 7"}: sunset.jpg + {isJa ? "キャプション「夕暮れの海」" : 'caption "Sunset over the sea"'}</p>
          <p>{isJa ? "クレジット" : "Credit page"}: tarie</p>
        </div>
      </Section>

      <div className="mt-16 pt-8 border-t border-stone-200 text-center">
        <Link
          href="/"
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
        >
          &larr; {isJa ? "ホームに戻る" : "Back to Home"}
        </Link>
      </div>
    </main>
  );
}
