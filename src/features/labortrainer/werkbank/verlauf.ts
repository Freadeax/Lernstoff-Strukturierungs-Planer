// Kumulativbefund lesen: Verläufe über mehrere Tage, in denen ein Wert die eigentliche Botschaft trägt.
// Einzelwerte können im Referenzbereich liegen und trotzdem bedrohlich sein (Trend), und umgekehrt.

export interface VerlaufSzenario {
  id: string;
  titel: string;
  kontext: string;
  geschlecht: 'w' | 'm';
  /** Messzeitpunkte in Minuten relativ zu „jetzt“ (negativ = früher) und Werte je Parameter. */
  zeiten: number[];
  werte: Record<string, number[]>;
  /** Der Wert, der am meisten Sorge machen sollte. */
  gesucht: string;
  warum: string;
  /** Was die Pflegefachperson jetzt tut: richtige Option zuerst. */
  handeln: { frage: string; optionen: { text: string; warum: string }[] };
}

const TAG = 24 * 60;

export const VERLAEUFE: VerlaufSzenario[] = [
  {
    id: 'gi-blutung', titel: 'Tag 3 nach Hüft-OP', geschlecht: 'w',
    kontext: 'Frau B., 81 Jahre, ASS und Heparin s. c. Seit gestern müde, heute einmal schwarzer Stuhl.',
    zeiten: [-3 * TAG, -2 * TAG, -TAG, 0],
    werte: { hb: [12.9, 11.8, 10.1, 8.2], leuko: [8.1, 9.4, 8.8, 9.0], crp: [12, 48, 61, 44], k: [4.1, 4.3, 4.0, 4.2], harnstoff: [32, 35, 48, 71] },
    gesucht: 'hb',
    warum: 'Das Hb fällt Tag für Tag um fast 2 g/dl. Zusammen mit schwarzem Stuhl (Teerstuhl) und steigendem Harnstoff (Blut wird im Darm verdaut) spricht das für eine obere GI-Blutung. Das CRP nach OP ist dagegen erwartbar und fällt schon wieder.',
    handeln: { frage: 'Was tust du jetzt?', optionen: [
      { text: 'Vitalzeichen messen, sofort ärztlich melden (SBAR), Stuhl aufheben, nüchtern lassen bis zur Klärung', warum: 'Eine aktive Blutung kann schnell instabil werden. Ärztlich wird über Kreuzblut, Transfusion und Endoskopie entschieden.' },
      { text: 'Bis zur Visite morgen abwarten, das Hb ist nach OPs immer niedrig', warum: 'Ein Abfall nach OP ist bis zu einem Punkt erwartbar, aber nicht stetig über Tage und mit Teerstuhl.' },
      { text: 'Eisentabletten aus dem Stationsvorrat geben', warum: 'Medikamente nur nach Anordnung; und Eisen färbt den Stuhl ebenfalls dunkel, was die Beobachtung erschwert.' },
    ] },
  },
  {
    id: 'kalium', titel: 'Herzinsuffizienz, neue Medikation', geschlecht: 'm',
    kontext: 'Herr T., 77 Jahre, seit vier Tagen zusätzlich Spironolacton zu Ramipril. Kreatinin war schon vorher leicht erhöht.',
    zeiten: [-4 * TAG, -2 * TAG, -TAG, 0],
    werte: { k: [4.4, 5.0, 5.5, 6.1], na: [138, 137, 136, 136], krea: [1.4, 1.5, 1.7, 1.9], hb: [13.1, 13.0, 13.2, 12.9], ntprobnp: [3800, 3100, 2700, 2500] },
    gesucht: 'k',
    warum: 'Das Kalium steigt stetig und liegt jetzt über 6 mmol/l. Spironolacton und Ramipril halten beide Kalium zurück, die schlechter werdende Niere verstärkt das. Hyperkaliämie kann Herzrhythmusstörungen auslösen. Das NT-proBNP fällt dagegen: die Herzinsuffizienz bessert sich.',
    handeln: { frage: 'Was tust du jetzt?', optionen: [
      { text: 'Sofort ärztlich melden, Monitor/EKG nach Anordnung, kaliumreiche Kost und Kaliumzusätze stoppen lassen', warum: 'Über 6 mmol/l ist ein kritischer Bereich. Ärztlich wird über Medikamente, Kontrolle und Therapie entschieden.' },
      { text: 'Bananen und Trockenobst anbieten, damit er kräftiger wird', warum: 'Das sind sehr kaliumreiche Lebensmittel, sie verschlimmern die Lage.' },
      { text: 'Nichts tun, weil das NT-proBNP fällt', warum: 'Der Erfolg bei der Herzinsuffizienz ändert nichts an der Gefahr durch das Kalium.' },
    ] },
  },
  {
    id: 'aki', titel: 'Nach Kontrastmittel-CT', geschlecht: 'w',
    kontext: 'Frau S., 72 Jahre, Diabetes mit Metformin. Vor drei Tagen CT mit Kontrastmittel, seitdem trinkt sie wenig.',
    zeiten: [-3 * TAG, -2 * TAG, -TAG, 0],
    werte: { krea: [0.9, 1.3, 1.9, 2.6], egfr: [62, 40, 25, 17], k: [4.2, 4.6, 5.0, 5.3], glukose: [148, 160, 152, 171], laktat: [1.2, 1.6, 2.2, 3.1] },
    gesucht: 'krea',
    warum: 'Das Kreatinin hat sich in drei Tagen fast verdreifacht, die eGFR ist von 62 auf 17 gefallen: akutes Nierenversagen. Mit Metformin droht eine Laktatazidose, das Laktat steigt bereits. Der Blutzucker ist dagegen nur mäßig erhöht.',
    handeln: { frage: 'Was tust du jetzt?', optionen: [
      { text: 'Ärztlich melden, Metformin-Gabe nur nach Rücksprache, Ein- und Ausfuhr bilanzieren', warum: 'Metformin wird bei schlechter Nierenfunktion meist pausiert. Die Bilanz zeigt, ob Flüssigkeit fehlt oder die Ausscheidung stockt.' },
      { text: 'Metformin weitergeben, der Blutzucker ist ja erhöht', warum: 'Der Blutzucker ist nicht das Problem; Metformin kann bei Nierenversagen zur Laktatazidose führen.' },
      { text: 'Viel Kaliumhaltiges zu trinken anbieten', warum: 'Trinken ja, wenn ärztlich nichts dagegen spricht, aber kein Kalium: es steigt schon.' },
    ] },
  },
  {
    id: 'natrium', titel: 'Neu verwirrt', geschlecht: 'w',
    kontext: 'Frau L., 86 Jahre, seit einer Woche ein neues Diuretikum (Hydrochlorothiazid). Heute plötzlich verwirrt, unsicher beim Gehen.',
    zeiten: [-7 * TAG, -3 * TAG, -TAG, 0],
    werte: { na: [137, 131, 126, 121], k: [4.0, 3.7, 3.5, 3.4], krea: [0.9, 0.9, 1.0, 1.0], crp: [3, 4, 3, 5], glukose: [96, 102, 99, 104] },
    gesucht: 'na',
    warum: 'Das Natrium fällt seit Beginn des Thiazids stetig auf 121 mmol/l. Hyponatriämie macht Verwirrtheit, Stürze und im Extrem Krampfanfälle. Das Kalium sinkt leicht mit, das CRP spricht nicht für einen Infekt.',
    handeln: { frage: 'Was tust du jetzt?', optionen: [
      { text: 'Ärztlich melden, Sturzprophylaxe, Bewusstsein beobachten, Trinkmenge nach Anordnung', warum: 'Natrium wird langsam ausgeglichen, zu schnelles Anheben schadet dem Gehirn. Bis dahin Sicherheit vor Stürzen.' },
      { text: 'Viel Wasser trinken lassen gegen die Verwirrtheit', warum: 'Viel freies Wasser verdünnt das Natrium weiter.' },
      { text: 'Als Demenz dokumentieren', warum: 'Plötzliche Verwirrtheit ist ein Akutereignis (Delir), nicht Demenz: Ursache suchen.' },
    ] },
  },
];
