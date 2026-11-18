import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { Heart, Instagram, MessageCircle, Star, ExternalLink } from 'lucide-react';
import {
  SEED_TESTIMONIALS,
  STUDIO_INFO,
  StudioTestimonial,
} from '../data/studioCatalog';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface InstagramPost {
  id: string;
  image: string;
  caption: string;
  category: string;
  likes: number;
  comments: number;
  postedAt: string;
}

export function TestimonialsAndInstagram() {
  const { user, signInWithGoogle } = useAuth();
  const [liveTestimonials, setLiveTestimonials] = useState<StudioTestimonial[]>([]);
  const [igPosts, setIgPosts] = useState<InstagramPost[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [occasion, setOccasion] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: StudioTestimonial[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            clientName: String(data.clientName || 'Verified Client'),
            occasion: String(data.occasion || 'Studio Session'),
            quote: String(data.quote || ''),
            rating: Number(data.rating || 5),
            dateLabel: 'Verified Client',
          };
        });
        setLiveTestimonials(rows);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'testimonials');
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch('/api/instagram/feed')
      .then((res) => res.json())
      .then((data: { posts?: InstagramPost[] }) => {
        if (Array.isArray(data.posts)) {
          setIgPosts(data.posts);
        }
      })
      .catch((err) => console.error('Failed to load Instagram feed:', err));
  }, []);

  const displayedTestimonials = [...liveTestimonials, ...SEED_TESTIMONIALS].slice(0, 6);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim() || quote.trim().length < 10) return;

    let activeUser = user;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) return;
    }

    setSubmitting(true);
    const id = `rev_${Date.now()}`;
    try {
      await setDoc(doc(db, 'testimonials', id), {
        userId: activeUser.uid,
        clientName: (activeUser.displayName || 'Studio Client').slice(0, 100),
        occasion: (occasion.trim() || 'Bridal & Event Session · Dhaka').slice(0, 100),
        quote: quote.trim().slice(0, 600),
        rating,
        createdAt: serverTimestamp(),
      });
      setOccasion('');
      setQuote('');
      setShowReviewForm(false);
      setReviewSuccess('Thank you for sharing your studio experience.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `testimonials/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Client Testimonials Section */}
      <section className="py-20 px-6 bg-[#F3ECE4]/70 border-y border-[#E5DAD0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7B1829] mb-2">
                Client Reflections
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E1816] text-balance">
                Trusted by Dhaka Brides & Editorial Clients
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewForm((prev) => !prev)}
              className="px-4 py-2.5 bg-white border border-[#E5DAD0] text-xs font-medium text-[#1E1816] rounded-lg hover:border-[#7B1829] hover:text-[#7B1829] transition-colors whitespace-nowrap shrink-0"
            >
              {showReviewForm ? 'Close Review Form' : 'Share Your Experience'}
            </button>
          </div>

          {reviewSuccess && (
            <div className="mb-8 px-4 py-3 bg-white border border-[#B88B4A]/40 rounded-xl text-sm text-[#1E1816]">
              {reviewSuccess}
            </div>
          )}

          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="mb-10 bg-white border border-[#E5DAD0] rounded-2xl p-6 space-y-4 max-w-2xl"
            >
              <h3 className="font-serif text-2xl font-semibold text-[#1E1816]">
                Leave a Verified Client Review
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                    Occasion & Venue
                  </label>
                  <input
                    type="text"
                    required
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g., Nikkah Couture · Gulshan-1"
                    className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                    Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                  >
                    <option value={5}>5 Stars — Exceptional</option>
                    <option value={4}>4 Stars — Very Pleased</option>
                    <option value={3}>3 Stars — Good</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                  Your Review (minimum 10 characters)
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={3}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Share how your look held up and how the booking experience felt..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Publishing...' : user ? 'Publish Testimonial' : 'Sign In with Google & Publish'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayedTestimonials.map((item) => (
              <blockquote
                key={item.id}
                className="bg-white border border-[#E5DAD0] rounded-2xl p-7 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-[#B88B4A]" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-[#1E1816] leading-relaxed">
                    “{item.quote}”
                  </p>
                </div>

                <footer className="pt-4 border-t border-[#E5DAD0]/80">
                  <p className="text-sm font-semibold text-[#1E1816]">{item.clientName}</p>
                  <p className="text-xs text-[#6B5B53] mt-0.5">
                    {item.occasion} · {item.dateLabel}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section id="instagram" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7B1829] mb-2">
              Studio Feed & Live Updates
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E1816]">
              {STUDIO_INFO.instagramHandle}
            </h2>
            <p className="mt-2 text-sm text-[#5C4E47]">
              Recent bridal calls, vanity notes, and sunlit Dhaka studio transformations.
            </p>
          </div>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5DAD0] text-xs font-medium text-[#1E1816] rounded-lg hover:border-[#7B1829] hover:text-[#7B1829] transition-colors whitespace-nowrap shrink-0"
          >
            <Instagram className="w-4 h-4 text-[#7B1829]" />
            Follow {STUDIO_INFO.instagramHandle}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {igPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-[#E5DAD0] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-square bg-[#F3ECE4] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#6B5B53] mb-2">
                    <span className="font-medium text-[#7B1829]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.postedAt}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A3E39] leading-relaxed line-clamp-3">
                    {post.caption}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5DAD0]/70 flex items-center gap-5 text-xs text-[#6B5B53] tabular-nums">
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#7B1829]" /> {post.likes}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.comments}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
