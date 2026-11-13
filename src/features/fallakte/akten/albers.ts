// Fallakte „Herr Albers bleibt zu Hause“: ambulante Pflege bei COPD mit Langzeitsauerstoff.
// Alle Personen, Einrichtungen und Werte sind frei erfunden.
// Aufbau wie lindner.ts: nur Typen importieren, die Trainer-Listen importieren diese Datei.
import type { SisFall } from '../../sis/faelle';
import type { Vignette } from '../../assessment/vignetten';
import type { PlanFall } from '../../pflegeplanung/faelle';
import type { BerichtFall } from '../../bericht/faelle';
import type { Fall as UebergabeFall } from '../../uebergabe/faelle';
import type { SbarEreignis } from '../../uebergabe/grundkriterien';
import type { Fallakte } from '../typen';

const NAME = 'Heinrich Albers';

export const ALBERS_SIS: SisFall = {
  id: 'albers',
  titel: 'Fallakte: Erstbesuch bei COPD mit Sauerstoff',
  setting: 'ambulant',
  anlass: 'Erstbesuch des ambulanten Pflegedienstes nach Krankenhausaufenthalt wegen COPD-Exazerbation',
  person: [
    { label: 'Name', wert: `${NAME}, 77 Jahre` },
    { label: 'Gespräch', wert: 'Erstbesuch in der Erdgeschosswohnung mit Herrn Albers und seiner Ehefrau Ursula Albers (74)' },
  ],
  gespraech: [
    { wer: 'Herr Albers', text: 'Waschen und Anziehen sind wie ein Marathon. Danach muss ich mich eine halbe Stunde hinsetzen.' },
    { wer: 'Herr Albers', text: 'Ins Heim will ich nicht. Hier ist mein Garten, und hier ist meine Frau.' },
    { wer: 'Herr Albers', text: 'Den Schlauch hasse ich. Zum Bäcker nehme ich ihn nicht mit, die Leute gucken so.' },
    { wer: 'Herr Albers', text: 'Neulich bin ich in der Küche über das Ding gestolpert. Ist zum Glück nichts passiert.' },
    { wer: 'Herr Albers', text: 'Essen mag ich kaum noch. Nach drei Bissen bin ich satt und kriege schlecht Luft.' },
    { wer: 'Herr Albers', text: 'Mit dem Spray komme ich nicht klar, ich weiß nie, ob überhaupt was ankommt.' },
    { wer: 'Herr Albers', text: 'Die Zeitung lese ich jeden Morgen, das lasse ich mir nicht nehmen.' },
    { wer: 'Ehefrau', text: 'Nachts hustet er so viel, ich schlafe kaum noch. Ich mache das ja gern, aber ich bin fix und fertig.' },
    { wer: 'Ehefrau', text: 'Er war Briefträger, immer draußen. Jetzt sitzt er den ganzen Tag am Fenster.' },
    { wer: 'Ehefrau', text: 'Einkaufen und Kochen mache ich, das ging schon immer so.' },
  ],
  beobachtungen: [
    'Atemfrequenz in Ruhe 22/min, nach dem Anziehen 28/min; SpO₂ 90 % mit 2 l/min Sauerstoff über die Nasenbrille.',
    'In der Wohnung geht er ohne Hilfsmittel und stützt sich an Schrank und Tisch ab. Der Sauerstoffschlauch ist etwa 15 m lang und liegt quer über Flur und Küchenboden.',
    'Gewicht 58 kg bei 1,76 m (BMI 18,7). Laut Hausarztbrief wog er vor drei Monaten 62 kg.',
    'Wach und zu allen Qualitäten orientiert, hört gut, liest mit Lesebrille.',
    'Beim Respimat atmet er vorher nicht aus und atmet nach dem Sprühstoß sofort wieder aus.',
    'Haut intakt, kontinent.',
  ],
  unterlagen: [
    { label: 'Diagnosen', wert: 'COPD GOLD 3 mit Langzeitsauerstofftherapie, Exazerbation mit Krankenhausaufenthalt bis vor 10 Tagen, Osteoporose' },
    { label: 'Medikamente', wert: 'Tiotropium/Olodaterol (Respimat) morgens, Salbutamol-Dosieraerosol bei Bedarf, Prednisolon 5 mg (wird ausgeschlichen), Alendronsäure wöchentlich' },
    { label: 'Ärztliche Vorgabe', wert: 'Sauerstoff 2 l/min mindestens 16 Stunden täglich, auch bei Belastung. Notfallplan: bei mehr Atemnot, gelbgrünem Auswurf oder Fieber den Hausarzt informieren.' },
    { label: 'Leistungen', wert: 'Duschen zweimal pro Woche, Medikamente wöchentlich richten, Inhalation anleiten' },
    { label: 'Hilfsmittel', wert: 'Sauerstoffkonzentrator, mobiles Sauerstoffgerät (kaum genutzt), Duschhocker, Lesebrille' },
  ],
  kernpunkte: [
    { id: 'b-heim', feld: 'B', pflicht: true, text: 'Will nicht ins Heim, sondern zu Hause bei Garten und Ehefrau bleiben', muster: ['heim', 'zu hause', 'garten'] },
    { id: 'b-marathon', feld: 'B', pflicht: true, text: 'Waschen und Anziehen sind „wie ein Marathon“', muster: ['marathon', 'waschen', 'anziehen'] },
    { id: 'b-schlauch', feld: 'B', pflicht: false, text: 'Mag den Sauerstoffschlauch nicht, schämt sich unterwegs', muster: ['schlauch', 'gucken'] },
    { id: 'tf1-orientiert', feld: 'TF1', pflicht: true, text: 'Orientiert, entscheidet selbst', muster: ['orientiert', 'klar', 'entscheid'] },
    { id: 'tf1-zeitung', feld: 'TF1', pflicht: false, text: 'Liest jeden Morgen die Zeitung mit Lesebrille', muster: ['zeitung', 'lesebrille', 'liest'] },
    { id: 'tf2-moebel', feld: 'TF2', pflicht: true, text: 'Geht in der Wohnung ohne Hilfsmittel, hält sich an Möbeln fest', muster: ['moebel', 'ohne hilfsmittel', 'haelt sich', 'stuetzt sich'] },
    { id: 'tf2-schlauch', feld: 'TF2', pflicht: true, text: 'Über den Sauerstoffschlauch gestolpert', muster: ['stolper', 'schlauch'], auchIn: ['TF3', 'TF6'], begruendung: 'Das Stolpern betrifft die Bewegung (TF2). Als Folge der Sauerstofftherapie (TF3) oder als Gefahr in der Wohnung (TF6) ist es ebenfalls vertretbar.' },
    { id: 'tf2-draussen', feld: 'TF2', pflicht: false, text: 'Geht kaum noch nach draußen', muster: ['draussen', 'nach aussen', 'wohnung kaum'] },
    { id: 'tf3-copd', feld: 'TF3', pflicht: true, text: 'COPD GOLD 3 nach Exazerbation', muster: ['copd', 'lungen'] },
    { id: 'tf3-sauerstoff', feld: 'TF3', pflicht: true, text: 'Sauerstoff 2 l/min mindestens 16 Stunden, lässt ihn unterwegs weg', muster: ['sauerstoff', '2 l', '16 stunden'] },
    { id: 'tf3-inhalation', feld: 'TF3', pflicht: true, text: 'Inhalationstechnik unsicher (atmet nicht vorher aus, hält nicht die Luft an)', muster: ['inhal', 'respimat', 'spray'] },
    { id: 'tf3-husten', feld: 'TF3', pflicht: false, text: 'Hustet nachts viel', muster: ['husten', 'hustet'], auchIn: ['TF5'], begruendung: 'Der Husten gehört zur Erkrankung (TF3). Weil er vor allem die Nachtruhe der Ehefrau belastet, ist er in TF5 ebenfalls vertretbar.' },
    { id: 'tf3-notfallplan', feld: 'TF3', pflicht: false, text: 'Notfallplan des Hausarztes bei Exazerbationszeichen', muster: ['notfallplan', 'auswurf', 'fieber'] },
    { id: 'tf4-waschen', feld: 'TF4', pflicht: true, text: 'Wäscht und kleidet sich selbst, braucht danach eine halbe Stunde Pause; Duschen mit Hilfe', muster: ['pause', 'duschen', 'durchatmen'] },
    { id: 'tf4-essen', feld: 'TF4', pflicht: true, text: 'Isst wenig, nach drei Bissen satt und kurzatmig, 4 kg abgenommen', muster: ['bissen', 'satt', 'abgenommen', '4 kg', 'appetit'] },
    { id: 'tf5-ehefrau', feld: 'TF5', pflicht: true, text: 'Ehefrau pflegt ihn und ist erschöpft', muster: ['ehefrau', 'frau'] },
    { id: 'tf5-brieftraeger', feld: 'TF5', pflicht: false, text: 'War Briefträger, sitzt jetzt meist am Fenster', muster: ['brieftraeger', 'fenster'] },
    { id: 'tf6-haushalt', feld: 'TF6', pflicht: true, text: 'Ehefrau kauft ein und kocht', muster: ['einkauf', 'koch', 'haushalt'] },
    { id: 'tf6-wohnung', feld: 'TF6', pflicht: true, text: 'Schlauch liegt quer über Flur und Küche', muster: ['flur', 'kueche', '15 m'] },
  ],
  matrix: [
    { risiko: 'dekubitus', vorhanden: 'nein', weitere: 'nein', themenfelder: [], begruendung: 'Bewegt sich selbst, Haut intakt. Den Gewichtsverlust im Blick behalten.' },
    { risiko: 'sturz', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF2', 'TF3'], begruendung: 'Schon über den Schlauch gestolpert, Atemnot bei Belastung, hält sich an Möbeln fest. Osteoporose und Kortison machen Brüche wahrscheinlicher.' },
    { risiko: 'inkontinenz', vorhanden: 'nein', weitere: 'nein', themenfelder: [], begruendung: 'Kontinent.' },
    { risiko: 'schmerz', vorhanden: 'nein', weitere: 'nein', themenfelder: [], begruendung: 'Keine Schmerzen angegeben oder beobachtet.' },
    { risiko: 'ernaehrung', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF4', 'TF3'], begruendung: 'BMI 18,7, 4 kg in drei Monaten verloren, Atemnot beim Essen. Ernährungsscreening (MNA) und Ernährungsplan.' },
    { risiko: 'sonstiges', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF3', 'TF5'], welches: ['exazerb', 'infekt', 'atem', 'luft', 'inhal', 'sauerstoff', 'ueberlast', 'angehoerig', 'ehefrau'], begruendung: 'Erneute Exazerbation (unsichere Inhalation, Sauerstoff unterwegs weggelassen) und Überlastung der pflegenden Ehefrau.' },
  ],
  muster: {
    B: '„Waschen und Anziehen sind wie ein Marathon.“ „Ins Heim will ich nicht. Hier ist mein Garten, und hier ist meine Frau.“ „Den Schlauch hasse ich, die Leute gucken so.“',
    TF1: 'Herr Albers ist wach und orientiert und entscheidet selbst. Er hört gut und liest jeden Morgen mit Lesebrille die Zeitung; das möchte er beibehalten.',
    TF2: 'In der Wohnung geht er ohne Hilfsmittel und stützt sich dabei an den Möbeln ab. Über den langen Sauerstoffschlauch ist er schon gestolpert. Nach draußen geht er kaum noch. Besprochen: Er überlegt, für kurze Wege das mobile Sauerstoffgerät zu nehmen.',
    TF3: 'COPD GOLD 3, seit der Exazerbation mit Krankenhausaufenthalt Langzeitsauerstoff mit 2 l/min für mindestens 16 Stunden am Tag. Unterwegs lässt er den Sauerstoff weg. Am Respimat atmet er vorher nicht aus und hält danach die Luft nicht an; er ist unsicher, ob das Spray wirkt. Nachts hustet er viel. Prednisolon wird ausgeschlichen, Osteoporose. Er ist einverstanden, die Inhalation mit uns zu üben. Der Notfallplan des Hausarztes liegt am Telefon.',
    TF4: 'Waschen und Anziehen schafft er selbst, braucht danach aber eine halbe Stunde Pause zum Durchatmen. Duschen zweimal pro Woche mit unserer Hilfe auf dem Hocker. Er isst wenig, nach drei Bissen ist er satt und bekommt schlecht Luft; in drei Monaten hat er 4 kg abgenommen. Er ist kontinent. Er wünscht sich kleinere Portionen über den Tag verteilt.',
    TF5: 'Seine Ehefrau pflegt ihn. Sie sagt, sie schlafe wegen seines Hustens kaum noch und sei erschöpft. Er war Briefträger und viel unterwegs, jetzt sitzt er meist am Fenster zum Garten. Gemeinsam besprochen: Beratung zur Entlastung pflegender Angehöriger.',
    TF6: 'Die Ehefrau führt den Haushalt, kauft ein und kocht. Der Sauerstoffschlauch liegt quer über Flur und Küche. Vereinbart: Schlauch an der Wand entlang führen und kürzen, wo es geht.',
  },
};

export const ALBERS_MNA: Vignette = {
  id: 'mna-albers', gruppe: 'mna', instrument: 'mna', titel: 'Herr Albers, 77 Jahre (Fallakte)', setting: 'Ambulante Pflege, Erstbesuch',
  text: [
    'Seit dem Krankenhausaufenthalt isst Herr Albers deutlich weniger als früher, oft nur die Hälfte. Nach wenigen Bissen ist er satt und kurzatmig.',
    'Laut Hausarztbrief wog er vor drei Monaten 62 kg, heute 58 kg. Er ist 1,76 m groß.',
    'In der Wohnung steht er allein auf und geht umher, nach draußen geht er nicht mehr.',
    'Bis vor zehn Tagen lag er wegen einer Exazerbation seiner COPD im Krankenhaus.',
    'Er ist orientiert, eine Demenz oder Depression ist nicht bekannt.',
  ],
  loesung: { A: 0, B: 0, C: 1, D: 0, E: 2, F1: 0 },
  begruendung: {
    A: 'Deutlich weniger, oft nur die Hälfte: starke Abnahme.',
    B: '4 kg in drei Monaten: mehr als 3 kg.',
    C: 'Steht auf, verlässt die Wohnung aber nicht.',
    D: 'Exazerbation mit Krankenhausaufenthalt in den letzten 3 Monaten: ja.',
    E: 'Keine Demenz oder Depression bekannt: keine.',
    F1: '58 kg ÷ (1,76 m)² ≈ 18,7: unter 19.',
  },
  koerper: { kg: 58, cm: 176 },
  fazit: '3 Punkte, Mangelernährung. Hausarzt einbeziehen, Ursachen klären (Atemnot beim Essen, Infekt, Kortison), kleine energiereiche Mahlzeiten über den Tag, vor dem Essen Pause mit Sauerstoff, Gewicht wöchentlich.',
};

export const ALBERS_TUG: Vignette = {
  id: 'tug-albers', gruppe: 'sturz', instrument: 'tug', titel: 'Herr Albers, 77 Jahre (Fallakte)', setting: 'Ambulante Pflege, dritter Besuch',
  text: [
    'Du machst mit Herrn Albers den Timed Up and Go. Er trägt die Nasenbrille, der Sauerstoffschlauch liegt hinter dem Stuhl.',
    'Er drückt sich an den Armlehnen hoch, geht die 3 m ohne Hilfsmittel, dreht etwas unsicher und setzt sich schwer atmend wieder hin.',
    'Die Stoppuhr zeigt 17 Sekunden.',
  ],
  loesung: { zeit: 2 },
  begruendung: { zeit: '17 Sekunden liegen zwischen 10 und 19 Sekunden.' },
  fazit: 'Geringe Einschränkung nach der Zeit. Bei älteren Menschen sprechen aber schon Zeiten über 12 bis 14 Sekunden für ein erhöhtes Sturzrisiko; dazu kommen Schlauch, unsichere Drehung, Osteoporose und Kortison. Schlauch sichern, Kraft und Ausdauer trainieren.',
};

export const ALBERS_PLAN: PlanFall = {
  id: 'albers-copd',
  titel: 'Fallakte: Herr Albers mit COPD zu Hause',
  setting: 'ambulant',
  bereich: 'Ambulante Pflege',
  person: `${NAME}, 77 Jahre`,
  text: 'Herr Albers lebt mit seiner Ehefrau in einer Erdgeschosswohnung. Vor knapp zwei Wochen kam er nach einer COPD-Exazerbation aus dem Krankenhaus, seitdem bekommt er Langzeitsauerstoff, den er unterwegs weglässt. Waschen und Anziehen schafft er selbst, braucht danach aber eine halbe Stunde Pause: „wie ein Marathon“. Er isst kaum, nach drei Bissen bekommt er schlecht Luft, und er hat abgenommen. Beim Inhalieren atmet er vorher nicht aus und hält danach die Luft nicht an. Über den langen Sauerstoffschlauch ist er schon gestolpert. Seine Frau sagt, sie schlafe wegen seines Hustens kaum noch. Er will auf keinen Fall ins Heim.',
  daten: [
    { label: 'Diagnosen', wert: 'COPD GOLD 3 mit Langzeitsauerstofftherapie, Exazerbation vor knapp zwei Wochen, Osteoporose' },
    { label: 'Medikamente', wert: 'Tiotropium/Olodaterol (Respimat) morgens, Salbutamol bei Bedarf, Prednisolon 5 mg ausschleichend, Alendronsäure wöchentlich' },
    { label: 'Ärztliche Vorgabe', wert: 'Sauerstoff 2 l/min mindestens 16 Stunden täglich, auch bei Belastung; Notfallplan: bei mehr Atemnot, gelbgrünem Auswurf oder Fieber Hausarzt informieren' },
    { label: 'Vitalzeichen', wert: 'Atemfrequenz 22/min in Ruhe, 28/min nach dem Anziehen; SpO₂ 90 % mit 2 l/min' },
    { label: 'Ernährung', wert: '58 kg bei 1,76 m (BMI 18,7), vor drei Monaten 62 kg, MNA-SF 3 Punkte' },
    { label: 'Mobilität', wert: 'Geht in der Wohnung ohne Hilfsmittel, TUG 17 Sekunden, über den Schlauch gestolpert' },
    { label: 'Sozial', wert: 'Ehefrau (74) pflegt, kauft ein, kocht; schläft wegen seines Hustens schlecht' },
  ],
  verlauf: 'Zwei Wochen später: Am neunten Tag hatte Herr Albers Fieber und gelbgrünen Auswurf; der Hausarzt kam noch am Vormittag, mit Antibiotikum und Kortison blieb er zu Hause. Jetzt atmet er vor dem Inhalieren aus und hält danach fünf Sekunden die Luft an. Beim Anziehen nutzt er die Lippenbremse, danach reichen zehn Minuten Pause. Mit sechs kleinen Mahlzeiten und Trinknahrung wiegt er 58,5 kg. Der Schlauch läuft an der Wand entlang, gestolpert ist er nicht mehr. Seine Frau hat einen Termin beim Pflegestützpunkt und überlegt einen Tag Tagespflege pro Woche.',
  topicIds: ['thema.kl.atmung', 'thema.ph.ernaehrung', 'thema.pro.sturz'],
  info: [
    { id: 'atemnot', text: 'Atemnot bei Belastung, AF 28/min nach dem Anziehen', muster: ['atemnot', 'luft', 'dyspnoe', '28'], pflicht: true },
    { id: 'gewicht', text: 'BMI 18,7, 4 kg in drei Monaten verloren, MNA-SF 3', muster: ['bmi', '4 kg', 'abgenommen', 'gewicht', 'mna'], pflicht: true },
    { id: 'inhalation', text: 'Inhalationstechnik fehlerhaft', muster: ['inhal', 'respimat', 'spray'], pflicht: true },
    { id: 'sauerstoff', text: 'Sauerstoff 2 l/min, unterwegs weggelassen', muster: ['sauerstoff', '2 l', 'o2'], pflicht: true },
    { id: 'sturz', text: 'Über den Schlauch gestolpert, TUG 17 s', muster: ['stolper', 'schlauch', 'tug'], pflicht: true },
    { id: 'ehefrau', text: 'Ehefrau erschöpft', muster: ['ehefrau', 'frau', 'erschoepf'], pflicht: true },
    { id: 'heim', text: 'Will nicht ins Heim', muster: ['heim', 'zu hause'], pflicht: false },
  ],
  probleme: [
    { id: 'atmung', art: 'aktuell', pflicht: true, text: 'Beeinträchtigte Atmung und verminderte Belastbarkeit bei COPD',
      muster: ['atem', 'atmung', 'luft', 'dyspnoe', 'belastbar', 'kurzatmig', 'gasaustausch'],
      massnahmen: { text: 'Lippenbremse und Kutschersitz anleiten, Pausen einplanen, Sauerstoff auch bei Belastung', muster: ['lippenbremse', 'kutschersitz', 'atemerleichter', 'atemuebung', 'pause', 'sauerstoff', 'o2', 'torwartstellung'] } },
    { id: 'inhalation', art: 'aktuell', pflicht: true, text: 'Unsichere Inhalationstechnik (Wissensdefizit)',
      muster: ['inhal', 'respimat', 'spray', 'technik', 'wissen'],
      massnahmen: { text: 'Inhalation zeigen und gemeinsam üben, Technik bei jedem Besuch kontrollieren', muster: ['anleit', 'ueben', 'zeigen', 'vormach', 'schul', 'kontroll', 'beraten'] } },
    { id: 'ernaehrung', art: 'aktuell', pflicht: true, text: 'Mangelernährung',
      muster: ['ernaehr', 'mangel', 'gewicht', 'untergewicht', 'appetit'],
      massnahmen: { text: 'Kleine energiereiche Mahlzeiten, Trinknahrung nach Absprache, Pause vor dem Essen, wöchentlich wiegen', muster: ['kleine portion', 'kleine mahlzeit', 'zwischenmahlzeit', 'energiereich', 'hochkalor', 'anreicher', 'trinknahrung', 'wieg', 'ernaehrungsprotokoll'] } },
    { id: 'sturz', art: 'risiko', pflicht: true, text: 'Sturzgefahr',
      muster: ['sturz'],
      massnahmen: { text: 'Schlauch an der Wand führen und kürzen, mobiles Sauerstoffgerät, festes Schuhwerk, Licht', muster: ['schlauch', 'stolper', 'wand', 'mobiles', 'tragbar', 'schuh', 'licht', 'teppich'] } },
    { id: 'exazerbation', art: 'risiko', pflicht: true, text: 'Gefahr einer erneuten Exazerbation',
      muster: ['exazerb', 'infekt', 'verschlechter', 'pneumonie'],
      massnahmen: { text: 'Auswurf, Temperatur und Atemnot beobachten, Notfallplan besprechen, Hausarzt früh informieren', muster: ['notfallplan', 'auswurf', 'sputum', 'temperatur', 'fieber', 'beobacht', 'hausarzt', 'impf'] } },
    { id: 'angehoerige', art: 'risiko', pflicht: false, text: 'Gefahr der Überlastung der pflegenden Ehefrau',
      muster: ['ueberlast', 'erschoepf', 'angehoer', 'ehefrau', 'rollenbelast'],
      massnahmen: { text: 'Beratung zur Entlastung (Pflegekurs, Verhinderungspflege, Tagespflege, Pflegestützpunkt)', muster: ['entlast', 'beratung', 'pflegekurs', 'verhinderungspflege', 'tagespflege', 'pflegestuetzpunkt', 'gespraech'] },
      auchArt: 'Sie sagt schon jetzt, sie sei erschöpft. Als aktuelles Problem („Erschöpfung der pflegenden Ehefrau“) ist es ebenso begründbar.' },
  ],
  ressourcen: [
    { id: 'orientiert', text: 'Orientiert, entscheidet selbst', muster: ['orientiert', 'entscheid', 'klar'], pflicht: true },
    { id: 'ehefrau', text: 'Ehefrau unterstützt, kauft ein und kocht', muster: ['ehefrau', 'frau', 'angehoer'], pflicht: true },
    { id: 'selbst', text: 'Wäscht und kleidet sich selbst', muster: ['selbst', 'selbststaendig'], pflicht: false },
    { id: 'zuhause', text: 'Will zu Hause bleiben, liest gern Zeitung', muster: ['zu hause', 'garten', 'zeitung', 'motiv', 'will'], pflicht: false },
  ],
  beispiel: `P: Beeinträchtigte Atmung und verminderte Belastbarkeit
E: beeinflusst durch COPD GOLD 3, Sauerstoff wird bei Belastung weggelassen
S: angezeigt durch AF 28/min nach dem Anziehen, 30 Minuten Pause nötig
R: orientiert, wäscht und kleidet sich selbst, will zu Hause bleiben

Ziel: Herr Albers wendet beim Anziehen die Lippenbremse an und braucht danach höchstens 15 Minuten Pause. Überprüfung: bei jedem Duschbesuch, Ziel in 14 Tagen.
Maßnahme: Lippenbremse und Kutschersitz zeigen und gemeinsam üben (Pflegefachperson, bei jedem Besuch); Sauerstoff auch beim Waschen tragen.

P: Unsichere Inhalationstechnik
E: beeinflusst durch fehlende Schulung nach dem Krankenhaus
S: angezeigt durch fehlendes Ausatmen vor und Luftanhalten nach dem Sprühstoß
R: motiviert, möchte wissen, ob das Spray wirkt

Ziel: Herr Albers inhaliert in 7 Tagen ohne Fehler (vorher ausatmen, danach 5 bis 10 Sekunden Luft anhalten).
Maßnahme: Inhalation zeigen und von ihm vormachen lassen, Technik bei jedem Besuch kontrollieren.

P: Gefahr einer erneuten Exazerbation
E: beeinflusst durch unsichere Inhalation, Kortison, Untergewicht
R: Ehefrau beobachtet aufmerksam, Notfallplan liegt vor

Ziel: Zeichen einer Exazerbation werden am selben Tag erkannt und dem Hausarzt gemeldet.
Maßnahme: Bei jedem Besuch Atemfrequenz, SpO₂, Temperatur und Auswurf erfassen; Notfallplan mit beiden besprechen.`,
};

export const ALBERS_BERICHT: BerichtFall = {
  id: 'albers-hausbesuch',
  titel: 'Fallakte: Hausbesuch mit Fieber und Atemnot',
  art: 'umschreiben',
  bereich: 'ambulant',
  person: `${NAME}, 77 Jahre, COPD mit Langzeitsauerstoff, neunter Tag nach dem Erstbesuch`,
  vorlage: 'Pat. heute total schlecht drauf, wollte sich mal wieder nicht duschen lassen. Atmung schlecht wie immer, Frau jammert. Wahrscheinlich Erkältung.',
  szene: [
    'Um 8:10 Uhr kommst du zum Duschen. Herr Albers sitzt nach vorn gebeugt im Sessel und stützt die Arme auf die Knie. Er sagt: „Heute nicht. Ich krieg kaum Luft.“',
    'Du misst: Atemfrequenz 30/min, SpO₂ 86 % mit 2 l/min Sauerstoff, Temperatur 38,3 °C, Puls 112/min. Er hustet gelbgrünen Auswurf ab.',
    'Seine Frau sagt: „Seit gestern Abend ist es schlimmer, er hat die ganze Nacht gehustet.“',
    'Du lässt das Duschen weg, leitest ihn zur Lippenbremse an, er bleibt im Kutschersitz. Nach Bedarfsanordnung gibst du 2 Hübe Salbutamol.',
    'Um 8:25 Uhr: Atemfrequenz 26/min, SpO₂ 88 %. Er sagt: „Etwas besser.“',
    'Um 8:30 Uhr rufst du den Hausarzt an und informierst die Pflegedienstleitung.',
  ],
  kernpunkte: [
    { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (8:10 Uhr)', muster: ['8:10', '08:10', '8,10'] },
    { id: 'spo2', baustein: 'beobachtung', pflicht: true, text: 'Atemfrequenz 30/min, SpO₂ 86 % unter Sauerstoff', muster: ['86'] },
    { id: 'fieber', baustein: 'beobachtung', pflicht: true, text: 'Temperatur 38,3 °C', muster: ['38,3'] },
    { id: 'auswurf', baustein: 'beobachtung', pflicht: true, text: 'Gelbgrüner Auswurf (statt „Erkältung“ vermuten)', muster: ['auswurf', 'sputum', 'gelbgruen'] },
    { id: 'haltung', baustein: 'beobachtung', pflicht: false, text: 'Sitzt nach vorn gebeugt, stützt die Arme auf', muster: ['vorn', 'gebeugt', 'stuetzt'] },
    { id: 'aussage', baustein: 'aussage', pflicht: true, text: 'Aussage von Herrn Albers wörtlich (statt „schlecht drauf“)', muster: ['luft'] },
    { id: 'ehefrau', baustein: 'aussage', pflicht: false, text: 'Aussage der Ehefrau wörtlich (statt „Frau jammert“)', muster: ['gestern abend', 'gehustet'] },
    { id: 'massnahme', baustein: 'massnahme', pflicht: true, text: 'Lippenbremse angeleitet, Kutschersitz, 2 Hübe Salbutamol', muster: ['lippenbremse', 'salbutamol', 'kutschersitz'] },
    { id: 'dusche', baustein: 'massnahme', pflicht: false, text: 'Duschen ausgelassen (statt „wollte nicht“)', muster: ['duschen', 'dusche'] },
    { id: 'wirkung', baustein: 'wirkung', pflicht: true, text: '8:25 Uhr AF 26/min, SpO₂ 88 %', muster: ['88', '8:25'] },
    { id: 'weitergabe', baustein: 'weitergabe', pflicht: true, text: 'Hausarzt und Pflegedienstleitung informiert', muster: ['hausarzt', 'pdl', 'pflegedienstleitung'] },
  ],
  muster: '8:10 Uhr, Einsatz Duschen: Herr Albers sitzt nach vorn gebeugt im Sessel, Arme auf den Knien. Er sagt: „Heute nicht. Ich krieg kaum Luft.“ AF 30/min, SpO₂ 86 % mit 2 l/min O₂, Temperatur 38,3 °C, Puls 112/min, hustet gelbgrünen Auswurf ab. Ehefrau: „Seit gestern Abend ist es schlimmer, er hat die ganze Nacht gehustet.“ Duschen ausgelassen, zur Lippenbremse angeleitet, Kutschersitz, 2 Hübe Salbutamol nach Bedarfsanordnung gegeben. 8:25 Uhr AF 26/min, SpO₂ 88 %, er sagt: „Etwas besser.“ 8:30 Uhr Hausarzt telefonisch informiert, Pflegedienstleitung informiert.',
};

export const ALBERS_UEBERGABE: UebergabeFall = {
  id: 'albers-hausarzt',
  titel: 'Fallakte: Verdacht auf erneute Exazerbation',
  bereich: 'Ambulante Pflege',
  anlass: 'telefon',
  empfaenger: 'Hausarzt Dr. Kessler, telefonisch in der Praxis',
  rolle: 'Auszubildender im ambulanten Pflegedienst, Frühtour',
  lage: 'Es ist 8:30 Uhr. Du hast den Pflegebericht geschrieben und rufst aus der Wohnung von Herrn Albers den Hausarzt an.',
  daten: [
    { label: 'Patient', wert: `${NAME}, 77 Jahre, lebt zu Hause mit seiner Ehefrau` },
    { label: 'Diagnosen', wert: 'COPD GOLD 3 mit Langzeitsauerstoff 2 l/min, vor knapp drei Wochen Krankenhaus wegen Exazerbation, Osteoporose' },
    { label: 'Medikation', wert: 'Tiotropium/Olodaterol, Salbutamol bei Bedarf, Prednisolon 5 mg' },
    { label: '8:10 Uhr', wert: 'AF 30/min, SpO₂ 86 % mit 2 l/min, Temperatur 38,3 °C, Puls 112/min, gelbgrüner Auswurf, seit gestern Abend schlechter' },
    { label: 'Maßnahmen', wert: 'Lippenbremse, Kutschersitz, 2 Hübe Salbutamol nach Bedarfsanordnung' },
    { label: '8:25 Uhr', wert: 'AF 26/min, SpO₂ 88 %, wach und orientiert' },
    { label: 'Notfallplan', wert: 'Bei mehr Atemnot, gelbgrünem Auswurf oder Fieber Hausarzt informieren' },
  ],
  kernpunkte: [
    { id: 'patient', teil: 'S', pflicht: true, text: 'Patient benennen (Herr Albers)', muster: ['albers'] },
    { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: zunehmende Atemnot', muster: ['atemnot', 'luftnot', 'kaum luft', 'keine luft'] },
    { id: 'copd', teil: 'B', pflicht: true, text: 'COPD mit Langzeitsauerstoff', muster: ['copd'] },
    { id: 'krankenhaus', teil: 'B', pflicht: false, text: 'Vor knapp drei Wochen Krankenhaus wegen Exazerbation', muster: ['krankenhaus', 'drei wochen'] },
    { id: 'kortison', teil: 'B', pflicht: false, text: 'Prednisolon 5 mg', muster: ['prednisolon', 'kortison', 'cortison'] },
    { id: 'spo2', teil: 'A', pflicht: true, text: 'SpO₂ 86 % mit 2 l Sauerstoff, AF 30/min', muster: ['86'] },
    { id: 'fieber', teil: 'A', pflicht: true, text: 'Fieber 38,3 °C', muster: ['38,3'] },
    { id: 'auswurf', teil: 'A', pflicht: true, text: 'Gelbgrüner Auswurf', muster: ['auswurf', 'sputum'] },
    { id: 'verlauf', teil: 'A', pflicht: false, text: 'Nach Salbutamol SpO₂ 88 %', muster: ['88'] },
    { id: 'einschaetzung', teil: 'A', pflicht: false, text: 'Eigene Einschätzung: erneute Exazerbation mit Infekt', muster: ['vermute', 'verdacht', 'infekt', 'pneumonie'] },
    { id: 'kommen', teil: 'R', pflicht: true, text: 'Sofortigen Hausbesuch oder Einweisung klären', muster: ['hausbesuch', ' kommen', 'einweis', 'notarzt'] },
  ],
  muster: `S: Guten Morgen, hier spricht Tim Hartmann, Auszubildender beim Pflegedienst am Lindenweg. Ich rufe an wegen Herrn Heinrich Albers, 77 Jahre. Seine Atemnot hat seit gestern Abend deutlich zugenommen.
B: Er hat eine COPD GOLD 3 mit Langzeitsauerstoff 2 l und lag vor knapp drei Wochen wegen einer Exazerbation im Krankenhaus. Er bekommt noch 5 mg Prednisolon.
A: Um 8:10 Uhr hatte er eine Atemfrequenz von 30, eine Sättigung von 86 % mit 2 l Sauerstoff, Temperatur 38,3 °C und Puls 112. Er hustet gelbgrünen Auswurf ab. Nach Lippenbremse und 2 Hüben Salbutamol jetzt Atemfrequenz 26 und Sättigung 88 %. Ich vermute eine erneute Exazerbation mit Infekt.
R: Können Sie bitte jetzt gleich zum Hausbesuch kommen, oder soll er eingewiesen werden? Bis dahin bleibe ich bei ihm und messe alle 15 Minuten. Fällt die Sättigung unter 85 % oder wird er schläfrig, rufe ich den Notarzt und melde mich wieder bei Ihnen.`,
};

export const ALBERS_EREIGNISSE: SbarEreignis[] = [
  { minute: 0, stufe: 'info', text: 'Notfallplan: bei mehr Atemnot, gelbgrünem Auswurf oder Fieber Hausarzt informieren' },
  { minute: 20, stufe: 'kritisch', text: 'SpO₂ 86 % trotz 2 l/min Sauerstoff, AF 30, Fieber 38,3 °C, gelbgrüner Auswurf (Verdacht auf Exazerbation)', muster: ['atemnot', 'luftnot', 'kaum luft', 'keine luft', 'zugenommen'],
    empfehlung: 'Hausarzt jetzt zum Hausbesuch bitten oder die Einweisung klären', rueckfrage: 'Was soll ich bis zu Ihrem Eintreffen tun, und ab welcher Sättigung rufe ich den Notarzt?' },
];

export const ALBERS: Fallakte = {
  id: 'albers',
  titel: 'Herr Albers bleibt zu Hause',
  person: `${NAME}, 77 Jahre`,
  setting: 'Ambulante Pflege',
  kurz: 'COPD mit Langzeitsauerstoff, Gewichtsverlust und eine erschöpfte Ehefrau: zwei Wochen ambulante Pflege bis zum Anruf beim Hausarzt.',
  einstieg: [
    'Herr Albers ist 77 Jahre alt und lebt mit seiner Frau in einer Erdgeschosswohnung. Nach einer COPD-Exazerbation kommt er aus dem Krankenhaus nach Hause, jetzt mit Langzeitsauerstoff. Der Pflegedienst soll beim Duschen helfen, Medikamente richten und die Inhalation anleiten.',
    'Du machst den Erstbesuch, schätzt Ernährung und Sturzgefahr ein, planst die Pflege, schreibst einen schlechten Berichtseintrag sachlich neu und rufst den Hausarzt an, als es ihm schlechter geht.',
  ],
  schritte: [
    { id: 'sis', art: 'sis', fallId: 'albers', wann: 'Tag 1, Erstbesuch', titel: 'Erstbesuch und SIS (ambulant)', auftrag: 'Fülle die SIS in der ambulanten Fassung mit Risikomatrix. Achte auch darauf, wie es der Ehefrau geht.' },
    { id: 'mna', art: 'assessment', fallId: 'mna-albers', wann: 'Tag 1', titel: 'MNA-SF', auftrag: 'Die Matrix zeigt ein Ernährungsrisiko. Schätze es mit dem MNA-SF ein, den BMI rechnest du selbst.' },
    { id: 'tug', art: 'assessment', fallId: 'tug-albers', wann: 'Tag 3', titel: 'Timed Up and Go', auftrag: 'Wie sicher geht er? Ordne die Zeit ein und überlege, was die Zahl nicht zeigt.' },
    { id: 'planung', art: 'pflegeplanung', fallId: 'albers-copd', wann: 'Tag 4', titel: 'Pflegeplanung', auftrag: 'Plane die Pflege zu Hause. Die Evaluation zeigt den Verlauf zwei Wochen später.' },
    { id: 'bericht', art: 'bericht', fallId: 'albers-hausbesuch', wann: 'Tag 9, Frühtour', titel: 'Pflegebericht neu schreiben', auftrag: 'Ein Kollege hat einen wertenden Eintrag geschrieben. Schreib ihn aus der beobachteten Situation sachlich neu.' },
    { id: 'uebergabe', art: 'uebergabe', fallId: 'albers-hausarzt', wann: 'Tag 9, 8:30 Uhr', titel: 'Anruf beim Hausarzt (SBAR)', auftrag: 'Fieber, gelbgrüner Auswurf und eine Sättigung von 86 %. Ruf den Hausarzt an und übergib nach SBAR.' },
  ],
  rueckblick: [
    { frage: 'In der SIS stand unter „Sonstiges“ die Gefahr einer Exazerbation. Woran hast du sie am neunten Tag erkannt?', antwort: 'Fieber 38,3 °C, gelbgrüner Auswurf und mehr Atemnot mit SpO₂ 86 % trotz Sauerstoff. Genau diese Zeichen nennt der Notfallplan des Hausarztes.' },
    { frage: 'Warum ist die falsche Inhalationstechnik ein eigenes Pflegeproblem und nicht nur ein Detail?', antwort: 'Ohne Ausatmen vorher und Luftanhalten danach kommt wenig Wirkstoff in die Lunge. Schlechte Technik ist ein häufiger Grund für Exazerbationen, und Anleitung ist eine pflegerische Aufgabe.' },
    { frage: 'Der TUG ergab „geringe Einschränkung“. Warum stand trotzdem Sturzgefahr in Matrix und Planung?', antwort: 'Die Zeit liegt über 12 bis 14 Sekunden, und die Zahl zeigt weder den Schlauch als Stolperfalle noch Osteoporose und Kortison, die einen Sturz gefährlich machen.' },
    { frage: 'Was hat der umgeschriebene Bericht dem Hausarzt-Anruf geliefert?', antwort: 'Messwerte mit Uhrzeit, den Auswurf statt der Vermutung „Erkältung“ und die Wirkung von Salbutamol. Aus „schlecht drauf“ und „jammert“ hätte niemand eine Entscheidung ableiten können.' },
  ],
};
