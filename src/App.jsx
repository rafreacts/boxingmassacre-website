import { useState, useEffect, useRef } from "react";

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51TZttkIZhKSu0lLWuwYVbBQ420aFgCotk7kyYZdIS1hwINkClgJDS23p0t768YQ38asMtnX3JPb8pBMQjVl5HNun00wXHRZwZe';
const BACKEND_URL = '/api/subscribe';

const PLAN = {
  id: "boxing",
  name: "VIP Access",
  price: 15,
  priceId: "price_1Tc9MkIZhKSu0lLWMUKyD3lG",
  telegram: "https://t.me/+9IdJkqInNMs3ODc0",
  features: [
    "Early access to value odds before they shift",
    "Boxing picks",
    "MMA picks",
    "Private Telegram group access",
  ],
};

function loadStripe(publishableKey) {
  return new Promise((resolve) => {
    if (window.Stripe) { resolve(window.Stripe(publishableKey)); return; }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => resolve(window.Stripe(publishableKey));
    document.head.appendChild(script);
  });
}

const STATS = [
  { value: "10M+", label: "Monthly Views" },
  { value: "73%", label: "Win Rate" },
  { value: "UFC · BOX", label: "Coverage" },
];

const PICKS = [
  { fight: "Canelo vs Munguia", pick: "Canelo by KO/TKO", odds: "+185", result: "WIN" },
  { fight: "Islam Makhachev", pick: "Makhachev Decision Win", odds: "-140", result: "WIN" },
  { fight: "Tank Davis vs Frank Martin", pick: "Tank Davis ITD", odds: "+220", result: "WIN" },
  { fight: "Tyson Fury vs Usyk", pick: "Usyk Decision", odds: "+300", result: "WIN" },
];

export default function App() {
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [telegramLink, setTelegramLink] = useState("");
  const [scrollY, setScrollY] = useState(0);

  const stripeRef = useRef(null);
  const cardElementRef = useRef(null);
  const cardMountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!modal) return;
    let cancelled = false;

    const initStripe = async () => {
      try {
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (cancelled) return;
        stripeRef.current = stripe;

        const elements = stripe.elements({
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#e8ff00',
              colorBackground: '#0f0f0f',
              colorText: '#ffffff',
              colorDanger: '#ff4444',
              fontFamily: 'monospace',
              borderRadius: '0px',
            }
          }
        });

        const card = elements.create('card', {
          hidePostalCode: true,
          style: {
            base: {
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '15px',
              '::placeholder': { color: '#444' },
            },
            invalid: { color: '#ff4444' }
          }
        });

        setTimeout(() => {
          if (cardMountRef.current && !cancelled) {
            card.mount(cardMountRef.current);
            cardElementRef.current = card;
            setTimeout(() => { if (cardElementRef.current) cardElementRef.current.focus(); }, 200);
          }
        }, 300);
      } catch (e) {
        console.error('Stripe error:', e);
      }
    };

    initStripe();
    return () => {
      cancelled = true;
      if (cardElementRef.current) {
        try { cardElementRef.current.unmount(); } catch(e) {}
        cardElementRef.current = null;
      }
    };
  }, [modal]);

  const openModal = () => {
    setModal(true);
    setName(""); setEmail(""); setError("");
    setSuccess(false); setLoading(false); setTelegramLink("");
  };

  const closeModal = () => {
    if (cardElementRef.current) {
      try { cardElementRef.current.unmount(); } catch(e) {}
      cardElementRef.current = null;
    }
    setModal(false);
  };

  const handlePay = async () => {
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email."); return; }
    if (!stripeRef.current || !cardElementRef.current) { setError("Payment not ready. Refresh and try again."); return; }
    setError(""); setLoading(true);

    try {
      const { paymentMethod, error: stripeError } = await stripeRef.current.createPaymentMethod({
        type: 'card',
        card: cardElementRef.current,
        billing_details: { name, email },
      });

      if (stripeError) { setError(stripeError.message); setLoading(false); return; }

      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          priceId: PLAN.priceId,
          email, name,
          tier: PLAN.id,
        }),
      });

      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }

      setTelegramLink(data.telegramLink || PLAN.telegram);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#080808", color: "#fff", fontFamily: "'DM Mono', 'Courier New', monospace", minHeight: "100vh", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=Oswald:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080808; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .fade { animation: fadeUp 0.6s ease forwards; }
        .glow { box-shadow: 0 0 30px rgba(232,255,0,0.15); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #e8ff00; }
        .pick-row:hover { background: #111 !important; }
        .btn-main:hover { background: #d4eb00 !important; transform: translateY(-1px); }
        .btn-main:active { transform: translateY(0); }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px",
        background: scrollY > 50 ? "rgba(8,8,8,0.98)" : "transparent",
        borderBottom: scrollY > 50 ? "1px solid #1a1a1a" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, background: "#e8ff00", borderRadius: "50%", animation: "blink 1.5s infinite" }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 3, color: "#fff" }}>BOXING<span style={{ color: "#e8ff00" }}>MASSACRE</span></span>
        </div>
        <button onClick={openModal} className="btn-main" style={{
          background: "#e8ff00", color: "#080808", border: "none",
          fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
          letterSpacing: 2, textTransform: "uppercase", padding: "8px 20px",
          cursor: "pointer", transition: "all 0.2s",
        }}>Join — $15/mo</button>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "120px 40px 80px",
        maxWidth: 900, margin: "0 auto", position: "relative"
      }}>
        {/* Background grid */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(232,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,255,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="fade" style={{ animationDelay: "0.1s", opacity: 0, marginBottom: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 4, color: "#e8ff00", textTransform: "uppercase" }}>
              // private picks channel
            </span>
          </div>

          <h1 className="fade" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(72px, 14vw, 160px)",
            lineHeight: 0.9,
            letterSpacing: 2,
            animationDelay: "0.2s", opacity: 0,
          }}>
            STOP<br />LOSING<br /><span style={{ color: "#e8ff00", WebkitTextStroke: "0px" }}>BETS.</span>
          </h1>

          <p className="fade" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "clamp(13px, 1.4vw, 16px)",
            color: "#888",
            maxWidth: 480,
            lineHeight: 1.8,
            margin: "32px 0 48px",
            animationDelay: "0.4s", opacity: 0,
            fontWeight: 300,
          }}>
            Inside access to every pick from the account with 10M monthly views. Boxing. MMA. Real analysis. No noise.
          </p>

          <div className="fade" style={{ display: "flex", gap: 16, flexWrap: "wrap", animationDelay: "0.5s", opacity: 0 }}>
            <button onClick={openModal} className="btn-main glow" style={{
              background: "#e8ff00", color: "#080808", border: "none",
              fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600,
              letterSpacing: 3, textTransform: "uppercase", padding: "18px 48px",
              cursor: "pointer", transition: "all 0.2s",
            }}>START 7-DAY FREE TRIAL</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#555", fontFamily: "'DM Mono', monospace" }}>
              <span>$15/month after trial</span>
            </div>
          </div>

          {/* Stats */}
          <div className="fade" style={{ display: "flex", gap: 48, marginTop: 72, animationDelay: "0.7s", opacity: 0, flexWrap: "wrap" }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, color: "#e8ff00", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", overflow: "hidden", background: "#0c0c0c", padding: "12px 0" }}>
        <div style={{ display: "flex", animation: "marquee 18s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(2)].flatMap(() =>
            ["BOXING PICKS", "◆", "UFC ANALYSIS", "◆", "LIVE ODDS", "◆", "MMA BREAKDOWNS", "◆", "VALUE BETS", "◆", "FIGHT NIGHT", "◆"]
              .map((t, i) => (
                <span key={`${t}-${i}`} style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 4,
                  color: t === "◆" ? "#e8ff00" : "#333", padding: "0 28px", textTransform: "uppercase"
                }}>{t}</span>
              ))
          )}
        </div>
      </div>

      {/* WHAT YOU GET */}
      <section style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 4, color: "#e8ff00", textTransform: "uppercase", marginBottom: 12 }}>// membership includes</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(40px,6vw,72px)", lineHeight: 1 }}>
            WHAT YOU GET
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2, background: "#1a1a1a" }}>
          {PLAN.features.map((f, i) => (
            <div key={i} style={{ background: "#080808", padding: "28px 24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ color: "#e8ff00", fontSize: 14, flexShrink: 0, marginTop: 2 }}>→</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#aaa", lineHeight: 1.6, fontWeight: 300 }}>{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 40px", maxWidth: 900, margin: "0 auto", textAlign: "center", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 4, color: "#e8ff00", textTransform: "uppercase", marginBottom: 16 }}>// limited spots</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px,8vw,96px)", lineHeight: 1, marginBottom: 24 }}>
          READY TO<br /><span style={{ color: "#e8ff00" }}>WIN?</span>
        </h2>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#666", marginBottom: 40, fontWeight: 300, lineHeight: 1.8 }}>
          7 days free. Cancel anytime. No questions asked.
        </p>
        <button onClick={openModal} className="btn-main glow" style={{
          background: "#e8ff00", color: "#080808", border: "none",
          fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 600,
          letterSpacing: 3, textTransform: "uppercase", padding: "20px 64px",
          cursor: "pointer", transition: "all 0.2s",
        }}>JOIN BOXINGMASSACRE — $15/MO</button>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 40px", borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 3, color: "#e8ff00" }}>BOXINGMASSACRE</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#333" }}>© 2025 BoxingMassacre. All rights reserved.</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#333" }}>Secured by Stripe</span>
      </footer>

      {/* MODAL */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && closeModal()} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(8px)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#0c0c0c", border: "1px solid #222", borderTop: "2px solid #e8ff00",
            width: "100%", maxWidth: 440, padding: "40px 36px",
            position: "relative", maxHeight: "90vh", overflowY: "auto", zIndex: 501,
          }}>
            <button onClick={closeModal} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#555", fontSize: 24, cursor: "pointer" }}
              onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#555"}>×</button>

            {!success ? (
              <>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 4, color: "#e8ff00", textTransform: "uppercase", marginBottom: 8 }}>// vip access</div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, marginBottom: 4 }}>BoxingMassacre</h3>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#e8ff00", lineHeight: 1 }}>
                  $15<span style={{ fontSize: 18, color: "#555", fontFamily: "'DM Mono', monospace", fontWeight: 300 }}>/mo</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, marginBottom: 28, background: "rgba(232,255,0,0.06)", border: "1px solid rgba(232,255,0,0.2)", padding: "5px 14px", fontSize: 11, color: "#e8ff00", fontFamily: "'DM Mono', monospace" }}>
                  ◆ 7 days free — then $15/month
                </div>

                <div style={{ height: 1, background: "#1a1a1a", marginBottom: 24 }} />

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    style={{ width: "100%", background: "#111", border: "1px solid #222", padding: "13px 16px", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 14, outline: "none" }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
                    style={{ width: "100%", background: "#111", border: "1px solid #222", padding: "13px 16px", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 14, outline: "none" }} />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Card Details</label>
                  <div ref={cardMountRef} onClick={() => cardElementRef.current && cardElementRef.current.focus()}
                    style={{ background: "#111", border: "1px solid #222", padding: "14px 16px", minHeight: 46, cursor: "text" }} />
                </div>

                {error && <p style={{ color: "#ff4444", fontFamily: "'DM Mono', monospace", fontSize: 12, marginBottom: 8, marginTop: 8 }}>{error}</p>}

                <button onClick={handlePay} disabled={loading} style={{
                  width: "100%", padding: "17px", marginTop: 16,
                  background: loading ? "#555" : "#e8ff00", border: "none",
                  color: "#080808", fontFamily: "'Oswald', sans-serif",
                  fontSize: 15, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.2s",
                }}>
                  {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #080808", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />}
                  {loading ? "Processing..." : "Start Free Trial"}
                </button>

                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#444", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                  🔒 Secured by Stripe · Cancel anytime before day 7
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: "#e8ff00", lineHeight: 1, marginBottom: 12 }}>LFG!</div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 12 }}>You're In The Group</h3>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#666", lineHeight: 1.8, marginBottom: 28, fontWeight: 300 }}>
                  Trial started. Check your email then tap below to join the private Telegram.
                </p>
                <a href={telegramLink || PLAN.telegram} target="_blank" rel="noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#e8ff00", color: "#080808",
                  padding: "14px 32px", textDecoration: "none",
                  fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: 3, textTransform: "uppercase",
                }}>📲 JOIN TELEGRAM</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
