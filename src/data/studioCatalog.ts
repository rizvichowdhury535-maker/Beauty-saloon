export interface MakeupLook {
  id: string;
  title: string;
  category: 'Bridal Couture' | 'Nikkah & Reception' | 'Editorial Glam' | 'Studio & Vanity';
  duration: string;
  priceBdt: number;
  image: string;
  aspect: 'portrait' | 'landscape';
  paletteNotes: string;
  skinPrep: string;
  idealFor: string;
  description: string;
}

export interface VideoReel {
  id: string;
  title: string;
  category: 'Bridal Films' | 'Glass-Skin Prep' | 'Editorial BTS';
  durationSeconds: number;
  durationLabel: string;
  posterImage: string;
  secondaryImage: string;
  lookId: string;
  chapters: { time: string; label: string }[];
  caption: string;
}

export interface ServicePackage {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  priceBdt: number;
  depositPercent: number;
  includes: string[];
}

export interface StudioTestimonial {
  id: string;
  clientName: string;
  occasion: string;
  quote: string;
  rating: number;
  dateLabel: string;
}

export const STUDIO_INFO = {
  brand: 'Signature Artistry by Farhana',
  shortBrand: 'Signature Artistry',
  address: 'BA-84/B, South Badda, Lake Drive Road, Gulshan-1, Dhaka',
  phoneDisplay: '01345-956377',
  whatsappUrl: 'https://wa.me/8801345956377',
  instagramHandle: '@signatureartistrybyfarhana',
  logoPath: '/assets/aistudio/image_578d22d8.png',
  heroImage: '/src/assets/images/hero_bridal_atelier_1795008904043.jpg',
};

export const TIME_SLOTS = [
  '10:00 AM',
  '12:30 PM',
  '03:00 PM',
  '05:30 PM',
];

export const MAKEUP_LOOKS: MakeupLook[] = [
  {
    id: 'look-crimson-bridal',
    title: 'Royal Crimson Bridal Couture',
    category: 'Bridal Couture',
    duration: '3 hrs',
    priceBdt: 28000,
    image: '/src/assets/images/look_crimson_bridal_1795008903538.jpg',
    aspect: 'portrait',
    paletteNotes: 'Velvet ruby-crimson lip, burnished bronze lid depth, soft rosewood cheek blush',
    skinPrep: 'Hyaluronic barrier hydration with luminous pearl primer for 14-hour flash resilience',
    idealFor: 'Main Wedding Ceremony, Lehenga & Katan Saree Brides',
    description:
      'Farhana’s hallmark Dhaka bridal look combining sculpted South Asian warmth with an unmistakably refined crimson lip and crease-proof luminosity.',
  },
  {
    id: 'look-nikkah-glass',
    title: 'Ivory Nikkah Glass-Skin',
    category: 'Nikkah & Reception',
    duration: '2.5 hrs',
    priceBdt: 22000,
    image: '/src/assets/images/look_nikkah_glass_skin_1795008904816.jpg',
    aspect: 'portrait',
    paletteNotes: 'Champagne veil shimmer, sheer dusty-rose lip stain, feathered natural brows',
    skinPrep: 'Dew-mist toning and micro-fine silk setting powder focused strictly along T-zone',
    idealFor: 'Daylight Nikkah, Jamdani & Ivory Organza Ensembles',
    description:
      'Weightless, camera-transparent skin finish tailored for morning Nikkah light—keeping natural texture glowing under sheer organza drapes.',
  },
  {
    id: 'look-editorial-glam',
    title: 'Gulshan Evening Editorial',
    category: 'Editorial Glam',
    duration: '2 hrs',
    priceBdt: 15000,
    image: '/src/assets/images/look_editorial_glam_1795008904522.jpg',
    aspect: 'portrait',
    paletteNotes: 'Soft espresso winged liner, warm caramel satin lip, lifted cheekbone highlight',
    skinPrep: 'Cooling peptide eye mask with satin-matte complexion balancing',
    idealFor: 'Walima Reception, Campaign Shoots & Gala Evenings',
    description:
      'Architectural eye definition balanced with warm caramel tones and lifted radiance crafted for evening portraiture and editorial lighting.',
  },
  {
    id: 'look-heritage-rose',
    title: 'Soft Rosewood Engagement',
    category: 'Nikkah & Reception',
    duration: '2 hrs',
    priceBdt: 11500,
    image: '/src/assets/images/hero_bridal_atelier_1795008904043.jpg',
    aspect: 'landscape',
    paletteNotes: 'Muted berry-rose matte lip, champagne inner-corner glow, soft bronze warmth',
    skinPrep: 'Ceramide-rich moisture prep with second-skin sheer foundation layering',
    idealFor: 'Engagement, Holud Night & Intimate Family Dinners',
    description:
      'Effortless soft-glam tailored to enhance natural bone structure with romantic rosewood undertones that wear gracefully from afternoon to midnight.',
  },
  {
    id: 'look-atelier-vanity',
    title: 'Bespoke Bridal Trial & Vanity Curation',
    category: 'Studio & Vanity',
    duration: '90 mins',
    priceBdt: 6500,
    image: '/src/assets/images/look_atelier_vanity_1795008905323.jpg',
    aspect: 'landscape',
    paletteNotes: 'Custom undertone mapping, 2 eye-and-lip pairings tested under warm and daylight LEDs',
    skinPrep: 'Personalized 3-week pre-bridal skincare & hydration blueprint',
    idealFor: 'Pre-Wedding Consultation at our Lake Drive Road Studio',
    description:
      'An intimate one-on-one session at BA-84/B Gulshan-1 mapping your undertones, dupatta palette, and floral jewelry balance ahead of the wedding week.',
  },
];

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-bridal-couture',
    title: 'Signature Bridal Couture',
    subtitle: 'Full wedding day artistry, hair styling & dupatta pinning',
    duration: '3 hrs',
    priceBdt: 28000,
    depositPercent: 30,
    includes: [
      'Airbrush or luxury glass-skin complexion prep',
      'Custom bridal hair styling, veil & jewelry setting',
      'Touch-up lip & blotting kit',
    ],
  },
  {
    id: 'pkg-nikkah-walima',
    title: 'Nikkah & Walima Luxe',
    subtitle: 'Luminous soft-glam artistry tailored for daylight or reception lighting',
    duration: '2.5 hrs',
    priceBdt: 22000,
    depositPercent: 30,
    includes: [
      'Humidity-proof skin hydration & glow layering',
      'Signature soft-sculpted eye & lash placement',
      'Dupatta & floral hair styling',
    ],
  },
  {
    id: 'pkg-editorial-glam',
    title: 'Editorial & Runway Glam',
    subtitle: 'Camera-calibrated artistry for shoots, receptions & formal galas',
    duration: '2 hrs',
    priceBdt: 15000,
    depositPercent: 30,
    includes: [
      'Studio flash & 4K lens-tested finish',
      'Precision liner & custom lip tone blending',
      'Sleek hair styling',
    ],
  },
  {
    id: 'pkg-party-engagement',
    title: 'Engagement & Party Glam',
    subtitle: 'Refined soft-glam for bridesmaid, Holud & milestone evenings',
    duration: '90 mins',
    priceBdt: 11500,
    depositPercent: 30,
    includes: [
      'Breathable long-wear base & soft contour',
      'Custom eye shimmer & lash styling',
      'Blowout or soft waves',
    ],
  },
  {
    id: 'pkg-bridal-trial',
    title: 'Bridal Trial & Skin Prep',
    subtitle: 'One-on-one Gulshan-1 atelier consultation & undertone mapping',
    duration: '90 mins',
    priceBdt: 6500,
    depositPercent: 30,
    includes: [
      'Two curated eye & lip mockups',
      'Pre-wedding skincare regimen calendar',
      'Encrypted allergy & product sensitivity profile',
    ],
  },
];

export const SEED_TESTIMONIALS: StudioTestimonial[] = [
  {
    id: 'test-1',
    clientName: 'Tasnim Rahman',
    occasion: 'Bridal Couture · Gulshan-2 Reception',
    quote:
      'I wanted classic crimson lips without feeling heavy foundation on my skin. Farhana matched my undertone in minutes—my makeup stayed luminous through six hours of stage lights and family portraits.',
    rating: 5,
    dateLabel: 'October 2026',
  },
  {
    id: 'test-2',
    clientName: 'Nadia Chowdhury',
    occasion: 'Nikkah Glass-Skin · Banani',
    quote:
      'During my morning Nikkah, guests kept asking if I was wearing any foundation at all. The pearl glow under my ivory jamdani looked completely effortless in every daylight photograph.',
    rating: 5,
    dateLabel: 'September 2026',
  },
  {
    id: 'test-3',
    clientName: 'Samira Kabir',
    occasion: 'Editorial Glam · Baridhara',
    quote:
      'Booking my session online with bKash deposit and receiving the calendar invite immediately made wedding-week planning stress-free. Farhana’s encrypted skin-prep notes saved my sensitive skin.',
    rating: 5,
    dateLabel: 'August 2026',
  },
];

export const VIDEO_REELS: VideoReel[] = [
  {
    id: 'reel-crimson-bridal',
    title: 'Royal Crimson Bridal Transformation',
    category: 'Bridal Films',
    durationSeconds: 38,
    durationLabel: '00:38',
    posterImage: '/src/assets/images/look_crimson_bridal_1795008903538.jpg',
    secondaryImage: '/src/assets/images/look_atelier_vanity_1795008905323.jpg',
    lookId: 'look-crimson-bridal',
    chapters: [
      { time: '00:00', label: 'Barrier Hydration & Pearl Primer' },
      { time: '00:12', label: 'Burnished Bronze Lid Sculpting' },
      { time: '00:24', label: 'Velvet Crimson Lip & Veil Setting' },
    ],
    caption: 'From hydrated skin prep to velvet ruby-crimson bridal finish in our Gulshan-1 studio.',
  },
  {
    id: 'reel-nikkah-glass',
    title: 'Nikkah Glass-Skin Morning Prep',
    category: 'Glass-Skin Prep',
    durationSeconds: 32,
    durationLabel: '00:32',
    posterImage: '/src/assets/images/look_nikkah_glass_skin_1795008904816.jpg',
    secondaryImage: '/src/assets/images/hero_bridal_atelier_1795008904043.jpg',
    lookId: 'look-nikkah-glass',
    chapters: [
      { time: '00:00', label: 'Dew Mist & Hyaluronic Layering' },
      { time: '00:11', label: 'Champagne Veil Shimmer & Brows' },
      { time: '00:22', label: 'Organza Drape & Daylight Check' },
    ],
    caption: 'Weightless pearl glow calibrated specifically for morning Nikkah photography.',
  },
  {
    id: 'reel-editorial-glam',
    title: 'Gulshan Evening Editorial Reel',
    category: 'Editorial BTS',
    durationSeconds: 29,
    durationLabel: '00:29',
    posterImage: '/src/assets/images/look_editorial_glam_1795008904522.jpg',
    secondaryImage: '/src/assets/images/look_crimson_bridal_1795008903538.jpg',
    lookId: 'look-editorial-glam',
    chapters: [
      { time: '00:00', label: 'Cooling Peptide Eye Prep' },
      { time: '00:10', label: 'Soft Espresso Winged Liner' },
      { time: '00:20', label: 'Caramel Satin Lip & Flash Test' },
    ],
    caption: 'Behind the scenes during an evening reception and red-carpet editorial sitting.',
  },
  {
    id: 'reel-atelier-vanity',
    title: 'Inside the Lake Drive Road Vanity',
    category: 'Glass-Skin Prep',
    durationSeconds: 26,
    durationLabel: '00:26',
    posterImage: '/src/assets/images/look_atelier_vanity_1795008905323.jpg',
    secondaryImage: '/src/assets/images/hero_bridal_atelier_1795008904043.jpg',
    lookId: 'look-atelier-vanity',
    chapters: [
      { time: '00:00', label: 'Sanitized Handcrafted Brushes' },
      { time: '00:09', label: 'Undertone Swatch Mapping' },
      { time: '00:18', label: 'Bespoke Bridal Kit Curation' },
    ],
    caption: 'Morning studio setup before a Friday bridal call at BA-84/B Gulshan-1.',
  },
];

