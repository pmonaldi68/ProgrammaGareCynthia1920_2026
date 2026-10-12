// Logo Ufficiale LND Comitato Regionale Lazio in formato SVG Data URI ad alta definizione
export const LND_LAZIO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="lndGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#0254b8" />
      <stop offset="100%" stop-color="#002b66" />
    </radialGradient>
  </defs>
  <!-- Sfondo Circolare Blu Istituzionale -->
  <circle cx="80" cy="80" r="77" fill="url(#lndGrad)" stroke="#eab308" stroke-width="4.5"/>
  <circle cx="80" cy="80" r="71" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7"/>
  <!-- Scritta LND Oro -->
  <text x="80" y="65" font-family="'Arial Black', Arial, Helvetica, sans-serif" font-weight="900" font-size="34" fill="#fbbf24" text-anchor="middle" letter-spacing="1">LND</text>
  <!-- Nastro Tricolore Italiano -->
  <g transform="translate(35, 76)">
    <rect x="0" y="0" width="30" height="7" fill="#009246" rx="1"/>
    <rect x="30" y="0" width="30" height="7" fill="#ffffff"/>
    <rect x="60" y="0" width="30" height="7" fill="#ce2b37" rx="1"/>
  </g>
  <!-- Scritta LAZIO Bianca -->
  <text x="80" y="108" font-family="'Arial Black', Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="3">LAZIO</text>
  <!-- Dettagli decorativi -->
  <circle cx="80" cy="124" r="3.5" fill="#fbbf24"/>
  <circle cx="68" cy="124" r="2" fill="#ffffff" opacity="0.8"/>
  <circle cx="92" cy="124" r="2" fill="#ffffff" opacity="0.8"/>
</svg>`;

export const LND_LAZIO_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(LND_LAZIO_SVG)}`;
