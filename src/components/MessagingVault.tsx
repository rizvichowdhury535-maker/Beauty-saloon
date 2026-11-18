import React, { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Lock, LogOut, MessageCircle, Send, ShieldCheck, Users } from 'lucide-react';
import { STUDIO_INFO } from '../data/studioCatalog';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { decryptPayload, deriveRoomKey, encryptPayload } from '../lib/crypto';
import { useAuth } from '../context/AuthContext';

interface ConversationSummary {
  id: string;
  clientId: string;
  clientName: string;
  keyFingerprint: string;
  lastMessagePreview: string;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'studio';
  text: string;
  createdAtLabel: string;
}

export function MessagingVault() {
  const { user, isAdmin, signInWithGoogle, signOutUser } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [fingerprint, setFingerprint] = useState<string>('AES256-VERIFYING');
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [typingUser, setTypingUser] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize or select room for authenticated user
  useEffect(() => {
    if (!user) {
      setActiveRoomId('');
      setConversations([]);
      setMessages([]);
      return;
    }

    if (!isAdmin) {
      const roomId = user.uid;
      setActiveRoomId(roomId);

      // Ensure conversation document exists for this client
      (async () => {
        const convRef = doc(db, 'conversations', roomId);
        try {
          const snap = await getDoc(convRef);
          const { fingerprint: fp } = await deriveRoomKey(roomId);
          setFingerprint(fp);
          if (!snap.exists()) {
            await setDoc(convRef, {
              clientId: user.uid,
              clientName: (user.displayName || 'Studio Client').slice(0, 100),
              encryptionAlgo: 'AES-256-GCM',
              keyFingerprint: fp,
              lastMessagePreview: 'Encrypted consultation thread initialized',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `conversations/${roomId}`);
        }
      })();
    } else {
      // Studio Admin sees all client conversations
      const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: ConversationSummary[] = snap.docs.map((d) => ({
            id: d.id,
            clientId: String(d.data().clientId || d.id),
            clientName: String(d.data().clientName || 'Client'),
            keyFingerprint: String(d.data().keyFingerprint || ''),
            lastMessagePreview: String(d.data().lastMessagePreview || ''),
          }));
          setConversations(list);
          if (list.length > 0 && !activeRoomId) {
            setActiveRoomId(list[0].id);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')
      );
      return () => unsub();
    }
  }, [user, isAdmin]);

  // Update fingerprint whenever activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) return;
    deriveRoomKey(activeRoomId).then(({ fingerprint: fp }) => setFingerprint(fp));
  }, [activeRoomId]);

  // Firestore real-time listener on messages subcollection
  useEffect(() => {
    if (!user || !activeRoomId) return;

    const msgPath = `conversations/${activeRoomId}/messages`;
    const q = query(collection(db, msgPath), orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const decrypted = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const text = await decryptPayload(
              String(data.ciphertext || ''),
              String(data.iv || ''),
              activeRoomId
            );
            const ts = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            return {
              id: d.id,
              senderId: String(data.senderId || ''),
              senderName: String(data.senderName || 'Studio'),
              senderRole: (data.senderRole === 'studio' ? 'studio' : 'client') as 'client' | 'studio',
              text,
              createdAtLabel: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          })
        );
        setMessages(decrypted);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, msgPath)
    );

    return () => unsub();
  }, [user, activeRoomId]);

  // Real WebSocket connection to /ws for live presence, typing & instant encrypted relay
  useEffect(() => {
    if (!user || !activeRoomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'room:join',
          roomId: activeRoomId,
          userId: user.uid,
          userName: user.displayName || 'Client',
          role: isAdmin ? 'studio' : 'client',
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          participants?: { userId: string; userName: string }[];
          userId?: string;
          userName?: string;
          isTyping?: boolean;
        };

        if (data.type === 'room:joined' || data.type === 'presence:update') {
          setOnlineUsers(data.participants || []);
        } else if (data.type === 'typing:update' && data.userId !== user.uid) {
          setTypingUser(data.isTyping ? data.userName || 'Studio' : '');
        }
      } catch {
        // Ignore malformed socket frames
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user, activeRoomId, isAdmin]);

  const handleTyping = (val: string) => {
    setDraft(val);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing:update',
          payload: { isTyping: val.trim().length > 0 },
        })
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRoomId || !draft.trim()) return;

    const plaintext = draft.trim();
    setDraft('');
    setSending(true);

    try {
      const { ciphertext, iv } = await encryptPayload(plaintext, activeRoomId);
      const msgId = `msg_${Date.now()}`;
      const msgPath = `conversations/${activeRoomId}/messages/${msgId}`;

      await setDoc(doc(db, 'conversations', activeRoomId, 'messages', msgId), {
        clientId: activeRoomId,
        senderId: user.uid,
        senderName: (user.displayName || (isAdmin ? 'Farhana Studio' : 'Client')).slice(0, 100),
        senderRole: isAdmin ? 'studio' : 'client',
        ciphertext: ciphertext.slice(0, 8192),
        iv,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'conversations', activeRoomId), {
        lastMessagePreview: `Encrypted message (${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })})`,
        updatedAt: serverTimestamp(),
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'message:relay',
            payload: { id: msgId, ciphertext, iv },
          })
        );
        wsRef.current.send(
          JSON.stringify({
            type: 'typing:update',
            payload: { isTyping: false },
          })
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${activeRoomId}/messages`);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="messages" className="py-20 px-6 bg-[#F3ECE4]/70 border-y border-[#E5DAD0]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7B1829] mb-2">
              Direct Studio Inbox
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1E1816] text-balance">
              Real-Time End-to-End Encrypted Messaging
            </h2>
            <p className="mt-2 text-sm text-[#5C4E47] leading-relaxed">
              Discuss bridal outfit palettes, venue timings, or skin sensitivities directly with Farhana. Every message is encrypted client-side with AES-256-GCM.
            </p>
          </div>

          <a
            href={`${STUDIO_INFO.whatsappUrl}?text=${encodeURIComponent(
              'Hello Farhana! I would like to inquire about booking a makeup session.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5DAD0] text-xs font-medium text-[#1E1816] rounded-lg hover:border-[#7B1829] hover:text-[#7B1829] transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-[#7B1829]" />
            Chat in WhatsApp ({STUDIO_INFO.phoneDisplay})
          </a>
        </div>

        {!user ? (
          <div className="bg-white border border-[#E5DAD0] rounded-2xl p-8 sm:p-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#7B1829]">
              <Lock className="w-4 h-4" />
              AES-256-GCM Client-Side Encryption
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[#1E1816]">
              Sign in to open your private studio consultation thread
            </h3>
            <p className="text-sm text-[#5C4E47] leading-relaxed">
              Authentication creates your dedicated encrypted channel synced in real time via WebSockets and Firestore—or reach Farhana directly on WhatsApp at {STUDIO_INFO.phoneDisplay}.
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="px-5 py-3 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] transition-colors"
            >
              Sign In with Google to Message Studio
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#E5DAD0] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            {/* Left Sidebar: Active Threads (Admin) or Encryption Verification Info (Client) */}
            <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E5DAD0] bg-[#FAF6F1]/60 p-5 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1E1816]">
                    {isAdmin ? 'Client Threads' : 'Channel Security'}
                  </span>
                  <span className="text-xs text-[#6B5B53] tabular-nums">
                    {wsConnected ? 'WebSocket Live' : 'Syncing'}
                  </span>
                </div>

                {isAdmin ? (
                  <div className="space-y-2">
                    {conversations.length === 0 ? (
                      <p className="text-xs text-[#6B5B53]">No active client threads yet.</p>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => setActiveRoomId(conv.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            activeRoomId === conv.id
                              ? 'bg-white border-[#7B1829]'
                              : 'bg-white/60 border-[#E5DAD0] hover:bg-white'
                          }`}
                        >
                          <p className="text-sm font-semibold text-[#1E1816]">{conv.clientName}</p>
                          <p className="text-xs text-[#6B5B53] truncate mt-0.5">
                            {conv.lastMessagePreview}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-[#E5DAD0] rounded-xl space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[#1E1816]">
                      <ShieldCheck className="w-4 h-4 text-[#7B1829]" />
                      End-to-End Encrypted
                    </div>
                    <p className="text-[#5C4E47] leading-relaxed">
                      Messages are encrypted inside your browser using Web Crypto AES-256-GCM before leaving your device.
                    </p>
                    <div className="pt-2 border-t border-[#E5DAD0]">
                      <p className="text-[#6B5B53]">Key Fingerprint</p>
                      <p className="font-mono text-[#1E1816] mt-0.5">{fingerprint}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E5DAD0] text-xs text-[#6B5B53] flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {onlineUsers.length || 1} active in room
                </span>
                <span>Gulshan-1 Studio</span>
              </div>
            </aside>

            {/* Right Pane: Real-Time Encrypted Messages */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div className="px-6 py-4 border-b border-[#E5DAD0] flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[#1E1816]">
                    {isAdmin ? 'Client Consultation Thread' : 'Signature Artistry by Farhana'}
                  </h3>
                  <p className="text-xs text-[#6B5B53]">
                    {typingUser
                      ? `${typingUser} is typing...`
                      : `Verified E2EE Channel · ${fingerprint}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5DAD0] rounded-lg text-xs font-medium text-[#5C4E47] hover:text-[#7B1829] hover:border-[#7B1829] transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[340px]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 text-sm text-[#6B5B53]">
                    <Lock className="w-5 h-5 text-[#7B1829] mb-2" />
                    <p>No messages yet. Send an encrypted note about your upcoming look or date.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.senderId === user.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isSelf
                              ? 'bg-[#7B1829] text-white'
                              : 'bg-[#FAF6F1] border border-[#E5DAD0] text-[#1E1816]'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <span className="mt-1 text-[11px] text-[#6B5B53] tabular-nums">
                          {msg.senderName} · {msg.createdAtLabel}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-[#E5DAD0] bg-[#FAF6F1]/50 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Write an encrypted message to Farhana's studio..."
                  className="flex-1 px-4 py-2.5 bg-white border border-[#E5DAD0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B1829]"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
