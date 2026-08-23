/** Swaying bride & groom holding hands, with popping confetti hearts. */
export function Couple({ label }: { label: string }) {
  return (
    <svg class="couple" viewBox="0 0 240 120" role="img" aria-label={label}>
      <g stroke="#3a3128" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        {/* bride */}
        <g class="sway" style={{ transformOrigin: "80px 104px" }}>
          <circle cx="80" cy="38" r="14" fill="oklch(0.97 0.01 75)" />
          <path d="M66 32 Q64 18 80 20 Q96 18 94 32" fill="#3a3128" />
          <path d="M65 30 Q60 44 66 52 M95 30 Q100 44 94 52" stroke-width="2" />
          <path d="M74 42 Q80 47 86 42" />
          <circle cx="75" cy="36" r="1.6" fill="#3a3128" stroke="none" />
          <circle cx="85" cy="36" r="1.6" fill="#3a3128" stroke="none" />
          <path d="M80 52 L68 100 Q80 108 92 100 Z" fill="white" />
          <path d="M73 66 L87 66" stroke-width="1.5" opacity="0.4" />
          <path d="M70 80 L90 80" stroke-width="1.5" opacity="0.4" />
          <circle cx="80" cy="22" r="3" fill="oklch(0.87 0.05 90)" stroke-width="1.5" />
        </g>
        {/* holding hands */}
        <path class="hands" d="M96 70 Q120 60 144 70" />
        {/* groom */}
        <g class="sway reverse" style={{ transformOrigin: "160px 104px" }}>
          <circle cx="160" cy="38" r="14" fill="oklch(0.97 0.01 75)" />
          <path d="M146 34 Q146 20 160 20 Q174 20 174 34 L170 30 Q160 26 150 30 Z" fill="#3a3128" />
          <path d="M154 42 Q160 47 166 42" />
          <circle cx="155" cy="36" r="1.6" fill="#3a3128" stroke="none" />
          <circle cx="165" cy="36" r="1.6" fill="#3a3128" stroke="none" />
          <path d="M152 52 L150 100 M168 52 L170 100" />
          <path d="M150 100 L170 100" />
          <path d="M160 54 L156 62 L160 70 L164 62 Z" fill="oklch(0.55 0.11 40)" stroke-width="1.5" />
          <path d="M152 52 Q160 58 168 52" />
        </g>
        {/* confetti hearts */}
        <path class="heart" d="M40 24 q2 -4 4 0 q2 -4 4 0 q0 3 -4 6 q-4 -3 -4 -6" fill="oklch(0.55 0.11 40)" stroke="none" style={{ transformOrigin: "44px 27px" }} />
        <path class="heart" d="M196 20 q2 -4 4 0 q2 -4 4 0 q0 3 -4 6 q-4 -3 -4 -6" fill="oklch(0.87 0.05 90)" stroke="none" style={{ transformOrigin: "200px 23px", animationDelay: "0.8s" }} />
        <path class="heart" d="M212 48 q1.5 -3 3 0 q1.5 -3 3 0 q0 2.5 -3 4.5 q-3 -2 -3 -4.5" fill="oklch(0.55 0.11 40)" stroke="none" opacity="0.6" style={{ transformOrigin: "215px 50.5px", animationDelay: "1.6s" }} />
      </g>
    </svg>
  );
}
