/**
 * Full-bleed hero background illustration for the landing page.
 * Soft editorial line-art in brand tokens (navy/sage/sand on ivory) —
 * original geometric composition, no copied assets, presentational only.
 * Text readability comes from the ivory gradient overlay in the hero,
 * so strokes stay light and airy here.
 */
export function HeroBackgroundIllustration() {
  return (
    <svg
      viewBox="0 0 1440 620"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label="Minh họa hành trình kết nối kỹ năng và cơ hội"
    >
      <rect x="0" y="0" width="1440" height="620" fill="#faf8f3" />
        {/* soft suns */}
        <circle cx="1230" cy="110" r="72" fill="#d7b98e" opacity="0.35" />
        <circle cx="1230" cy="110" r="44" fill="#d7b98e" opacity="0.50" />
        <circle cx="180" cy="120" r="30" fill="#8fb3cf" opacity="0.35" />
        <circle cx="180" cy="120" r="17" fill="#8fb3cf" opacity="0.42" />
        {/* sage arcs */}
        <path d="M120 560 A 560 560 0 0 1 1320 560" fill="none" stroke="#7fae9b" strokeWidth="5" strokeLinecap="round" opacity="0.60" />
        <path d="M260 560 A 420 420 0 0 1 1180 560" fill="none" stroke="#7fae9b" strokeWidth="2.5" strokeLinecap="round" opacity="0.40" />
        {/* dotted journey path */}
        <path
          d="M240 440 C 420 320, 560 460, 740 380 S 1020 300, 1150 360"
          fill="none"
          stroke="#355c8c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="1 12"
          opacity="0.75"
        />
      {/* candidate node */}
      <circle cx="240" cy="440" r="42" fill="#ffffff" stroke="#355c8c" strokeWidth="3" opacity="0.9" />
      <circle cx="240" cy="428" r="12" fill="none" stroke="#355c8c" strokeWidth="3" />
      <path d="M214 460 q26 -20 52 0" fill="none" stroke="#355c8c" strokeWidth="3" strokeLinecap="round" />
      {/* skill checkpoints */}
      <circle cx="540" cy="392" r="17" fill="#ffffff" stroke="#7fae9b" strokeWidth="3" />
      <path d="M531 392 l6 6 12 -12" fill="none" stroke="#7fae9b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="880" cy="342" r="17" fill="#ffffff" stroke="#7fae9b" strokeWidth="3" />
      <path d="M871 342 l6 6 12 -12" fill="none" stroke="#7fae9b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* company node */}
      <rect x="1118" y="328" width="88" height="88" rx="24" fill="#355c8c" opacity="0.9" />
      <path d="M1146 372 h32 M1162 356 v32" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        {/* stars */}
        <path d="M660 120 l7 15 15 7 -15 7 -7 15 -7 -15 -15 -7 15 -7 Z" fill="#355c8c" opacity="0.85" />
        <path d="M760 88 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5 Z" fill="#7fae9b" opacity="0.9" />
        <path d="M410 170 l4.4 9.4 9.4 4.4 -9.4 4.4 -4.4 9.4 -4.4 -9.4 -9.4 -4.4 9.4 -4.4 Z" fill="#d7b98e" />
        <path d="M1010 150 l3.6 8 8 3.6 -8 3.6 -3.6 8 -3.6 -8 -8 -3.6 8 -3.6 Z" fill="#d7b98e" />
        <path d="M90 300 l3.6 8 8 3.6 -8 3.6 -3.6 8 -3.6 -8 -8 -3.6 8 -3.6 Z" fill="#355c8c" opacity="0.65" />
        {/* dots */}
        <circle cx="580" cy="150" r="5" fill="#8fb3cf" opacity="0.85" />
        <circle cx="940" cy="470" r="5" fill="#8fb3cf" opacity="0.75" />
        <circle cx="740" cy="470" r="5" fill="#d7b98e" opacity="0.9" />
        <circle cx="330" cy="270" r="5" fill="#d7b98e" opacity="0.85" />
        {/* ground line */}
        <line x1="140" y1="572" x2="1300" y2="572" stroke="#355c8c" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}
