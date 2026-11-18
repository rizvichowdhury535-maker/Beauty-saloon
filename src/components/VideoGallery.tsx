import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Sparkles, Upload, Video, X } from 'lucide-react';
import { MAKEUP_LOOKS, MakeupLook, VIDEO_REELS, VideoReel } from '../data/studioCatalog';

interface VideoGalleryProps {
  onSelectLookForBooking: (look: MakeupLook) => void;
}

const REEL_CATEGORIES = [
  'All Reels',
  'Bridal Films',
  'Glass-Skin Prep',
  'Editorial BTS',
] as const;

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VideoGallery({ onSelectLookForBooking }: VideoGalleryProps) {
  const [activeCategory, setActiveCategory] =
    useState<(typeof REEL_CATEGORIES)[number]>('All Reels');
  const [activeReel, setActiveReel] = useState<VideoReel | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [customVideoUrls, setCustomVideoUrls] = useState<Record<string, string>>({});

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const filteredReels =
    activeCategory === 'All Reels'
      ? VIDEO_REELS
      : VIDEO_REELS.filter((r) => r.category === activeCategory);

  useEffect(() => {
    if (!activeReel || !isPlaying || customVideoUrls[activeReel.id]) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setElapsed((prev) => {
        const next = prev + dt;
        return next >= activeReel.durationSeconds ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeReel, isPlaying, customVideoUrls]);

  const openReel = (reel: VideoReel) => {
    setActiveReel(reel);
    setElapsed(0);
    setIsPlaying(true);
  };

  const handleUploadLocalReel = (reelId: string, file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomVideoUrls((prev) => ({ ...prev, [reelId]: url }));
  };

  const progressPct = activeReel
    ? Math.min(100, (elapsed / activeReel.durationSeconds) * 100)
    : 0;

  const activeChapterIndex = activeReel
    ? Math.min(
        activeReel.chapters.length - 1,
        Math.floor((progressPct / 100) * activeReel.chapters.length)
      )
    : 0;

  return (
    <section
      id="videos"
      className="py-20 px-6 max-w-7xl mx-auto border-t border-[#E5DAD0]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7B1829] mb-2">
            Motion & Transformation Reels
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E1816] tracking-tight text-balance">
            Studio Video Gallery
          </h2>
          <p className="mt-3 text-base text-[#5C4E47] leading-relaxed">
            Watch step-by-step skin preparation, pigment layering, and bridal veil finishing inside our Gulshan-1 atelier.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filter video reels by category"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3ECE4] rounded-xl border border-[#E5DAD0]"
        >
          {REEL_CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-[#7B1829] shadow-sm'
                    : 'text-[#5C4E47] hover:text-[#1E1816]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Column Video Reel Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredReels.map((reel) => (
          <article
            key={reel.id}
            className="group bg-white border border-[#E5DAD0] rounded-2xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
          >
            <button
              type="button"
              onClick={() => openReel(reel)}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[#F3ECE4] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1829]"
            >
              <img
                src={reel.posterImage}
                alt={reel.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Video className="w-3.5 h-3.5" /> Reel
                  </span>
                  <span className="font-mono tabular-nums">{reel.durationLabel}</span>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/80">
                      {reel.category}
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-white leading-snug mt-0.5">
                      {reel.title}
                    </h3>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-white/95 text-[#7B1829] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </span>
                </div>
              </div>
            </button>

            <div className="p-4 flex items-center justify-between gap-3 border-t border-[#E5DAD0]/70">
              <p className="text-xs text-[#5C4E47] line-clamp-1">{reel.caption}</p>
              <button
                type="button"
                onClick={() => openReel(reel)}
                className="text-xs font-medium text-[#7B1829] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                Watch
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Interactive Cinema Reel Modal */}
      {activeReel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveReel(null)}
        >
          <div
            className="bg-[#FAF6F1] border border-[#E5DAD0] rounded-2xl max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reel Stage */}
            <div className="md:col-span-7 relative bg-[#1E1816] aspect-[3/4] md:aspect-auto md:min-h-[500px] overflow-hidden flex items-center justify-center">
              {customVideoUrls[activeReel.id] ? (
                <video
                  src={customVideoUrls[activeReel.id]}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <img
                    src={
                      progressPct > 55
                        ? activeReel.secondaryImage
                        : activeReel.posterImage
                    }
                    alt={activeReel.title}
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(${1 + (progressPct / 100) * 0.08})`,
                    }}
                    className="w-full h-full object-cover object-top transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 flex flex-col justify-between p-5">
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span>
                        Chapter {activeChapterIndex + 1} ·{' '}
                        {activeReel.chapters[activeChapterIndex]?.label}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatSeconds(elapsed)} / {activeReel.durationLabel}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsPlaying((p) => !p)}
                          aria-label={isPlaying ? 'Pause reel' : 'Play reel'}
                          className="w-10 h-10 rounded-full bg-white text-[#7B1829] flex items-center justify-center shrink-0 hover:bg-[#FAF6F1] transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <input
                          type="range"
                          min={0}
                          max={activeReel.durationSeconds}
                          step={0.2}
                          value={elapsed}
                          aria-label="Seek video reel timeline"
                          onChange={(e) => setElapsed(Number(e.target.value))}
                          className="flex-1 accent-[#7B1829] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reel Breakdown & Booking Action */}
            <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-medium text-[#7B1829]">
                    {activeReel.category} · {activeReel.durationLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveReel(null)}
                    aria-label="Close video reel"
                    className="w-9 h-9 rounded-lg border border-[#E5DAD0] flex items-center justify-center text-[#5C4E47] hover:text-[#1E1816] hover:bg-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3
                  id="video-modal-title"
                  className="mt-3 font-serif text-3xl font-semibold text-[#1E1816]"
                >
                  {activeReel.title}
                </h3>
                <p className="mt-3 text-sm text-[#5C4E47] leading-relaxed">
                  {activeReel.caption}
                </p>

                <div className="mt-6 pt-5 border-t border-[#E5DAD0] space-y-2.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#6B5B53]">
                    Technique Breakdown
                  </p>
                  {activeReel.chapters.map((ch, idx) => (
                    <button
                      key={ch.time}
                      type="button"
                      onClick={() => {
                        setElapsed(
                          (idx / activeReel.chapters.length) * activeReel.durationSeconds
                        );
                        setIsPlaying(true);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeChapterIndex === idx && !customVideoUrls[activeReel.id]
                          ? 'bg-white border border-[#7B1829]/40 text-[#1E1816] font-medium'
                          : 'text-[#5C4E47] hover:bg-white/70'
                      }`}
                    >
                      <span>{ch.label}</span>
                      <span className="font-mono tabular-nums text-[#6B5B53]">{ch.time}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5DAD0]">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5C4E47] hover:text-[#7B1829] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Preview local studio clip (.mp4 / .webm)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadLocalReel(activeReel.id, e.target.files?.[0])
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-[#E5DAD0]">
                <button
                  type="button"
                  onClick={() => {
                    const look =
                      MAKEUP_LOOKS.find((l) => l.id === activeReel.lookId) ||
                      MAKEUP_LOOKS[0];
                    setActiveReel(null);
                    onSelectLookForBooking(look);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  Book This Look
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
