import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F1]/95 backdrop-blur-md border-b border-[#E5DAD0]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNav('top');
          }}
          className="font-serif text-xl font-semibold tracking-tight text-[#1E1816] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1829] rounded"
        >
          Signature Artistry
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C4E47]"
        >
          <a
            href="#lookbook"
            onClick={(e) => {
              e.preventDefault();
              handleNav('lookbook');
            }}
            className="hover:text-[#7B1829] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Lookbook
          </a>
          <a
            href="#videos"
            onClick={(e) => {
              e.preventDefault();
              handleNav('videos');
            }}
            className="hover:text-[#7B1829] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Videos
          </a>
          <a
            href="#booking"
            onClick={(e) => {
              e.preventDefault();
              handleNav('booking');
            }}
            className="hover:text-[#7B1829] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Calendar
          </a>
          <a
            href="#instagram"
            onClick={(e) => {
              e.preventDefault();
              handleNav('instagram');
            }}
            className="hover:text-[#7B1829] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Instagram
          </a>
          <a
            href="#messages"
            onClick={(e) => {
              e.preventDefault();
              handleNav('messages');
            }}
            className="hover:text-[#7B1829] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Messages
          </a>
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('booking')}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-[#7B1829] text-white text-xs font-medium tracking-wide rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7B1829]"
          >
            Book Session
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E5DAD0] text-[#1E1816] hover:bg-[#F3ECE4] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5DAD0] bg-[#FAF6F1] px-6 py-4 space-y-2">
          {[
            { id: 'lookbook', label: 'Lookbook' },
            { id: 'videos', label: 'Video Gallery' },
            { id: 'booking', label: 'Calendar & Booking' },
            { id: 'instagram', label: 'Instagram Feed' },
            { id: 'messages', label: 'Direct Messages' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="block w-full text-left py-2.5 text-sm font-medium text-[#1E1816] hover:text-[#7B1829] border-b border-[#E5DAD0]/60 last:border-b-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
