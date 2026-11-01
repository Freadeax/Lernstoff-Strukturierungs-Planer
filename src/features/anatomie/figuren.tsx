// Schemazeichnungen für den Anatomie-Trainer. Bewusst schematisch, nicht maßstabsgetreu.
// Ansicht wie im Lehrbuch von vorn: Die rechte Körperseite liegt in der Zeichnung links.
// Die Nummern legt die Übungsrunde darüber (Koordinaten in aufgaben.ts).

import type { Figur } from '../quiz/Runde';

const herz: Figur = {
  viewBox: '0 0 300 280',
  beschreibung: 'Schema des Herzens von vorn mit Vorhöfen, Kammern, Klappen und großen Gefäßen, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Hohlvenen in den rechten Vorhof */}
      <rect className="fig-sauerstoffarm" x="2" y="84" width="44" height="22" rx="3" />
      <rect className="fig-sauerstoffarm" x="2" y="132" width="44" height="22" rx="3" />
      {/* Lungenvenen in den linken Vorhof */}
      <rect className="fig-sauerstoffreich" x="254" y="96" width="44" height="16" rx="3" />
      <rect className="fig-sauerstoffreich" x="254" y="126" width="44" height="16" rx="3" />
      {/* Truncus pulmonalis aus der rechten Kammer nach oben und zur Lunge */}
      <path className="fig-sauerstoffarm" d="M124 172 V52 H44 V30 H148 V172 Z" />
      <path className="fig-sauerstoffarm" d="M44 22 L22 41 L44 60 Z" />
      {/* Aorta aus der linken Kammer, Bogen zum Körper */}
      <path className="fig-sauerstoffreich" d="M152 172 V6 H262 V28 H176 V172 Z" />
      <path className="fig-sauerstoffreich" d="M262 -2 L284 17 L262 36 Z" />
      {/* Vorhöfe */}
      <rect className="fig-sauerstoffarm" x="40" y="72" width="80" height="90" rx="14" />
      <rect className="fig-sauerstoffreich" x="180" y="72" width="80" height="90" rx="14" />
      {/* Kammern */}
      <path className="fig-sauerstoffarm" d="M40 172 H149 V266 Q90 270 52 236 Q40 222 40 200 Z" />
      <path className="fig-sauerstoffreich" d="M151 172 H260 V200 Q260 236 210 262 Q180 274 151 266 Z" />
      {/* Kammerscheidewand */}
      <line className="fig-linie" x1="150" y1="172" x2="150" y2="266" />
      {/* Segelklappen zwischen Vorhof und Kammer */}
      <path className="fig-linie" d="M52 167 L76 178 M110 167 L86 178" />
      <path className="fig-linie" d="M192 167 L216 178 M248 167 L224 178" />
      {/* Taschenklappen am Abgang der großen Gefäße */}
      <path className="fig-linie" d="M126 146 Q131 152 136 146 Q141 152 146 146" />
      <path className="fig-linie" d="M154 146 Q159 152 164 146 Q169 152 174 146" />
    </g>
  ),
};

const atmung: Figur = {
  viewBox: '0 0 300 320',
  beschreibung: 'Schema der Atemwege und Lungen von vorn mit Nasenhöhle, Rachen, Kehlkopf, Luftröhre, Bronchien, Lungenflügeln und Zwerchfell, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Lungenflügel: rechts drei Lappen, links zwei mit Herzbucht */}
      <path className="fig-gewebe-2" d="M128 128 Q78 112 48 160 Q28 210 34 280 Q80 292 132 284 Q138 220 128 128 Z" />
      <path className="fig-fein" d="M44 196 Q90 190 130 206 M60 248 Q100 230 132 236" />
      <path className="fig-gewebe-2" d="M172 128 Q222 112 252 160 Q272 210 266 280 Q230 290 196 286 Q186 262 200 246 Q172 236 170 210 Z" />
      <path className="fig-fein" d="M174 214 Q214 214 262 240" />
      {/* Nasenhöhle, Rachen, Kehlkopf, Luftröhre */}
      <path className="fig-gewebe" d="M112 12 Q150 0 188 12 L188 40 Q150 48 112 40 Z" />
      <rect className="fig-gewebe" x="140" y="40" width="20" height="38" />
      <path className="fig-gewebe" d="M132 78 H168 L164 106 H136 Z" />
      <rect className="fig-gewebe" x="141" y="106" width="18" height="66" />
      <path className="fig-fein" d="M141 118 H159 M141 130 H159 M141 142 H159 M141 154 H159" />
      {/* Hauptbronchien: rechts steiler und kürzer */}
      <path className="fig-linie" d="M150 172 L122 200" />
      <path className="fig-linie" d="M150 172 L186 190" />
      {/* Bronchialbaum */}
      <path className="fig-fein" d="M122 200 L96 222 L74 236 M96 222 L92 250 M122 200 L112 240 M74 236 L60 232 M74 236 L70 254" />
      <path className="fig-fein" d="M186 190 L212 214 L232 226 M212 214 L216 240 M186 190 L196 226" />
      {/* Lungenbläschen als Traube am Ende einer Bronchiole */}
      <path className="fig-fein" d="M216 240 L222 252" />
      <g className="fig-sauerstoffreich">
        <circle cx="222" cy="258" r="5" /><circle cx="231" cy="254" r="5" /><circle cx="230" cy="264" r="5" /><circle cx="220" cy="268" r="5" />
      </g>
      {/* Zwerchfell */}
      <path className="fig-muskel" d="M26 300 Q90 262 150 296 Q210 262 274 300 L274 308 Q210 272 150 304 Q90 272 26 308 Z" />
    </g>
  ),
};

const niere: Figur = {
  viewBox: '0 0 300 300',
  beschreibung: 'Schema der Nieren und ableitenden Harnwege von vorn mit Nebennieren, Nieren, Nierenbecken, Harnleitern, Harnblase und Harnröhre, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Nebennieren */}
      <path className="fig-gewebe-2" d="M58 44 Q80 20 104 40 Z" />
      <path className="fig-gewebe-2" d="M196 40 Q220 20 242 44 Z" />
      {/* Nieren mit Rinde (außen) und Mark (Pyramiden) */}
      <path className="fig-sauerstoffreich" d="M80 40 Q40 44 40 96 Q40 150 82 150 Q104 150 106 128 Q96 112 110 96 Q100 80 106 62 Q102 40 80 40 Z" />
      <path className="fig-gewebe" d="M56 60 L70 50 L90 88 Z M56 84 L56 108 L88 96 Z M56 132 L70 142 L90 104 Z" />
      <path className="fig-sauerstoffreich" d="M220 40 Q260 44 260 96 Q260 150 218 150 Q196 150 194 128 Q204 112 190 96 Q200 80 194 62 Q198 40 220 40 Z" />
      <path className="fig-gewebe" d="M244 60 L230 50 L210 88 Z M244 84 L244 108 L212 96 Z M244 132 L230 142 L210 104 Z" />
      {/* Nierenbecken */}
      <path className="fig-gewebe-2" d="M92 86 Q112 96 112 110 Q104 118 92 116 Z" />
      <path className="fig-gewebe-2" d="M208 86 Q188 96 188 110 Q196 118 208 116 Z" />
      {/* Harnleiter */}
      <path className="fig-linie" d="M108 112 Q120 170 132 218" />
      <path className="fig-linie" d="M192 112 Q180 170 168 218" />
      {/* Harnblase */}
      <path className="fig-gewebe-2" d="M114 214 Q150 196 186 214 Q196 256 150 264 Q104 256 114 214 Z" />
      {/* Harnröhre */}
      <rect className="fig-gewebe" x="145" y="263" width="10" height="34" rx="3" />
    </g>
  ),
};

// Skelett: nur die rechte Körperhälfte (in der Zeichnung links) ist voll bezeichnet, die linke gespiegelt.
function skelettSeite(spiegel: boolean) {
  const t = spiegel ? 'translate(220 0) scale(-1 1)' : undefined;
  return (
    <g transform={t}>
      {/* Schlüsselbein */}
      <path className="fig-linie" d="M106 84 Q86 76 62 80" />
      {/* Rippen */}
      <path className="fig-fein" d="M104 96 Q72 92 70 112 M104 108 Q66 104 66 128 M104 120 Q64 118 66 144 M104 132 Q66 132 70 158 M104 144 Q72 146 76 170" />
      {/* Oberarmknochen */}
      <path className="fig-knochen" d="M56 84 Q64 82 62 92 L54 168 Q50 174 44 170 L50 92 Q48 84 56 84 Z" />
      {/* Speiche (außen, Daumenseite) und Elle (innen) */}
      <path className="fig-knochen" d="M43 174 L48 176 L34 246 L29 244 Z" />
      <path className="fig-knochen" d="M51 174 L56 176 L50 246 L45 245 Z" />
      {/* Hand */}
      <path className="fig-knochen" d="M27 248 L52 248 L52 266 L46 284 L40 284 L36 276 L28 280 Z" />
      {/* Becken */}
      <path className="fig-knochen" d="M108 240 L108 262 Q96 290 84 284 Q72 278 72 264 Q66 246 74 236 Q92 244 108 240 Z" />
      {/* Oberschenkelknochen */}
      <path className="fig-knochen" d="M80 270 Q88 266 90 276 L98 340 L88 344 L80 280 Q74 278 80 270 Z" />
      {/* Kniescheibe */}
      <circle className="fig-knochen" cx="93" cy="352" r="7" />
      {/* Schienbein (innen, kräftig) und Wadenbein (außen, schlank) */}
      <path className="fig-knochen" d="M91 362 L102 362 L100 438 L93 438 Z" />
      <path className="fig-knochen" d="M81 364 L86 364 L87 436 L83 436 Z" />
      {/* Fuß */}
      <path className="fig-knochen" d="M82 440 L102 440 L104 456 L74 458 Q74 448 82 440 Z" />
    </g>
  );
}

const skelett: Figur = {
  viewBox: '0 0 220 470',
  beschreibung: 'Schema des Skeletts von vorn mit Schädel, Schultergürtel, Brustkorb, Wirbelsäule, Armen, Becken und Beinen, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Schädel und Unterkiefer */}
      <ellipse className="fig-knochen" cx="110" cy="34" rx="26" ry="28" />
      <path className="fig-knochen" d="M90 50 Q92 74 110 76 Q128 74 130 50 Q120 60 110 60 Q100 60 90 50 Z" />
      {/* Wirbelsäule */}
      <g className="fig-knochen">
        {[78, 86, 160, 170, 180, 192, 204, 216, 228].map((y) => <rect key={y} x="105" y={y} width="10" height="7" rx="2" />)}
      </g>
      {/* Brustbein */}
      <path className="fig-knochen" d="M104 88 H116 V140 L110 152 L104 140 Z" />
      {skelettSeite(false)}
      {skelettSeite(true)}
      {/* Kreuzbein */}
      <path className="fig-knochen" d="M104 240 H116 L113 266 H107 Z" />
    </g>
  ),
};

const gehirn: Figur = {
  viewBox: '0 0 300 260',
  beschreibung: 'Schema des Gehirns von der linken Seite, Stirn links, mit Großhirnlappen, Kleinhirn, Hirnstamm und Rückenmark, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Kleinhirn und Hirnstamm hinter dem Großhirn */}
      <ellipse className="fig-gewebe-2" cx="228" cy="182" rx="42" ry="26" />
      <path className="fig-fein" d="M196 178 Q228 168 264 180 M194 190 Q228 182 266 192 M200 200 Q230 196 258 202" />
      <path className="fig-gewebe" d="M162 160 L186 160 L182 210 L178 252 L168 252 L166 210 Z" />
      <ellipse className="fig-gewebe" cx="170" cy="184" rx="16" ry="15" />
      {/* Großhirn */}
      <path className="fig-sauerstoffreich" d="M40 130 Q28 62 108 34 Q188 12 250 58 Q288 96 272 138 Q258 166 222 160 Q192 172 162 166 Q142 182 112 174 Q72 180 52 160 Q42 148 40 130 Z" />
      {/* Furchen: Zentralfurche, seitliche Furche, Scheitel-Hinterhaupt-Furche */}
      <path className="fig-linie" d="M168 22 Q156 70 146 116" />
      <path className="fig-linie" d="M84 138 Q136 126 196 116" />
      <path className="fig-linie" d="M244 52 Q232 86 236 122" />
      <path className="fig-fein" d="M70 90 Q90 80 110 92 M64 112 Q88 106 108 116 M190 60 Q206 70 222 64 M180 90 Q198 98 220 92 M110 150 Q140 146 170 144" />
    </g>
  ),
};

const auge: Figur = {
  viewBox: '0 0 300 220',
  beschreibung: 'Schema des Auges im waagerechten Schnitt, Licht fällt von links ein, mit Hornhaut, Regenbogenhaut, Linse, Glaskörper, Netzhaut und Sehnerv, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Sehnerv */}
      <rect className="fig-gewebe-2" x="244" y="100" width="56" height="22" rx="4" />
      {/* Lederhaut (außen) und Glaskörper */}
      <circle className="fig-gewebe" cx="170" cy="110" r="80" style={{ strokeWidth: 5 }} />
      {/* Netzhaut an der Rückwand */}
      <path className="fig-linie" d="M150 36 A74 74 0 0 1 150 184" style={{ stroke: 'var(--color-danger)' }} />
      {/* Gelber Fleck */}
      <circle cx="243" cy="90" r="4" style={{ fill: 'var(--color-warning)' }} />
      {/* Hornhaut */}
      <path className="fig-sauerstoffarm" d="M102 64 Q66 110 102 156 Q90 110 102 64 Z" />
      {/* Regenbogenhaut mit Pupille dazwischen */}
      <path className="fig-linie" d="M104 70 L104 96 M104 124 L104 150" style={{ stroke: 'var(--color-info)', strokeWidth: 5 }} />
      {/* Ziliarkörper */}
      <path className="fig-muskel" d="M106 66 L118 62 L118 76 Z M106 154 L118 158 L118 144 Z" />
      {/* Linse */}
      <ellipse className="fig-gewebe-2" cx="116" cy="110" rx="10" ry="30" />
    </g>
  ),
};

const haut: Figur = {
  viewBox: '0 0 300 220',
  beschreibung: 'Schema der Haut im Querschnitt mit drei Schichten, Haar, Talgdrüse, Schweißdrüse und Blutgefäß, ohne Beschriftung',
  zeichnung: (
    <g>
      {/* Unterhaut mit Fettläppchen */}
      <rect className="fig-gewebe-2" x="10" y="122" width="280" height="88" />
      <g className="fig-gewebe">
        {[30, 70, 160, 250].map((x) => <ellipse key={x} cx={x} cy="168" rx="16" ry="12" />)}
      </g>
      {/* Lederhaut */}
      <rect className="fig-sauerstoffreich" x="10" y="52" width="280" height="70" style={{ fillOpacity: 0.5 }} />
      {/* Oberhaut mit welliger Grenze */}
      <path className="fig-gewebe" d="M10 30 H290 V50 Q275 60 260 50 Q245 60 230 50 Q215 60 200 50 Q185 60 170 50 Q155 60 140 50 Q125 60 110 50 Q95 60 80 50 Q65 60 50 50 Q35 60 20 50 L10 52 Z" />
      {/* Haar mit Haarwurzel in der Lederhaut */}
      <path className="fig-linie" d="M118 4 L122 30 L124 112" />
      <ellipse className="fig-gewebe" cx="124" cy="116" rx="7" ry="9" />
      {/* Talgdrüse am Haar */}
      <ellipse className="fig-gewebe-2" cx="140" cy="78" rx="9" ry="6" />
      {/* Schweißdrüse mit Ausführungsgang */}
      <path className="fig-fein" d="M222 30 Q218 80 222 128" style={{ strokeWidth: 2 }} />
      <circle className="fig-gewebe" cx="222" cy="136" r="9" />
      {/* Blutgefäß */}
      <path className="fig-linie" d="M10 100 Q80 90 150 104 Q220 116 290 98" style={{ stroke: 'var(--color-danger)' }} />
    </g>
  ),
};

export const FIGUREN: Record<string, Figur> = { herz, atmung, niere, skelett, gehirn, auge, haut };
