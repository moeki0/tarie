"use client";

import { useMemo, useState } from "react";
import type { PhotoBook } from "@/lib/photobook";
import { PreviewStack, buildPages } from "@/app/gallery/[id]/PreviewStack";
import { usePreloadImages } from "@/app/gallery/[id]/useGalleryRuntime";

const SAMPLE_BOOK: PhotoBook = {
  version: 2,
  title: "Weathering",
  coverPhoto: "https://i.gyazo.com/b908f61f04f784393e29d1f9b138331b.jpg",
  photos: [
    { id: "1", url: "https://i.gyazo.com/98afbd73da9dd6ad44a1c2d1b40faeee.jpg" },
    { id: "2", url: "https://i.gyazo.com/d4c2bd19f496a090a92eaa7498954e0a.jpg", caption: "倉庫を出る新幹線 白山 石川県 2026年3月" },
    { id: "3", url: "https://i.gyazo.com/071ca2466bcb8b0d6a2c443a76e79643.jpg", caption: "岩 白山 石川県 2026年2月" },
    { id: "4", url: "https://i.gyazo.com/b908f61f04f784393e29d1f9b138331b.jpg", caption: "消火栓 白山 石川県 2026年3月" },
    { id: "5", url: "https://i.gyazo.com/1e34262b77550431dbf13b8ed19da92b.jpg", caption: "冬の田 白山 石川県 2026年2月" },
    { id: "6", url: "https://i.gyazo.com/7ad24f587e9b47805aa0beafc2bfb8f4.jpg", caption: "公園 金沢 石川県 2026年3月" },
    { id: "7", url: "https://i.gyazo.com/1c021934f1b4fb29a4875fdf8025c086.jpg", caption: "壁 金沢 石川県 2026年3月" },
    { id: "8", text: "生成の時代に\n\nあらゆる情報がものすごい速度で生成されていく\n\n生成された後に残るは風化の道のみ\n\nしかし、その道にこそ美しさがあるのかもしれない" },
  ],
  config: {
    author: "Moeki Kawakami",
    coverPattern: "photo-small-center",
    transition: "zoom",
    fontFamily: "zen-kaku",
  },
};

export default function SamplePage() {
  const [previewIndex, setPreviewIndex] = useState(0);
  const pageList = useMemo(() => buildPages(SAMPLE_BOOK), []);
  usePreloadImages(SAMPLE_BOOK);

  return (
    <main className="w-screen h-screen overflow-hidden bg-white">
      <div className="h-full w-full">
        <PreviewStack
          book={SAMPLE_BOOK}
          activePreviewIndex={Math.min(previewIndex, pageList.length - 1)}
          setPreviewIndex={setPreviewIndex}
          containerClassName="h-full"
        />
      </div>
    </main>
  );
}
