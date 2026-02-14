import { Suspense } from "react";
import HomeClient from "./HomeClient";

const SHIMMER_OFFSETS = [0, -700, -300, -1200, -500, -1000, -200, -800];

function HomeSkeleton() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))" }}>
          {SHIMMER_OFFSETS.map((offset, i) => (
            <div key={i} className="aspect-square skeleton-shimmer" style={{ animationDelay: `${offset}ms` }} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeClient />
    </Suspense>
  );
}
