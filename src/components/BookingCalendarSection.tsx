import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import {
  MAKEUP_LOOKS,
  MakeupLook,
  SERVICE_PACKAGES,
  STUDIO_INFO,
  TIME_SLOTS,
} from '../data/studioCatalog';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { encryptNotesJson } from '../lib/crypto';
import { useAuth } from '../context/AuthContext';

interface BookingCalendarSectionProps {
  preselectedLook: MakeupLook | null;
  onBookingCreated?: () => void;
}

interface BookedSlotItem {
  id: string;
  date: string;
  timeSlot: string;
}

interface ConfirmedReceipt {
  bookingId: string;
  serviceTitle: string;
  lookTitle: string;
  date: string;
  timeSlot: string;
  totalAmount: number;
  depositAmount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Card' | 'Bank';
  transactionRef: string;
  clientEmail: string;
  emailSubject: string;
}

function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function BookingCalendarSection({
  preselectedLook,
  onBookingCreated,
}: BookingCalendarSectionProps) {
  const { user, profile, signInWithGoogle } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2);
    return formatDateYmd(tomorrow);
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    SERVICE_PACKAGES[0].id
  );
  const [selectedLookId, setSelectedLookId] = useState<string>(MAKEUP_LOOKS[0].id);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Card' | 'Bank'>('bKash');
  const [paymentAccountHint, setPaymentAccountHint] = useState('');
  const [bookedSlots, setBookedSlots] = useState<BookedSlotItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState<ConfirmedReceipt | null>(null);

  useEffect(() => {
    if (profile) {
      if (!clientName) setClientName(profile.displayName || '');
      if (!clientPhone && profile.phone) setClientPhone(profile.phone);
    }
  }, [profile]);

  useEffect(() => {
    if (preselectedLook) {
      setSelectedLookId(preselectedLook.id);
      const matchingPkg =
        SERVICE_PACKAGES.find((p) => p.priceBdt === preselectedLook.priceBdt) ||
        SERVICE_PACKAGES[0];
      setSelectedServiceId(matchingPkg.id);
    }
  }, [preselectedLook]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'bookedSlots'),
      (snap) => {
        const items: BookedSlotItem[] = snap.docs.map((d) => ({
          id: d.id,
          date: String(d.data().date || ''),
          timeSlot: String(d.data().timeSlot || ''),
        }));
        setBookedSlots(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'bookedSlots');
      }
    );
    return () => unsub();
  }, []);

  const selectedService =
    SERVICE_PACKAGES.find((s) => s.id === selectedServiceId) || SERVICE_PACKAGES[0];
  const selectedLook = MAKEUP_LOOKS.find((l) => l.id === selectedLookId);
  const depositAmount = Math.round(
    selectedService.priceBdt * (selectedService.depositPercent / 100)
  );

  // Calendar Grid Calculations
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDateYmd(today);

  const takenSlotsForSelectedDate = useMemo(() => {
    return new Set(
      bookedSlots.filter((s) => s.date === selectedDate).map((s) => s.timeSlot)
    );
  }, [bookedSlots, selectedDate]);

  useEffect(() => {
    if (takenSlotsForSelectedDate.has(selectedSlot)) {
      const nextAvailable = TIME_SLOTS.find((t) => !takenSlotsForSelectedDate.has(t));
      if (nextAvailable) setSelectedSlot(nextAvailable);
    }
  }, [selectedDate, takenSlotsForSelectedDate, selectedSlot]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (takenSlotsForSelectedDate.has(selectedSlot)) {
      setErrorMsg('That time slot was just reserved. Please select another available slot.');
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      try {
        activeUser = await signInWithGoogle();
      } catch {
        setErrorMsg('Please sign in with Google to confirm your reservation and deposit.');
        return;
      }
    }
    if (!activeUser) return;

    const cleanName = (clientName || activeUser.displayName || 'Studio Client').trim().slice(0, 100);
    const cleanPhone = (clientPhone || '01345-956377').trim().slice(0, 32);
    const cleanEmail = (activeUser.email || '').trim().slice(0, 160);

    if (cleanPhone.length < 5) {
      setErrorMsg('Please enter a valid contact phone or WhatsApp number.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Server-side deposit calculation & verification
      const payRes = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceTitle: selectedService.title,
          totalAmount: selectedService.priceBdt,
          paymentMethod,
          accountHint: paymentAccountHint,
          clientEmail: cleanEmail,
        }),
      });
      if (!payRes.ok) {
        throw new Error('Deposit verification failed. Please check payment details.');
      }
      const payData = (await payRes.json()) as {
        transactionRef: string;
        depositAmount: number;
      };

      // 2. Client-side AES-256-GCM encryption for private skin/allergy consultation notes
      const encryptedNotes = await encryptNotesJson(privateNotes, activeUser.uid);

      // 3. Persist Booking in Firestore
      const bookingId = `bk_${Date.now()}_${activeUser.uid.slice(0, 6)}`;
      const slotId = `${selectedDate}_${selectedSlot.replace(/[^a-zA-Z0-9]/g, '_')}`;

      try {
        await setDoc(doc(db, 'bookings', bookingId), {
          userId: activeUser.uid,
          clientName: cleanName,
          clientEmail: cleanEmail,
          clientPhone: cleanPhone,
          serviceId: selectedService.id,
          serviceTitle: selectedService.title.slice(0, 120),
          lookId: selectedLook ? selectedLook.id : '',
          lookTitle: selectedLook ? selectedLook.title.slice(0, 120) : '',
          date: selectedDate,
          timeSlot: selectedSlot,
          totalAmount: selectedService.priceBdt,
          depositAmount: payData.depositAmount,
          depositStatus: 'paid',
          paymentMethod,
          transactionRef: payData.transactionRef,
          status: 'confirmed',
          encryptedNotes: encryptedNotes.slice(0, 4096),
          reminderSent: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingId}`);
      }

      // 4. Lock public slot (Zero PII)
      try {
        await setDoc(doc(db, 'bookedSlots', slotId), {
          userId: activeUser.uid,
          bookingId,
          date: selectedDate,
          timeSlot: selectedSlot,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `bookedSlots/${slotId}`);
      }

      // 5. Dispatch Automated Confirmation Email & Record Reminder
      const mailRes = await fetch('/api/reminders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          clientName: cleanName,
          clientEmail: cleanEmail,
          serviceTitle: selectedService.title,
          lookTitle: selectedLook?.title || '',
          date: selectedDate,
          timeSlot: selectedSlot,
          depositAmount: payData.depositAmount,
          totalAmount: selectedService.priceBdt,
          transactionRef: payData.transactionRef,
          reminderType: 'confirmation',
        }),
      });
      const mailData = (await mailRes.json()) as {
        subject?: string;
        sentAt?: string;
      };

      const reminderId = `rem_${Date.now()}`;
      try {
        await setDoc(doc(db, 'reminders', reminderId), {
          userId: activeUser.uid,
          bookingId,
          recipientEmail: cleanEmail,
          channel: 'email',
          subject: (mailData.subject || `Booking Confirmed: ${selectedService.title}`).slice(0, 180),
          scheduledFor: `${selectedDate} ${selectedSlot}`,
          status: 'sent',
          sentAt: mailData.sentAt || new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reminders/${reminderId}`);
      }

      setReceipt({
        bookingId,
        serviceTitle: selectedService.title,
        lookTitle: selectedLook?.title || 'Custom Studio Selection',
        date: selectedDate,
        timeSlot: selectedSlot,
        totalAmount: selectedService.priceBdt,
        depositAmount: payData.depositAmount,
        paymentMethod,
        transactionRef: payData.transactionRef,
        clientEmail: cleanEmail,
        emailSubject: mailData.subject || `Booking Confirmed: ${selectedService.title}`,
      });
      setPrivateNotes('');
      setPaymentAccountHint('');
      onBookingCreated?.();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to complete booking right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const buildGoogleCalendarUrl = (r: ConfirmedReceipt) => {
    const cleanDate = r.date.replace(/-/g, '');
    const title = encodeURIComponent(`${r.serviceTitle} — ${STUDIO_INFO.brand}`);
    const details = encodeURIComponent(
      `Look: ${r.lookTitle}\nDeposit Ref: ${r.transactionRef} (৳${r.depositAmount.toLocaleString()} paid)\nStudio WhatsApp: ${STUDIO_INFO.phoneDisplay}`
    );
    const loc = encodeURIComponent(STUDIO_INFO.address);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T100000/${cleanDate}T123000&details=${details}&location=${loc}`;
  };

  return (
    <section id="booking" className="py-20 px-6 max-w-7xl mx-auto">
      <div className="max-w-2xl mb-12">
        <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7B1829] mb-2">
          Reservations & Deposit Checkout
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E1816] text-balance">
          Schedule Your Session in Gulshan-1
        </h2>
        <p className="mt-3 text-base text-[#5C4E47] leading-relaxed">
          Select a date from the live studio calendar, choose your look package, and secure your slot with a 30% booking deposit. Automated email & calendar invites are sent immediately.
        </p>
      </div>

      {receipt ? (
        <div className="bg-white border border-[#E5DAD0] rounded-2xl p-8 max-w-3xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-[#7B1829]/10 text-[#7B1829] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#7B1829]">
                Booking Confirmed · Automated Email Sent
              </p>
              <h3 className="font-serif text-3xl font-semibold text-[#1E1816] mt-1">
                {receipt.serviceTitle}
              </h3>
              <p className="text-sm text-[#5C4E47] mt-1">
                Confirmation sent to <span className="font-medium text-[#1E1816]">{receipt.clientEmail}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-xl text-sm">
            <div>
              <p className="text-xs text-[#6B5B53]">Date & Time</p>
              <p className="font-semibold text-[#1E1816] tabular-nums mt-0.5">
                {receipt.date} · {receipt.timeSlot}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B5B53]">Transaction Reference</p>
              <p className="font-mono font-medium text-[#1E1816] mt-0.5">
                {receipt.transactionRef} ({receipt.paymentMethod})
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B5B53]">Deposit Paid (30%)</p>
              <p className="font-semibold text-[#7B1829] tabular-nums mt-0.5">
                ৳{receipt.depositAmount.toLocaleString()} of ৳{receipt.totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B5B53]">Studio Location</p>
              <p className="font-medium text-[#1E1816] mt-0.5">{STUDIO_INFO.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/calendar/ics?title=${encodeURIComponent(
                `${receipt.serviceTitle} - Signature Artistry by Farhana`
              )}&date=${receipt.date}&timeSlot=${encodeURIComponent(receipt.timeSlot)}&uid=${receipt.bookingId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7B1829] text-white text-xs font-medium rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download .ICS Invite
            </a>
            <a
              href={buildGoogleCalendarUrl(receipt)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5DAD0] text-xs font-medium text-[#1E1816] rounded-lg hover:border-[#7B1829] transition-colors whitespace-nowrap"
            >
              <CalendarIcon className="w-4 h-4 text-[#7B1829]" />
              Add to Google Calendar
            </a>
            <a
              href={`${STUDIO_INFO.whatsappUrl}?text=${encodeURIComponent(
                `Hello Farhana! I just confirmed my ${receipt.serviceTitle} booking on ${receipt.date} at ${receipt.timeSlot} (Ref: ${receipt.transactionRef}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5DAD0] text-xs font-medium text-[#1E1816] rounded-lg hover:border-[#7B1829] transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-[#7B1829]" />
              Confirm on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="ml-auto text-xs font-medium text-[#6B5B53] hover:text-[#1E1816] underline underline-offset-4"
            >
              Book Another Session
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleConfirmBooking}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Live Availability Calendar & Time Slots */}
          <div className="lg:col-span-5 bg-white border border-[#E5DAD0] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-semibold text-[#1E1816]">
                {viewMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                  className="w-9 h-9 rounded-lg border border-[#E5DAD0] flex items-center justify-center text-[#5C4E47] hover:bg-[#FAF6F1]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                  className="w-9 h-9 rounded-lg border border-[#E5DAD0] flex items-center justify-center text-[#5C4E47] hover:bg-[#FAF6F1]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-[#6B5B53]">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="py-1.5">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = formatDateYmd(new Date(year, month, dayNum));
                const isPast = cellDate < todayStr;
                const isSelected = cellDate === selectedDate;
                const dayTakenCount = bookedSlots.filter((b) => b.date === cellDate).length;
                const isFullyBooked = dayTakenCount >= TIME_SLOTS.length;

                return (
                  <button
                    key={cellDate}
                    type="button"
                    disabled={isPast || isFullyBooked}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`h-10 rounded-lg text-sm tabular-nums font-medium transition-colors flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#7B1829] text-white'
                        : isPast || isFullyBooked
                        ? 'text-[#B9ADA5] cursor-not-allowed bg-[#FAF6F1]/60'
                        : 'text-[#1E1816] hover:bg-[#F3ECE4]'
                    }`}
                  >
                    <span>{dayNum}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E5DAD0]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-[#6B5B53]">
                  Available Slots · {selectedDate}
                </span>
                <span className="text-xs text-[#6B5B53] inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Dhaka Time
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {TIME_SLOTS.map((slot) => {
                  const isTaken = takenSlotsForSelectedDate.has(slot);
                  const active = selectedSlot === slot && !isTaken;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isTaken}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-medium tabular-nums transition-colors ${
                        isTaken
                          ? 'bg-[#FAF6F1] border-[#E5DAD0] text-[#B9ADA5] line-through cursor-not-allowed'
                          : active
                          ? 'bg-[#7B1829] border-[#7B1829] text-white'
                          : 'bg-white border-[#E5DAD0] text-[#1E1816] hover:border-[#7B1829]'
                      }`}
                    >
                      {slot} {isTaken ? '(Booked)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Service Selection, E2EE Consultation Notes & Deposit Checkout */}
          <div className="lg:col-span-7 bg-white border border-[#E5DAD0] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                  Session Package
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                >
                  {SERVICE_PACKAGES.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.title} — ৳{pkg.priceBdt.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                  Reference Look (Optional)
                </label>
                <select
                  value={selectedLookId}
                  onChange={(e) => setSelectedLookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                >
                  {MAKEUP_LOOKS.map((look) => (
                    <option key={look.id} value={look.id}>
                      {look.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g., 017XX-XXXXXX"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#5C4E47]">
                  Private Skin Sensitivity & Outfit Notes
                </label>
                <span className="inline-flex items-center gap-1 text-xs text-[#6B5B53]">
                  <Lock className="w-3 h-3 text-[#7B1829]" />
                  AES-256-GCM Encrypted
                </span>
              </div>
              <textarea
                rows={2}
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Allergies, outfit color, saree/lehenga draping notes (encrypted on your device before storage)..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
              />
            </div>

            {/* Deposit Payment Method */}
            <div className="pt-4 border-t border-[#E5DAD0] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[#6B5B53]">
                  30% Booking Retainer Checkout
                </span>
                <span className="text-xs text-[#6B5B53] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7B1829]" /> Instant Receipt
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['bKash', 'Nagad', 'Card', 'Bank'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      paymentMethod === method
                        ? 'bg-[#7B1829] border-[#7B1829] text-white'
                        : 'bg-[#FAF6F1] border-[#E5DAD0] text-[#1E1816] hover:border-[#7B1829]'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {method}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C4E47] mb-1.5">
                  {paymentMethod === 'bKash' || paymentMethod === 'Nagad'
                    ? `${paymentMethod} Account Number / Last 4 Digits`
                    : paymentMethod === 'Card'
                    ? 'Cardholder Name or Last 4 Digits'
                    : 'Bank Transfer Reference'}
                </label>
                <input
                  type="text"
                  value={paymentAccountHint}
                  onChange={(e) => setPaymentAccountHint(e.target.value)}
                  placeholder={
                    paymentMethod === 'bKash' || paymentMethod === 'Nagad'
                      ? 'e.g., 017XX-XX4512'
                      : 'e.g., Visa ending 4242'
                  }
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F1] border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="px-4 py-3 bg-[#7B1829]/8 border border-[#7B1829]/30 rounded-lg text-xs text-[#7B1829] font-medium">
                {errorMsg}
              </div>
            )}

            <div className="pt-4 border-t border-[#E5DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#6B5B53]">
                  Due Today ({selectedService.depositPercent}% Retainer) · Balance ৳
                  {(selectedService.priceBdt - depositAmount).toLocaleString()} at Studio
                </p>
                <p className="text-2xl font-semibold text-[#1E1816] tabular-nums">
                  ৳{depositAmount.toLocaleString()}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                {submitting
                  ? 'Verifying Deposit...'
                  : user
                  ? `Pay ৳${depositAmount.toLocaleString()} & Confirm`
                  : 'Sign In & Confirm Deposit'}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
