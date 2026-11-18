import { useState } from 'react';
import { Calendar, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { LookbookGallery } from './components/LookbookGallery';
import { VideoGallery } from './components/VideoGallery';
import { TestimonialsAndInstagram } from './components/TestimonialsAndInstagram';
import { BookingCalendarSection } from './components/BookingCalendarSection';
import { MessagingVault } from './components/MessagingVault';
import { MakeupLook, STUDIO_INFO } from './data/studioCatalog';

function StudioAppShell() {
  const [preselectedLook, setPreselectedLook] = useState<MakeupLook | null>(null);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectLookForBooking = (look: MakeupLook) => {
    setPreselectedLook(look);
    scrollToSection('booking');
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF6F1] text-[#1E1816]">
      <Navbar onNavigate={scrollToSection} />

      <main className="flex-1">
        {/* Split-Screen Editorial Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Editorial Typographic Anchor */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-8 py-2">
              <div className="space-y-6">
                <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#7B1829]">
                  Gulshan-1 Atelier · Dhaka
                </p>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.08] tracking-tight text-[#1E1816] text-balance">
                  Timeless Bridal & Editorial Artistry by Farhana
                </h1>

                <p className="text-base sm:text-lg text-[#5C4E47] leading-relaxed max-w-xl">
                  Bespoke South Asian bridal couture, luminous Nikkah glass-skin, and high-fashion editorial makeup crafted in our private Lake Drive Road studio.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToSection('booking')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4" />
                    Reserve Your Date
                  </button>
                  <a
                    href={`${STUDIO_INFO.whatsappUrl}?text=${encodeURIComponent(
                      'Hello Farhana! I would like to book a makeup session.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3.5 bg-white border border-[#E5DAD0] text-sm font-medium text-[#1E1816] rounded-lg hover:border-[#7B1829] hover:text-[#7B1829] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 text-[#7B1829]" />
                    WhatsApp {STUDIO_INFO.phoneDisplay}
                  </a>
                </div>
              </div>

              {/* Signature Emblem + Studio Address */}
              <div className="pt-6 border-t border-[#E5DAD0] flex items-center gap-5">
                <img
                  src={STUDIO_INFO.logoPath}
                  alt="Signature Artistry by Farhana Crest"
                  className="w-20 h-14 object-cover rounded-lg border border-[#E5DAD0] shrink-0"
                />
                <div className="text-xs text-[#5C4E47] space-y-1">
                  <p className="font-medium text-[#1E1816] inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7B1829] shrink-0" />
                    {STUDIO_INFO.address}
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#7B1829] shrink-0" />
                    {STUDIO_INFO.phoneDisplay} · Inbox us to book your appointment
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Matching Height Editorial Portrait */}
            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[380px] lg:min-h-[500px] rounded-2xl overflow-hidden border border-[#E5DAD0] bg-[#F3ECE4]">
                <img
                  src={STUDIO_INFO.heroImage}
                  alt="Bridal glass-skin makeup artistry by Farhana in Dhaka"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Proof & Studio Strip Below Hero Split */}
          <div className="mt-12 pt-8 border-t border-[#E5DAD0] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-serif text-2xl font-semibold text-[#1E1816] tabular-nums">
                450+ Brides
              </p>
              <p className="text-xs text-[#6B5B53] mt-1">
                Styled across Dhaka & destination weddings
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-[#1E1816] tabular-nums">
                30% Deposit
              </p>
              <p className="text-xs text-[#6B5B53] mt-1">
                Instant bKash, Nagad & card slot lock
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-[#1E1816]">
                24h Reminders
              </p>
              <p className="text-xs text-[#6B5B53] mt-1">
                Automated email & .ics calendar invites
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-[#1E1816] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-[#7B1829]" /> E2EE Private
              </p>
              <p className="text-xs text-[#6B5B53] mt-1">
                AES-256-GCM encrypted notes & chat
              </p>
            </div>
          </div>
        </section>

        <LookbookGallery onSelectLookForBooking={handleSelectLookForBooking} />
        <VideoGallery onSelectLookForBooking={handleSelectLookForBooking} />
        <TestimonialsAndInstagram />
        <BookingCalendarSection preselectedLook={preselectedLook} />
        <MessagingVault />
      </main>

      <footer className="border-t border-[#E5DAD0] bg-[#F3ECE4]/60 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <img
              src={STUDIO_INFO.logoPath}
              alt="Signature Artistry by Farhana"
              className="w-20 h-14 object-cover rounded-lg border border-[#E5DAD0]"
            />
            <div>
              <p className="font-serif text-xl font-semibold text-[#1E1816]">
                {STUDIO_INFO.brand}
              </p>
              <p className="text-xs text-[#5C4E47] mt-0.5">{STUDIO_INFO.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#5C4E47]">
            <a
              href={STUDIO_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7B1829] transition-colors"
            >
              WhatsApp: {STUDIO_INFO.phoneDisplay}
            </a>
            <a href="#lookbook" className="hover:text-[#7B1829] transition-colors">
              Lookbook
            </a>
            <a href="#videos" className="hover:text-[#7B1829] transition-colors">
              Video Gallery
            </a>
            <a href="#booking" className="hover:text-[#7B1829] transition-colors">
              Book Session
            </a>
            <span>© {new Date().getFullYear()} Signature Artistry by Farhana</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StudioAppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}
