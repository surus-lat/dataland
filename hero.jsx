/* ───────────────────────────────────────────────────────────────────────────
   DatahubHero — landing hero for the human-mode top page.
   Overlay only — no background image. Settings baked in as constants.
─────────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useMemo } = React;

  const MONO   = "'JetBrains Mono', 'Courier New', monospace";
  const SANS   = "'Inter', system-ui, sans-serif";
  const ACCENT = '#a6c8cb';

  const FONTS = {
    goudy:     { stack: "'Goudy Bookletter 1911', Georgia, serif" },
    cinzeldec: { stack: "'Cinzel Decorative', serif" },
    trajan:    { stack: "'Trajan Pro', 'Cinzel', serif" },
  };

  /* ── Baked design settings ── */
  const S = {
    font:      'trajan',
    titleSize: 88,
    subSize:   19,
    subWeight: 400,
    subsubShow: true,
    textSwap:   false,
    textPos:   { x: 0, y: 0 },
    termScale: 91,
    termGlow:  41,
    termPos:   { x: 0, y: 0 },
  };

  const font       = (FONTS[S.font] || FONTS.trajan).stack;
  const subText    = S.textSwap ? '/<task?>/<domain?>/<language?>' : 'open-source | community-driven';
  const subsubText = S.textSwap ? 'open-source | community-driven' : '/<task?>/<domain?>/<language?>';

  /* Fallback paths shown while data.json is still loading. Same shape as real
     records: task / domain / first language + dataset name / license / year. */
  const DEFAULT_PATHS = [
    { tarea: 'transcribe',     dominio: 'general',   lang: 'es-AR', name: '—',         license: '—',          year: '—' },
  ];

  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  const termShadow = (glow) => {
    const inner = toHex(glow / 100 * 0.38 * 255);
    const outer = toHex(glow / 100 * 0.18 * 255);
    const ring  = toHex(0.40 * 0.26 * 255);
    return `0 10px 50px rgba(0,0,0,0.22), 0 0 0 1px ${ACCENT}${ring}, 0 0 34px ${ACCENT}${inner}, 0 0 70px ${ACCENT}${outer}`;
  };

  /* ── Terminal ── */
  function Terminal({ paths }) {
    const list = (paths && paths.length) ? paths : DEFAULT_PATHS;
    const [idx, setIdx] = useState(0);
    const [typed, setTyped] = useState(0);
    const [phase, setPhase] = useState('typing');
    // clamp idx in case data.json shrinks between renders
    const safeIdx = idx % list.length;
    const p = list[safeIdx];
    const full = `/${p.tarea}/${p.dominio}/${p.lang}`;

    useEffect(() => {
      let timer;
      if (phase === 'typing') {
        if (typed < full.length) timer = setTimeout(() => setTyped(typed + 1), 44);
        else timer = setTimeout(() => setPhase('hold'), 2100);
      } else if (phase === 'hold') {
        timer = setTimeout(() => setPhase('del'), 320);
      } else {
        if (typed > 0) timer = setTimeout(() => setTyped(typed - 1), 17);
        else { setIdx(i => (i + 1) % list.length); setPhase('typing'); }
      }
      return () => clearTimeout(timer);
    }, [typed, phase, idx, full.length, list.length]);

    const dim = 'rgba(255,255,255,0.34)';
    const segs = [
      { t: '/', c: dim }, { t: p.tarea, c: 'rgba(255,255,255,0.88)' },
      { t: '/', c: dim }, { t: p.dominio, c: ACCENT },
      { t: '/', c: dim }, { t: p.lang, c: 'rgba(255,255,255,0.52)' },
    ];
    let rem = typed;
    const parts = segs.map((s, i) => {
      const sl = s.t.slice(0, Math.max(0, rem));
      rem -= s.t.length;
      return <span key={i} style={{ color: s.c }}>{sl}</span>;
    });
    const done = phase === 'hold';

    return (
      <div style={{
        width: 'min(500px, 92vw)',
        transform: `scale(${S.termScale / 100}) translate(${S.termPos.x}px, ${S.termPos.y}px)`,
        transformOrigin: 'center bottom',
        fontFamily: MONO,
        background: 'linear-gradient(180deg, rgba(13,17,14,0.46), rgba(13,17,14,0.28))',
        backdropFilter: 'blur(9px)', WebkitBackdropFilter: 'blur(9px)',
        borderRadius: 3, borderTop: `1px solid ${ACCENT}88`,
        padding: '16px 20px 15px',
        boxShadow: termShadow(S.termGlow),
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em',
          marginBottom: 11, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT,
            boxShadow: '0 0 9px ' + ACCENT, flexShrink: 0 }} />
          <span style={{ fontFamily: FONTS.goudy.stack, fontSize: 16, color: 'rgba(255,255,255,0.74)' }}>datahub</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{'/<task?>/<domain?>/<language?>'}</span>
        </div>
        <div style={{ fontSize: 16, minHeight: 21, display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.34)', marginRight: 5 }}>→</span>
          {parts}
          <span style={{ animation: 'cur-blink 1.15s steps(1) infinite', color: ACCENT, marginLeft: 2 }}>▌</span>
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 9, minHeight: 14,
          opacity: done ? 1 : 0, transition: 'opacity 220ms', letterSpacing: '0.04em' }}>
          {p.name} · {p.license} · {p.year}
        </div>
      </div>
    );
  }

  /* ── Cluster ── */
  function Cluster({ items }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)',
            textShadow: '0 1px 9px rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.26)' }}>◆</span>
            {it}
          </div>
        ))}
      </div>
    );
  }

  /* ── Manuscript link — top-left mirror of the lat/long whisper ── */
  function ManuscriptLink() {
    const [hover, setHover] = useState(false);
    const color    = hover ? '#aceeC0' : 'rgba(255,255,255,0.42)';
    const dotColor = hover ? '#aceeC0' : 'rgba(255,255,255,0.32)';
    return (
      <a href="/manuscript.html"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'absolute', top: 50, left: 'clamp(16px, 8vw, 56px)', zIndex: 6,
          fontFamily: MONO, fontSize: 'clamp(8px, 2.5vw, 10px)', letterSpacing: '0.18em', textTransform: 'uppercase',
          color, textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          textDecoration: 'none', transition: 'color 0.2s' }}>
        <span style={{ fontSize: 7, color: dotColor, transition: 'color 0.2s' }}>◆</span>
        Manuscript
      </a>
    );
  }

  /* ── Hero ── */
  function DatahubHero() {
    const [data, setData] = useState(null);
    useEffect(() => {
      fetch('data.json')
        .then(r => r.json())
        .then(setData)
        .catch(() => setData({ records: [], domains: [], languages: [], contributing_organizations: [] }));
    }, []);

    const stats = useMemo(() => {
      if (!data) return null;
      // Counts reflect what is actually present in records[], not the
      // vocabulary breadth. "N/A" and "Multilingual" are bookkeeping values
      // and excluded from the language count.
      const records = data.records || [];
      const domains = new Set();
      const langs   = new Set();
      const orgs    = new Set();
      for (const r of records) {
        if (r.domain) domains.add(r.domain);
        if (r.organization) orgs.add(r.organization);
        for (const l of (r.languages || [])) {
          if (l && l !== 'N/A' && l !== 'Multilingual') langs.add(l);
        }
      }
      return {
        datasets:     records.length,
        domains:      domains.size,
        languages:    langs.size,
        contributors: orgs.size,
      };
    }, [data]);

    const clusterItems = stats
      ? [
          `${stats.datasets} DATASETS`,
          `${stats.domains} DOMAINS · ${stats.languages} LANGUAGES`,
          `${stats.contributors} CONTRIBUTORS`,
        ]
      : ['— DATASETS', '— DOMAINS · — LANGUAGES', '— CONTRIBUTORS'];

    /* Terminal examples sourced from real records in data.json */
    const terminalPaths = useMemo(() => {
      const records = data && data.records;
      if (!records || !records.length) return null;
      return records.map(r => ({
        tarea:   r.task    || 'unknown',
        dominio: r.domain  || 'general',
        lang:    (r.languages && r.languages[0]) || 'es',
        name:    r.model   || '—',
        license: r.license || '—',
        year:    String(r.year || '—'),
      }));
    }, [data]);

    return (
      <div style={{ position: 'absolute', inset: 0, fontFamily: SANS }}>

        {/* Dark overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,13,20,0.30)' }} />
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,13,20,0.34) 0%, transparent 30%, transparent 72%, rgba(10,13,20,0.40) 100%)' }} />

        {/* Lat/long whisper — top-right, outside scale. clamp() so it doesn't collide
            with the nav-manifest at 360px while leaving desktop pixel-identical. */}
        <div style={{ position: 'absolute', top: 50, right: 'clamp(16px, 8vw, 56px)', zIndex: 6,
          fontFamily: MONO, fontSize: 'clamp(8px, 2.5vw, 10px)', letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.42)', textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.32)' }}>◆</span>
          −34.6037° S · −58.3816° W · BUENOS AIRES
        </div>

        {/* Manuscript link — top-left, mirrors the lat/long whisper aesthetic */}
        <ManuscriptLink />


        {/* Content — 95% scale */}
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.95)', transformOrigin: 'center' }}>

          {/* Title block */}
          <div style={{ position: 'absolute', top: '30%', left: '50%', zIndex: 8, textAlign: 'center',
            transform: `translateX(-50%) translate(${S.textPos.x}px, ${S.textPos.y}px)` }}>
            <div style={{ fontFamily: font, fontSize: 'clamp(40px, 12vw, 88px)', lineHeight: 1.0,
              color: 'rgba(255,255,255,0.96)', textShadow: '0 2px 24px rgba(0,0,0,0.42)' }}>
              Datahub
            </div>
            <div style={{ fontFamily: font, fontSize: 'clamp(13px, 4vw, 19px)', fontWeight: S.subWeight, lineHeight: 1.2,
              color: 'rgba(255,255,255,0.62)', textShadow: '0 2px 16px rgba(0,0,0,0.4)',
              marginTop: 14, whiteSpace: 'normal' }}>
              {subText}
            </div>
            {S.subsubShow && (
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 24 }}>
                {subsubText}
              </div>
            )}
          </div>

          {/* Cluster — lower-left */}
          <div style={{ position: 'absolute', bottom: '33%', left: 24, zIndex: 7 }}>
            <Cluster items={clusterItems} />
          </div>

          {/* Terminal */}
          <div style={{ position: 'absolute', bottom: 108, left: '50%', zIndex: 9,
            transform: `translateX(-50%) translate(${S.termPos.x}px, ${S.termPos.y}px)` }}>
            <Terminal paths={terminalPaths} />
          </div>

        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('hero')).render(<DatahubHero />);
})();
