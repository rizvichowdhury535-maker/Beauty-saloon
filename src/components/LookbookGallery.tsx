import { useState } from 'react';
import { ArrowUpRight, Clock, Sparkles, X } from 'lucide-react';
import { MAKEUP_LOOKS, MakeupLook } from '../data/studioCatalog';

interface LookbookGalleryProps {
  onSelectLookForBooking: (look: MakeupLook) => void;
}

const CATEGORIES = [
  'All Looks',
  'Bridal Couture',
  'Nikkah & Reception',
  'Editorial Glam',
  'Studio & Vanity',
] as const;

export function LookbookGallery({ onSelectLookForBooking }: LookbookGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('All Looks');
  const [selectedLook, setSelectedLook] = useState<MakeupLook | null>(null);

  const filteredLooks =
    activeCategory === 'All Looks'
      ? MAKEUP_LOOKS
      : MAKEUP_LOOKS.filter((look) => look.category === activeCategory);

  return (
    <section id="lookbook" className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7B1829] mb-2">
            Curated Portfolio
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E1816] tracking-tight text-balance">
            Signature Looks by Farhana
          </h2>
          <p className="mt-3 text-base text-[#5C4E47] leading-relaxed">
            Explore bridal couture, glass-skin Nikkah radiance, and Dhaka editorial finishes crafted for South Asian undertones.
          </p>
        </div>

        {/* Interactive Filter Tabs (Segmented Control) */}
        <div
          role="tablist"
          aria-label="Filter makeup looks by category"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3ECE4] rounded-xl border border-[#E5DAD0]"
        >
          {CATEGORIES.map((category) => {
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

      {/* Lookbook Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLooks.map((look) => (
          <article
            key={look.id}
            className="group bg-white border border-[#E5DAD0] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
          >
            <button
              type="button"
              onClick={() => setSelectedLook(look)}
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3ECE4] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1829]"
            >
              <img
                src={look.image}
                alt={look.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
                <span className="text-xs font-medium text-white inline-flex items-center gap-1">
                  Inspect Look Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            <div className="p-6 flex flex-col flex-1 justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#6B5B53] mb-2">
                  <span>{look.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{look.duration}</span>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#1E1816] leading-snug">
                  {look.title}
                </h3>
                <p className="mt-2 text-sm text-[#5C4E47] leading-relaxed line-clamp-2">
                  {look.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5DAD0]/80 flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-[#1E1816] tabular-nums">
                  ৳{look.priceBdt.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLook(look)}
                    className="px-3 py-2 text-xs font-medium text-[#5C4E47] hover:text-[#1E1816] rounded-lg hover:bg-[#FAF6F1] transition-colors whitespace-nowrap"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectLookForBooking(look)}
                    className="px-4 py-2 bg-[#7B1829] text-white text-xs font-medium rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap"
                  >
                    Book Look
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Look Detail Lightbox Modal */}
      {selectedLook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="look-modal-title"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedLook(null)}
        >
          <div
            className="bg-[#FAF6F1] border border-[#E5DAD0] rounded-2xl max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-2 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#F3ECE4] aspect-[4/3] md:aspect-auto md:h-full">
              <img
                src={selectedLook.image}
                alt={selectedLook.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#7B1829] font-medium">
                    <span>{selectedLook.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" /> {selectedLook.duration}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLook(null)}
                    aria-label="Close look details"
                    className="w-9 h-9 rounded-lg border border-[#E5DAD0] flex items-center justify-center text-[#5C4E47] hover:text-[#1E1816] hover:bg-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3
                  id="look-modal-title"
                  className="mt-3 font-serif text-3xl font-semibold text-[#1E1816]"
                >
                  {selectedLook.title}
                </h3>
                <p className="mt-3 text-sm text-[#5C4E47] leading-relaxed">
                  {selectedLook.description}
                </p>

                <div className="mt-6 space-y-4 border-t border-[#E5DAD0] pt-5 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#6B5B53]">
                      Color Palette & Finish
                    </p>
                    <p className="mt-1 text-[#1E1816]">{selectedLook.paletteNotes}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#6B5B53]">
                      Complexion & Skin Prep
                    </p>
                    <p className="mt-1 text-[#1E1816]">{selectedLook.skinPrep}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#6B5B53]">
                      Recommended Occasion
                    </p>
                    <p className="mt-1 text-[#1E1816]">{selectedLook.idealFor}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-[#E5DAD0] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#6B5B53]">Session Investment (30% Deposit)</p>
                  <p className="text-xl font-semibold text-[#1E1816] tabular-nums">
                    ৳{selectedLook.priceBdt.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const chosen = selectedLook;
                    setSelectedLook(null);
                    onSelectLookForBooking(chosen);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  Reserve This Look
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
