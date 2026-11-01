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

export const FIGUREN: Record<string, Figur> = { herz, atmung, niere };
