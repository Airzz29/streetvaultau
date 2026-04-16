export default function ReviewsLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 pb-4">
      <div className="h-9 w-60 animate-pulse rounded-lg bg-white/10" />
      <div className="h-5 w-96 animate-pulse rounded bg-white/10" />
      <div className="sticky top-[72px] z-30 rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-xl">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="h-11 animate-pulse rounded-xl bg-white/10" />
          <div className="h-11 animate-pulse rounded-xl bg-white/10" />
          <div className="h-11 animate-pulse rounded-xl bg-white/10" />
        </div>
        <div className="mt-2 h-10 w-44 animate-pulse rounded-xl bg-white/10" />
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-8 w-28 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-4/6 animate-pulse rounded bg-white/10" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-20 animate-pulse rounded-xl bg-white/10" />
              <div className="h-20 animate-pulse rounded-xl bg-white/10" />
              <div className="h-20 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

