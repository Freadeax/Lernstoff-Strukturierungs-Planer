// Fallakte „Herr Demir will wieder nach Hause“: Kurzzeitpflege nach Schlaganfall, ein jüngerer Erwachsener.
// Alle Personen, Einrichtungen und Werte sind frei erfunden.
// Aufbau wie lindner.ts: nur Typen importieren, die Trainer-Listen importieren diese Datei.
import type { SisFall } from '../../sis/faelle';
import type { Vignette } from '../../assessment/vignetten';
import type { PlanFall } from '../../pflegeplanung/faelle';
import type { BerichtFall } from '../../bericht/faelle';
import type { Fall as UebergabeFall } from '../../uebergabe/faelle';
import type { SbarEreignis } from '../../uebergabe/grundkriterien';
import type { Fallakte } from '../typen';

const NAME = 'Kemal Demir';

export const DEMIR_SIS: SisFall = {
  id: 'demir',
  titel: 'Fallakte: Kurzzeitpflege nach Schlaganfall',
  setting: 'stationaer',
  anlass: 'Aufnahme in die Kurzzeitpflege nach Schlaganfall und Frührehabilitation, Rückkehr nach Hause geplant',
  person: [
    { label: 'Name', wert: `${NAME}, 64 Jahre` },
    { label: 'Gespräch', wert: 'Am Aufnahmetag mit Herrn Demir und seiner Ehefrau Ayşe Demir (61)' },
  ],
  gespraech: [
    { wer: 'Herr Demir', text: 'In drei Wochen will ich wieder zu Hause sein. Dafür bin ich hier, nicht für immer.' },
    { wer: 'Herr Demir', text: 'Der linke Arm gehorcht mir nicht. Und die Schulter tut weh, wenn jemand daran zieht, so eine Sechs.' },
    { wer: 'Herr Demir', text: 'Ich will alleine aufstehen. In der Klinik haben sie immer gesagt: Warten Sie, warten Sie.' },
    { wer: 'Herr Demir', text: 'Beim Trinken verschlucke ich mich manchmal, dann muss ich husten. Brot geht schlecht.' },
    { wer: 'Herr Demir', text: 'Schweinefleisch esse ich nicht. Und morgens brauche ich meinen schwarzen Tee.' },
    { wer: 'Herr Demir', text: 'Ich war 30 Jahre Busfahrer. Jetzt kann ich nicht mal meine Hose zumachen.' },
    { wer: 'Ehefrau', text: 'Wir wohnen im zweiten Stock, ohne Aufzug. Ich arbeite noch vormittags in der Bäckerei.' },
    { wer: 'Ehefrau', text: 'Manchmal sieht er Sachen auf der linken Seite nicht. Gestern hat er seinen Teller nur halb gegessen und gesagt, er sei fertig.' },
    { wer: 'Ehefrau', text: 'Den Zucker hat er früher selbst gemessen. Spritzen kann er jetzt mit einer Hand nicht.' },
  ],
  beobachtungen: [
    'Wach, zu allen Qualitäten orientiert, spricht deutlich, versteht alles.',
    'Linker Arm schlaff, linkes Bein kraftgemindert. Mit einer Hilfsperson steht er auf und geht mit Vierpunktstock etwa 10 Meter, das linke Bein schleift.',
    'Nach links schaut er selten. Gegenstände links auf dem Tisch übersieht er, an der linken Türkante ist er im Rollstuhl angestoßen.',
    'Beim Trinken aus dem Becher hustet er zweimal. Laut Entlassbrief: weiche Kost, Getränke in kleinen Schlucken mit Kopf leicht nach vorn, Logopädie.',
    'Blutzucker vor dem Abendessen 168 mg/dl.',
    'Haut intakt, kontinent. Er nutzt die Toilette mit Hilfe beim Transfer.',
  ],
  unterlagen: [
    { label: 'Diagnosen', wert: 'Ischämischer Schlaganfall rechts vor drei Wochen mit Hemiparese links und Neglect links, leichte Schluckstörung, Diabetes mellitus Typ 2, arterielle Hypertonie' },
    { label: 'Medikamente', wert: 'Insulin glargin 20 IE abends, Metformin 1000 mg morgens und abends, ASS 100 mg, Atorvastatin, Ramipril' },
    { label: 'Ärztliche Vorgabe', wert: 'Blutzucker vor jeder Mahlzeit und vor dem Schlafen; unter 70 mg/dl behandeln und den Arzt informieren. Weiche Kost, Logopädie zweimal pro Woche.' },
    { label: 'Therapie', wert: 'Physiotherapie und Ergotherapie täglich, Ziel Rückkehr in die eigene Wohnung' },
    { label: 'Hilfsmittel', wert: 'Rollstuhl, Vierpunktstock, Antirutschmatte, Becher mit Nasenausschnitt' },
  ],
  kernpunkte: [
    { id: 'b-hause', feld: 'B', pflicht: true, text: 'Will in drei Wochen wieder nach Hause', muster: ['nach hause', 'zu hause', 'drei wochen'] },
    { id: 'b-allein', feld: 'B', pflicht: true, text: 'Will allein aufstehen, empfand „Warten Sie“ als Bevormundung', muster: ['alleine', 'allein', 'warten sie'] },
    { id: 'b-busfahrer', feld: 'B', pflicht: false, text: 'War 30 Jahre Busfahrer, leidet unter dem Verlust', muster: ['busfahrer', 'hose'] },
    { id: 'tf1-orientiert', feld: 'TF1', pflicht: true, text: 'Orientiert, versteht alles, entscheidet selbst', muster: ['orientiert', 'versteht', 'entscheid'] },
    { id: 'tf1-neglect', feld: 'TF1', pflicht: true, text: 'Übersieht Dinge auf der linken Seite (Neglect)', muster: ['neglect', 'linke seite', 'links ueber', 'uebersieht'], auchIn: ['TF2'], begruendung: 'Der Neglect ist eine Wahrnehmungsstörung (TF1). Weil er vor allem beim Gehen und Fahren zu Stößen führt, ist er in TF2 ebenfalls vertretbar.' },
    { id: 'tf2-stehen', feld: 'TF2', pflicht: true, text: 'Steht mit einer Hilfsperson auf, geht mit Vierpunktstock etwa 10 m', muster: ['vierpunkt', '10 m', 'hilfsperson'] },
    { id: 'tf2-arm', feld: 'TF2', pflicht: true, text: 'Linker Arm schlaff, linkes Bein kraftgemindert', muster: ['arm', 'hemiparese', 'laehmung'] },
    { id: 'tf2-rollstuhl', feld: 'TF2', pflicht: false, text: 'Rollstuhl für längere Wege', muster: ['rollstuhl'] },
    { id: 'tf3-schlaganfall', feld: 'TF3', pflicht: true, text: 'Schlaganfall rechts vor drei Wochen, Therapien täglich', muster: ['schlaganfall', 'apoplex', 'insult'] },
    { id: 'tf3-schulter', feld: 'TF3', pflicht: true, text: 'Schulterschmerz links NRS 6, wenn am Arm gezogen wird', muster: ['schulter'], auchIn: ['TF2'], begruendung: 'Der Schmerz gehört zur Erkrankung (TF3). Weil er bei Transfer und Lagerung entsteht, ist er in TF2 ebenfalls vertretbar.' },
    { id: 'tf3-schlucken', feld: 'TF3', pflicht: true, text: 'Leichte Schluckstörung, verschluckt sich beim Trinken', muster: ['verschluck', 'schluck', 'dysphag'], auchIn: ['TF4'], begruendung: 'Die Schluckstörung ist Folge des Schlaganfalls (TF3). Weil sie Essen und Trinken betrifft, ist sie in TF4 ebenfalls vertretbar.' },
    { id: 'tf3-diabetes', feld: 'TF3', pflicht: true, text: 'Diabetes mit Insulin, Blutzucker vor den Mahlzeiten, kann mit einer Hand nicht spritzen', muster: ['diabetes', 'insulin', 'blutzucker'] },
    { id: 'tf4-anziehen', feld: 'TF4', pflicht: true, text: 'Braucht Hilfe beim Anziehen der unteren Körperhälfte und beim Transfer zur Toilette, kontinent', muster: ['anzieh', 'hose', 'kleid'] },
    { id: 'tf4-essen', feld: 'TF4', pflicht: true, text: 'Weiche Kost, kein Schweinefleisch, isst die linke Tellerhälfte nicht', muster: ['weiche kost', 'schwein', 'teller'] },
    { id: 'tf4-tee', feld: 'TF4', pflicht: false, text: 'Morgens schwarzer Tee', muster: ['tee'], auchIn: ['TF6'], begruendung: 'Als Getränkewunsch in TF4, als Gewohnheit am Morgen in TF6 vertretbar.' },
    { id: 'tf5-ehefrau', feld: 'TF5', pflicht: true, text: 'Ehefrau unterstützt, arbeitet vormittags', muster: ['ehefrau', 'frau'] },
    { id: 'tf5-busfahrer', feld: 'TF5', pflicht: false, text: 'War Busfahrer', muster: ['busfahrer'] },
    { id: 'tf6-wohnung', feld: 'TF6', pflicht: true, text: 'Wohnung im zweiten Stock ohne Aufzug, Rückkehr geplant', muster: ['zweiten stock', '2. stock', 'aufzug', 'treppe'] },
  ],
  matrix: [
    { risiko: 'dekubitus', vorhanden: 'beides', weitere: 'beides', themenfelder: ['TF2'], begruendung: 'Haut intakt, er wechselt im Sitzen und Liegen die Position nur nach rechts gut. Ein Risiko ist vertretbar, wenn er lange im Rollstuhl sitzt; dann Braden-Skala und Haut ansehen.' },
    { risiko: 'sturz', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF2', 'TF1'], begruendung: 'Halbseitenlähmung, Neglect links und der Wunsch, allein aufzustehen. Sturzrisiko gezielt einschätzen und mit ihm vereinbaren, wann er klingelt.' },
    { risiko: 'inkontinenz', vorhanden: 'nein', weitere: 'nein', themenfelder: [], begruendung: 'Kontinent, braucht nur Hilfe beim Transfer zur Toilette.' },
    { risiko: 'schmerz', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF3', 'TF2'], begruendung: 'Schulterschmerz links NRS 6 bei Zug am Arm. Schmerz regelmäßig erfassen, Arm beim Transfer nie ziehen.' },
    { risiko: 'ernaehrung', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF4', 'TF3'], begruendung: 'Schluckstörung und Neglect (isst nur die rechte Tellerhälfte). Ess- und Trinkmenge erfassen, Logopädie einbeziehen.' },
    { risiko: 'sonstiges', vorhanden: 'ja', weitere: 'ja', themenfelder: ['TF3'], welches: ['aspiration', 'verschluck', 'unterzucker', 'hypoglyk', 'blutzucker'], begruendung: 'Aspiration bei Schluckstörung und Unterzuckerung, wenn er unter Insulin wenig isst.' },
  ],
  muster: {
    B: '„In drei Wochen will ich wieder zu Hause sein. Dafür bin ich hier.“ „Ich will alleine aufstehen. In der Klinik haben sie immer gesagt: Warten Sie.“ „Ich war 30 Jahre Busfahrer, jetzt kann ich nicht mal meine Hose zumachen.“',
    TF1: 'Herr Demir ist wach und orientiert, versteht alles und entscheidet selbst. Er übersieht Dinge auf der linken Seite (Neglect), auf dem Tisch und an der Türkante. Vereinbart: Wir sprechen ihn von links an, damit er die Seite übt, und legen Klingel und Becher rechts.',
    TF2: 'Der linke Arm ist schlaff, das linke Bein kraftgemindert. Mit einer Hilfsperson steht er auf und geht mit dem Vierpunktstock etwa 10 m; für längere Wege nutzt er den Rollstuhl. Er möchte allein aufstehen. Besprochen: Er übt das Aufstehen mit der Physiotherapie und klingelt, bis die Therapeutin es freigibt.',
    TF3: 'Schlaganfall rechts vor drei Wochen, täglich Physio- und Ergotherapie. Die linke Schulter schmerzt bei Zug am Arm (NRS 6); der Arm wird beim Transfer nicht gezogen, sondern unterstützt gelagert. Leichte Schluckstörung, er verschluckt sich beim Trinken; Logopädie zweimal pro Woche. Diabetes mit Insulin am Abend, Blutzucker vor jeder Mahlzeit; mit einer Hand kann er nicht spritzen, das übernehmen wir. Er möchte das Messen wieder selbst lernen.',
    TF4: 'Oberkörper wäscht er selbst im Sitzen, beim Anziehen der Hose und der Schuhe braucht er Hilfe, ebenso beim Transfer zur Toilette; er ist kontinent. Weiche Kost ohne Schweinefleisch, Getränke in kleinen Schlucken mit dem Becher mit Nasenausschnitt. Die linke Tellerhälfte isst er nicht, wir drehen den Teller. Morgens möchte er schwarzen Tee.',
    TF5: 'Seine Ehefrau besucht ihn nachmittags, vormittags arbeitet sie in einer Bäckerei. Er war 30 Jahre Busfahrer und war viel unter Menschen. Beide möchten, dass er nach Hause zurückkehrt.',
    TF6: 'Die Wohnung liegt im zweiten Stock ohne Aufzug. Die Rückkehr ist geplant; vereinbart: Treppensteigen mit der Physiotherapie üben, Sozialdienst und Ehefrau klären Hilfsmittel und ambulanten Pflegedienst für zu Hause.',
  },
};

export const DEMIR_BARTHEL: Vignette = {
  id: 'ba-demir', gruppe: 'barthel', instrument: 'barthel', titel: 'Herr Demir, 64 Jahre (Fallakte)', setting: 'Kurzzeitpflege, zweiter Tag nach der Aufnahme',
  text: [
    'Herr Demir isst mit der rechten Hand selbst. Das Fleisch muss ihm jemand klein schneiden.',
    'Vom Bett in den Rollstuhl kommt er nur, wenn eine geschulte Pflegeperson ihn am Becken führt und den linken Arm stützt.',
    'Gesicht und Oberkörper wäscht er selbst im Sitzen am Waschbecken, rasiert sich mit dem Elektrorasierer. Rücken und Füße wäscht die Pflege.',
    'Zur Toilette braucht er Hilfe beim Umsetzen und beim Hochziehen der Hose. Reinigen kann er sich selbst.',
    'Geduscht wird er von der Pflege auf dem Duschstuhl.',
    'Im Wohnbereich fährt er den Rollstuhl nicht selbst, weil er links an Türen hängen bleibt. Mit Stock und Hilfsperson geht er etwa 10 Meter.',
    'Treppen steigt er noch nicht.',
    'Hemd und Pullover zieht er selbst an, wenn sie bereitliegen. Hose, Socken und Schuhe zieht ihm die Pflege an.',
    'Er ist stuhl- und harnkontinent.',
  ],
  loesung: { essen: 5, transfer: 5, waschen: 0, toilette: 5, baden: 0, gehen: 0, treppe: 0, kleiden: 5, stuhl: 10, harn: 10 },
  begruendung: {
    essen: 'Isst selbst, braucht aber Hilfe beim Zerkleinern: 5.',
    transfer: 'Braucht erhebliche, geschulte Hilfe: 5.',
    waschen: 'Nicht vollständig selbstständig (Rücken, Füße): 0.',
    toilette: 'Hilfe beim Umsetzen und bei der Kleidung: 5.',
    baden: 'Duschen nur mit Hilfe: 0.',
    gehen: 'Geht nur 10 m mit Hilfsperson und fährt den Rollstuhl nicht selbst: 0.',
    treppe: 'Steigt keine Treppen: 0.',
    kleiden: 'Nur den Oberkörper selbst: 5.',
    stuhl: 'Kontinent: 10.',
    harn: 'Kontinent: 10.',
  },
  fazit: '40 Punkte, hilfebedürftig. Für die Rückkehr in eine Wohnung im zweiten Stock fehlen vor allem Transfer, Gehen und Treppe. Diese Bereiche gehören in die Planung und in die Absprachen mit der Physiotherapie.',
};

export const DEMIR_NRS: Vignette = {
  id: 'sz-demir', gruppe: 'schmerz', instrument: 'nrs', titel: 'Herr Demir, 64 Jahre (Fallakte)', setting: 'Kurzzeitpflege, zweiter Tag nach der Aufnahme',
  text: [
    'Herr Demir hat seit dem Schlaganfall eine schlaffe Lähmung des linken Arms. Er ist orientiert und gibt klar Auskunft.',
    'Beim Umsetzen in den Rollstuhl hat eine Aushilfe ihn unter der linken Achsel hochgezogen. Jetzt sitzt er im Rollstuhl, der Arm liegt auf einem Tisch vor ihm.',
    'Du fragst nach der Schulter. Er sagt: „Beim Hochziehen war das eine Acht. Jetzt, wo der Arm liegt, so eine Vier.“',
  ],
  instrumentWahl: 'Er kann selbst Auskunft geben, also gilt die Selbsteinschätzung mit der NRS.',
  loesung: { wert: 4 },
  begruendung: { wert: 'Gefragt ist der Schmerz jetzt in Ruhe: 4. Die 8 beim Hochziehen dokumentierst du getrennt als Belastungsschmerz.' },
  fazit: 'Ruheschmerz 4, Belastungsschmerz 8. Der Schmerz entsteht beim Ziehen am gelähmten Arm: Arm beim Transfer stützen statt ziehen, im Sitzen auf einem Tisch oder Kissen lagern, alle im Team informieren. Bedarfsmedikation nach Anordnung, Wirkung nach 30 bis 60 Minuten erneut erfassen.',
};

export const DEMIR_PLAN: PlanFall = {
  id: 'demir-schlaganfall',
  titel: 'Fallakte: Herr Demir nach Schlaganfall',
  setting: 'langzeit',
  bereich: 'Kurzzeitpflege',
  person: `${NAME}, 64 Jahre`,
  text: 'Herr Demir ist vor drei Tagen nach einem Schlaganfall rechts in die Kurzzeitpflege gekommen. Der linke Arm ist schlaff, das linke Bein kraftgemindert; mit einer Hilfsperson und Vierpunktstock geht er etwa 10 Meter. Dinge auf der linken Seite übersieht er, die linke Tellerhälfte isst er nicht. Beim Trinken verschluckt er sich. Die linke Schulter schmerzt, wenn am Arm gezogen wird. Er spritzt Insulin, kann das mit einer Hand aber nicht. Er will allein aufstehen und in drei Wochen zurück in seine Wohnung im zweiten Stock ohne Aufzug.',
  daten: [
    { label: 'Diagnosen', wert: 'Ischämischer Schlaganfall rechts mit Hemiparese und Neglect links, leichte Schluckstörung, Diabetes mellitus Typ 2, Hypertonie' },
    { label: 'Medikamente', wert: 'Insulin glargin 20 IE abends, Metformin 1000 mg morgens und abends, ASS 100 mg, Atorvastatin, Ramipril' },
    { label: 'Ärztliche Vorgabe', wert: 'Blutzucker vor jeder Mahlzeit und vor dem Schlafen; unter 70 mg/dl behandeln und Arzt informieren; weiche Kost, Logopädie' },
    { label: 'Vitalzeichen', wert: 'RR 146/88 mmHg, Puls 76/min, Blutzucker 120 bis 190 mg/dl' },
    { label: 'Assessments', wert: 'Barthel 40, Schulterschmerz NRS 4 in Ruhe und 8 bei Zug am Arm' },
    { label: 'Mobilität', wert: 'Transfer mit geschulter Hilfe, geht 10 m mit Vierpunktstock und Hilfsperson, Rollstuhl' },
    { label: 'Ernährung', wert: 'Weiche Kost, isst etwa die Hälfte (linke Tellerhälfte bleibt liegen), hustet beim Trinken' },
    { label: 'Sozial', wert: 'Ehefrau (61) arbeitet vormittags, Wohnung im zweiten Stock ohne Aufzug' },
  ],
  verlauf: 'Zwei Wochen später: Herr Demir steht mit Aufsicht allein auf und geht mit dem Vierpunktstock 30 m. Treppen schafft er mit der Physiotherapeutin ein halbes Stockwerk. Beim Transfer stützt das Team den Arm, der Schulterschmerz liegt bei NRS 2 bis 3. Seit der Teller gedreht wird und er links beginnt, isst er drei Viertel. Beim Trinken mit kleinen Schlucken hustet er kaum noch. Den Blutzucker misst er mit Hilfe selbst; an Tag 6 hatte er morgens eine Unterzuckerung, danach wurde das Insulin auf 16 IE gesenkt.',
  topicIds: ['thema.kl.neuro', 'thema.pro.sturz', 'thema.kl.diabetes'],
  info: [
    { id: 'laehmung', text: 'Hemiparese links, geht 10 m mit Stock und Hilfsperson', muster: ['hemiparese', 'laehmung', 'arm', '10 m', 'vierpunkt'], pflicht: true },
    { id: 'neglect', text: 'Neglect links, isst die linke Tellerhälfte nicht', muster: ['neglect', 'linke seite', 'tellerhaelfte', 'uebersieht'], pflicht: true },
    { id: 'schlucken', text: 'Schluckstörung, hustet beim Trinken', muster: ['schluck', 'verschluck', 'dysphag', 'hustet'], pflicht: true },
    { id: 'schulter', text: 'Schulterschmerz NRS 8 bei Zug am Arm', muster: ['schulter', 'nrs'], pflicht: true },
    { id: 'diabetes', text: 'Insulin, kann mit einer Hand nicht spritzen', muster: ['insulin', 'diabetes', 'blutzucker'], pflicht: true },
    { id: 'zuhause', text: 'Will in drei Wochen nach Hause, zweiter Stock ohne Aufzug', muster: ['nach hause', 'zweiten stock', 'aufzug', 'treppe'], pflicht: true },
    { id: 'allein', text: 'Will allein aufstehen', muster: ['allein'], pflicht: false },
  ],
  probleme: [
    { id: 'mobilitaet', art: 'aktuell', pflicht: true, text: 'Beeinträchtigte Mobilität bei Hemiparese links',
      muster: ['mobil', 'beweg', 'hemiparese', 'laehmung', 'transfer', 'gehen'],
      massnahmen: { text: 'Transfer über die betroffene Seite nach Bobath bzw. nach Absprache mit der Physiotherapie, Gehen und Treppe täglich üben, Aufstehen anleiten statt abnehmen', muster: ['bobath', 'physiotherap', 'ueben', 'trainier', 'anleit', 'treppe', 'gehtraining', 'kinaesthetik'] } },
    { id: 'sturz', art: 'risiko', pflicht: true, text: 'Sturzgefahr',
      muster: ['sturz'],
      massnahmen: { text: 'Klingel und Hilfsmittel rechts in Reichweite, Bremsen am Rollstuhl, feste Schuhe, vereinbaren, wann er klingelt', muster: ['klingel', 'reichweite', 'bremse', 'schuh', 'vereinbar', 'begleit', 'licht', 'sturzprophyl'] } },
    { id: 'schlucken', art: 'risiko', pflicht: true, text: 'Aspirationsgefahr bei Schluckstörung',
      muster: ['aspiration', 'verschluck', 'schluck', 'dysphag'],
      massnahmen: { text: 'Aufrecht sitzend essen und trinken, kleine Schlucke, Kopf leicht nach vorn, Becher mit Nasenausschnitt, nach dem Essen 20 Minuten sitzen, Mundpflege, Logopädie', muster: ['aufrecht', 'kleine schluck', 'kopf', 'nasenausschnitt', 'oberkoerper', 'logopaed', 'mundpflege', 'sitzen bleib'] } },
    { id: 'neglect', art: 'aktuell', pflicht: true, text: 'Wahrnehmungsstörung der linken Seite (Neglect)',
      muster: ['neglect', 'wahrnehm', 'linke seite', 'halbseit'],
      massnahmen: { text: 'Von links ansprechen und Reize von links setzen, Teller drehen und links beginnen lassen, Hilfsmittel für Sicherheit rechts', muster: ['von links', 'links ansprech', 'teller dreh', 'drehen', 'reize', 'basale', 'aufmerksamkeit'] } },
    { id: 'schmerz', art: 'aktuell', pflicht: true, text: 'Schulterschmerz links bei Hemiparese',
      muster: ['schulter', 'schmerz'],
      massnahmen: { text: 'Arm beim Transfer stützen und nie ziehen, im Sitzen auf Tisch oder Kissen lagern, Schmerz mit NRS erfassen, Team informieren', muster: ['nicht ziehen', 'nie ziehen', 'stuetz', 'lager', 'kissen', 'tisch', 'nrs', 'schmerzerfass'] } },
    { id: 'diabetes', art: 'risiko', pflicht: false, text: 'Gefahr der Unterzuckerung bei Insulin und wechselnder Essmenge',
      muster: ['unterzucker', 'hypoglyk', 'blutzucker', 'diabetes'],
      massnahmen: { text: 'Blutzucker vor den Mahlzeiten, Essmenge beachten, Traubenzucker bereithalten, Anzeichen kennen, Selbstmessung einhändig anleiten', muster: ['blutzucker', 'bz', 'traubenzucker', 'glukose', 'essmenge', 'anzeichen', 'selbstmess', 'messen'] } },
  ],
  ressourcen: [
    { id: 'orientiert', text: 'Orientiert, versteht alles, entscheidet selbst', muster: ['orientiert', 'versteht', 'entscheid'], pflicht: true },
    { id: 'motivation', text: 'Will nach Hause und allein aufstehen', muster: ['motiv', 'nach hause', 'will', 'allein'], pflicht: true },
    { id: 'ehefrau', text: 'Ehefrau unterstützt', muster: ['ehefrau', 'frau', 'angehoer'], pflicht: false },
    { id: 'rechts', text: 'Rechte Hand und rechtes Bein kräftig', muster: ['rechte', 'rechts'], pflicht: false },
  ],
  beispiel: `P: Beeinträchtigte Mobilität bei Hemiparese links
E: beeinflusst durch Schlaganfall rechts vor drei Wochen
S: angezeigt durch Transfer nur mit geschulter Hilfe, geht 10 m mit Vierpunktstock und Hilfsperson
R: orientiert, will allein aufstehen und nach Hause, rechte Seite kräftig

Ziel: Herr Demir steht mit Aufsicht allein auf und geht mit dem Vierpunktstock 30 m. Überprüfung: täglich, Ziel in 14 Tagen.
Maßnahme: Aufstehen und Gehen nach Absprache mit der Physiotherapie täglich üben; anleiten statt abnehmen; Treppensteigen mit der Physiotherapie beginnen.
Wann: morgens und nachmittags bei jedem Transfer
Wer: Pflegefachperson, Physiotherapie
Begründung: Was er selbst tut, trainiert er. Für die Wohnung im zweiten Stock braucht er Gehen und Treppe.

P: Aspirationsgefahr bei Schluckstörung
E: beeinflusst durch Schlaganfall
S: angezeigt durch Husten beim Trinken aus dem Becher
R: versteht die Hinweise und setzt sie um

Ziel: Herr Demir trinkt in kleinen Schlucken mit dem Kopf leicht nach vorn und hustet dabei nicht mehr. Überprüfung: bei jeder Mahlzeit, Ziel in 7 Tagen.
Maßnahme: Aufrecht sitzend essen und trinken, Becher mit Nasenausschnitt, nach dem Essen 20 Minuten sitzen bleiben, Mundpflege nach dem Essen.
Wann: bei jeder Mahlzeit
Wer: Pflegefachperson nach Empfehlung der Logopädie
Begründung: Aufrechte Haltung und Kopf nach vorn schützen die Atemwege. Speisereste im Mund können aspiriert werden.

P: Wahrnehmungsstörung der linken Seite (Neglect)
E: beeinflusst durch Schlaganfall rechts
S: angezeigt durch liegengelassene linke Tellerhälfte, stößt im Rollstuhl links an
R: orientiert, lässt sich gern ansprechen

Ziel: Herr Demir isst seine Portion vollständig, wenn er an die linke Tellerhälfte erinnert wird. Überprüfung: täglich, Ziel in 7 Tagen.
Maßnahme: Von links ansprechen, Teller drehen und ihn links beginnen lassen; Klingel und Becher rechts.
Wann: bei jeder Mahlzeit und jedem Kontakt
Wer: Pflegefachperson, Ehefrau nach Anleitung
Begründung: Reize von links fördern die Aufmerksamkeit für die vernachlässigte Seite. Sicherheitswichtiges liegt rechts, damit er es sicher findet.

P: Schulterschmerz links bei Hemiparese
E: beeinflusst durch Zug am gelähmten Arm
S: angezeigt durch NRS 8 beim Hochziehen, NRS 4 in Ruhe
R: kann Schmerz klar benennen

Ziel: Herr Demir gibt beim Transfer höchstens NRS 3 an. Überprüfung: bei jedem Transfer, Ziel in 7 Tagen.
Maßnahme: Arm beim Transfer stützen und nie ziehen, im Sitzen auf einem Tisch oder Kissen lagern, Schmerz mit NRS erfassen, alle im Team informieren.
Wann: bei jedem Transfer
Wer: alle Pflegenden
Begründung: Zug am schlaffen Arm überdehnt das Schultergelenk. Wenn alle gleich handeln, bleibt der Schmerz aus.

P: Sturzgefahr
E: beeinflusst durch Hemiparese und Neglect links, will allein aufstehen
R: versteht Absprachen, klingelt

Ziel: Herr Demir stürzt nicht und klingelt vor dem Aufstehen, bis die Physiotherapie das Aufstehen allein freigibt. Überprüfung: täglich.
Maßnahme: Klingel rechts in Reichweite, Bremsen am Rollstuhl, feste Schuhe; mit ihm vereinbaren, wann er klingelt.
Wann: bei jedem Kontakt
Wer: Pflegefachperson
Begründung: Expertenstandard Sturzprophylaxe: Risiken gezielt angehen und Absprachen mit der Person treffen statt sie festzuhalten.

P: Gefahr der Unterzuckerung bei Insulin und wechselnder Essmenge
E: beeinflusst durch Insulin am Abend, isst nur etwa die Hälfte
R: hat früher selbst gemessen, will es wieder lernen

Ziel: Herr Demir misst den Blutzucker einhändig selbst, und die Werte vor den Mahlzeiten liegen zwischen 80 und 200 mg/dl. Überprüfung: täglich, Ziel in 14 Tagen.
Maßnahme: Blutzucker vor den Mahlzeiten und vor dem Schlafen messen, Essmenge vor dem Insulin beachten, Traubenzucker bereithalten; einhändiges Messen anleiten.
Wann: vor jeder Mahlzeit und um 21 Uhr
Wer: Pflegefachperson
Begründung: Insulin bei geringer Essmenge führt zur Unterzuckerung. Selbst messen braucht er zu Hause.`,
};

export const DEMIR_BERICHT: BerichtFall = {
  id: 'demir-unterzucker',
  titel: 'Fallakte: Unterzuckerung am Morgen',
  art: 'schreiben',
  bereich: 'langzeit',
  person: `${NAME}, 64 Jahre, Schlaganfall und Diabetes mit Insulin, sechster Tag der Kurzzeitpflege`,
  szene: [
    'Um 6:40 Uhr kommst du zur Morgenpflege. Herr Demir ist schweißnass, zittert und antwortet langsam. Er sagt: „Mir ist so komisch, alles dreht sich.“',
    'Du misst den Blutzucker: 52 mg/dl. Puls 104/min, RR 150/90 mmHg. Er ist wach und kann schlucken.',
    'Laut Essprotokoll hat er gestern Abend nur ein Viertel gegessen, das Insulin hat er um 21 Uhr wie verordnet bekommen.',
    'Du gibst ihm aufrecht sitzend in kleinen Schlucken 200 ml Apfelsaft und bleibst bei ihm.',
    'Um 7:00 Uhr: Blutzucker 98 mg/dl, er ist nicht mehr schweißig und sagt: „Jetzt geht es wieder.“ Er frühstückt zwei Scheiben weiches Brot mit Käse.',
    'Du informierst die Pflegefachkraft im Frühdienst; sie ruft um 7:30 Uhr den Hausarzt an.',
  ],
  kernpunkte: [
    { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (6:40 Uhr)', muster: ['6:40', '06:40'] },
    { id: 'bz', baustein: 'beobachtung', pflicht: true, text: 'Blutzucker 52 mg/dl', muster: ['52'] },
    { id: 'zeichen', baustein: 'beobachtung', pflicht: true, text: 'Schweißnass, zittert, antwortet langsam', muster: ['schweiss', 'zittert', 'zittern'] },
    { id: 'puls', baustein: 'beobachtung', pflicht: false, text: 'Puls 104/min', muster: ['104'] },
    { id: 'abendessen', baustein: 'beobachtung', pflicht: false, text: 'Gestern Abend nur ein Viertel gegessen, Insulin um 21 Uhr', muster: ['viertel'] },
    { id: 'aussage', baustein: 'aussage', pflicht: true, text: 'Aussage von Herrn Demir wörtlich', muster: ['komisch', 'dreht sich'] },
    { id: 'saft', baustein: 'massnahme', pflicht: true, text: '200 ml Apfelsaft aufrecht in kleinen Schlucken', muster: ['saft', 'apfelsaft', 'glukose', 'traubenzucker'] },
    { id: 'wirkung', baustein: 'wirkung', pflicht: true, text: '7:00 Uhr Blutzucker 98 mg/dl, wieder klar', muster: ['98'] },
    { id: 'fruehstueck', baustein: 'wirkung', pflicht: false, text: 'Hat danach gefrühstückt', muster: ['fruehstueck', 'brot'] },
    { id: 'weitergabe', baustein: 'weitergabe', pflicht: true, text: 'Pflegefachkraft informiert, Hausarzt wird angerufen', muster: ['pflegefachkraft', 'hausarzt', 'informiert'] },
  ],
  muster: '6:40 Uhr: Herr Demir ist bei der Morgenpflege schweißnass, zittert und antwortet langsam. Er sagt: „Mir ist so komisch, alles dreht sich.“ Blutzucker 52 mg/dl, Puls 104/min, RR 150/90 mmHg, wach und schluckt sicher. Laut Essprotokoll gestern Abend nur ein Viertel gegessen, Insulin um 21 Uhr nach Plan erhalten. Aufrecht sitzend 200 ml Apfelsaft in kleinen Schlucken gegeben, bei ihm geblieben. 7:00 Uhr Blutzucker 98 mg/dl, nicht mehr schweißig, er sagt: „Jetzt geht es wieder.“ Hat zwei Scheiben weiches Brot mit Käse gefrühstückt. Pflegefachkraft im Frühdienst informiert, sie ruft den Hausarzt an.',
};

export const DEMIR_UEBERGABE: UebergabeFall = {
  id: 'demir-hausarzt',
  titel: 'Fallakte: Unterzuckerung unter Insulin',
  bereich: 'Kurzzeitpflege',
  anlass: 'telefon',
  empfaenger: 'Hausarzt Dr. Yıldız, telefonisch in der Praxis',
  rolle: 'Auszubildende im dritten Ausbildungsjahr, Frühdienst, gemeinsam mit der Pflegefachkraft',
  lage: 'Es ist 7:30 Uhr. Herr Demir ist nach dem Apfelsaft wieder klar. Die Pflegefachkraft lässt dich den Hausarzt anrufen und hört mit.',
  daten: [
    { label: 'Patient', wert: `${NAME}, 64 Jahre, seit sechs Tagen in der Kurzzeitpflege nach Schlaganfall` },
    { label: 'Diagnosen', wert: 'Schlaganfall rechts mit Hemiparese links und Schluckstörung, Diabetes mellitus Typ 2, Hypertonie' },
    { label: 'Medikation', wert: 'Insulin glargin 20 IE um 21 Uhr, Metformin 1000 mg morgens und abends' },
    { label: 'Essen', wert: 'Gestern Abend nur ein Viertel gegessen, isst seit der Aufnahme etwa die Hälfte' },
    { label: '6:40 Uhr', wert: 'Blutzucker 52 mg/dl, schweißnass, zittrig, verlangsamt, Puls 104/min' },
    { label: 'Maßnahme', wert: '200 ml Apfelsaft aufrecht in kleinen Schlucken' },
    { label: '7:00 Uhr', wert: 'Blutzucker 98 mg/dl, klar, hat gefrühstückt' },
    { label: 'Ärztliche Vorgabe', wert: 'Unter 70 mg/dl behandeln und Arzt informieren' },
  ],
  kernpunkte: [
    { id: 'patient', teil: 'S', pflicht: true, text: 'Patient benennen (Herr Demir)', muster: ['demir'] },
    { id: 'problem', teil: 'S', pflicht: true, text: 'Problem: Unterzuckerung heute Morgen', muster: ['unterzucker', 'hypoglyk', 'zucker'] },
    { id: 'diabetes', teil: 'B', pflicht: true, text: 'Diabetes mit Insulin glargin 20 IE abends', muster: ['insulin', 'glargin', '20 ie', '20 einheiten'] },
    { id: 'schlaganfall', teil: 'B', pflicht: false, text: 'Schlaganfall mit Schluckstörung, Kurzzeitpflege', muster: ['schlaganfall', 'apoplex'] },
    { id: 'essen', teil: 'B', pflicht: true, text: 'Isst wenig, gestern Abend nur ein Viertel', muster: ['viertel', 'haelfte', 'wenig gegessen'] },
    { id: 'wert', teil: 'A', pflicht: true, text: 'Blutzucker 52 mg/dl um 6:40 Uhr', muster: ['52'] },
    { id: 'zeichen', teil: 'A', pflicht: false, text: 'Schweißig, zittrig, verlangsamt', muster: ['schweiss', 'zitt', 'verlangsamt'] },
    { id: 'verlauf', teil: 'A', pflicht: true, text: 'Nach 200 ml Apfelsaft 98 mg/dl', muster: ['98'] },
    { id: 'einschaetzung', teil: 'A', pflicht: false, text: 'Einschätzung: Insulindosis passt nicht zur geringeren Essmenge', muster: ['dosis', 'zu hoch', 'essmenge', 'vermute'] },
    { id: 'anordnung', teil: 'R', pflicht: true, text: 'Um Überprüfung der Insulindosis bitten', muster: ['dosis', 'anpass', 'reduz', 'senken', 'anordnung'] },
  ],
  muster: `S: Guten Morgen, hier spricht Lea Brandt, Auszubildende in der Kurzzeitpflege am Stadtpark. Ich rufe an wegen Herrn Kemal Demir, 64 Jahre. Er hatte heute Morgen eine Unterzuckerung.
B: Er ist seit sechs Tagen nach einem Schlaganfall mit Schluckstörung bei uns und hat Diabetes Typ 2. Er bekommt Insulin glargin 20 IE um 21 Uhr und Metformin. Er isst seit der Aufnahme nur etwa die Hälfte, gestern Abend nur ein Viertel.
A: Um 6:40 Uhr lag der Blutzucker bei 52 mg/dl, er war schweißnass, zittrig und verlangsamt, Puls 104. Nach 200 ml Apfelsaft war der Wert um 7:00 Uhr 98 mg/dl, er ist jetzt klar und hat gefrühstückt. Ich vermute, dass die Insulindosis für die geringe Essmenge zu hoch ist.
R: Können Sie bitte heute noch, vor der nächsten Insulingabe um 21 Uhr, die Dosis überprüfen und uns eine neue Anordnung geben? Bis dahin messen wir vor jeder Mahlzeit den Blutzucker. Fällt er wieder unter 70 mg/dl, rufe ich Sie erneut an.`,
};

export const DEMIR_EREIGNISSE: SbarEreignis[] = [
  { minute: 0, stufe: 'info', text: 'Ärztliche Vorgabe: Blutzucker unter 70 mg/dl behandeln und Arzt informieren' },
  { minute: 40, stufe: 'auffaellig', text: 'Blutzucker 52 mg/dl um 6:40 Uhr, nach Apfelsaft 98 mg/dl, abends nur ein Viertel gegessen', muster: ['unterzucker', 'hypoglyk', 'zucker'],
    empfehlung: 'Insulindosis heute überprüfen lassen und eine neue Anordnung erbitten', rueckfrage: 'Sollen wir heute Abend die volle Dosis geben oder bis zu Ihrer Anordnung warten?' },
];

export const DEMIR: Fallakte = {
  id: 'demir',
  titel: 'Herr Demir will wieder nach Hause',
  person: `${NAME}, 64 Jahre`,
  setting: 'Kurzzeitpflege',
  kurz: 'Schlaganfall mit Halbseitenlähmung, Neglect und Schluckstörung, dazu Insulin: drei Wochen Kurzzeitpflege mit einem klaren Ziel, der eigenen Wohnung im zweiten Stock.',
  einstieg: [
    'Herr Demir ist 64 Jahre alt und war bis vor drei Wochen Busfahrer. Nach einem Schlaganfall rechts und der Frührehabilitation kommt er für drei Wochen in die Kurzzeitpflege. Danach will er zurück in seine Wohnung im zweiten Stock, ohne Aufzug.',
    'Du nimmst ihn auf, schätzt Selbstständigkeit und Schulterschmerz ein, planst die Pflege, dokumentierst eine Unterzuckerung, rufst den Hausarzt an und prüfst vor der Entlassung, was die Planung gebracht hat.',
  ],
  schritte: [
    { id: 'sis', art: 'sis', fallId: 'demir', wann: 'Tag 1, Aufnahme', titel: 'Aufnahme und SIS', auftrag: 'Fülle die SIS mit Risikomatrix. Achte auf das, was er selbst will, und auf die Wohnung, in die er zurückkehrt.' },
    { id: 'barthel', art: 'assessment', fallId: 'ba-demir', wann: 'Tag 2', titel: 'Barthel-Index', auftrag: 'Wie selbstständig ist Herr Demir jetzt? Bewerte, was er tatsächlich tut, nicht was er sich vornimmt.' },
    { id: 'nrs', art: 'assessment', fallId: 'sz-demir', wann: 'Tag 2', titel: 'Schmerz (NRS)', auftrag: 'Nach einem Transfer klagt er über die Schulter. Erfasse den Schmerz und überlege, woher er kommt.' },
    { id: 'planung', art: 'pflegeplanung', fallId: 'demir-schlaganfall', wann: 'Tag 3', titel: 'Pflegeplanung', auftrag: 'Plane die drei Wochen mit Blick auf die Rückkehr nach Hause. Die Evaluation im Trainer zeigt den Verlauf zwei Wochen später.' },
    { id: 'bericht', art: 'bericht', fallId: 'demir-unterzucker', wann: 'Tag 6, 6:40 Uhr', titel: 'Pflegebericht', auftrag: 'Bei der Morgenpflege ist Herr Demir schweißnass und verlangsamt. Schreib den Eintrag in den Pflegebericht.' },
    { id: 'uebergabe', art: 'uebergabe', fallId: 'demir-hausarzt', wann: 'Tag 6, 7:30 Uhr', titel: 'Anruf beim Hausarzt (SBAR)', auftrag: 'Der Blutzucker ist wieder im Zielbereich. Ruf den Hausarzt an und bitte um eine Entscheidung zur Insulindosis.' },
    { id: 'evaluation', art: 'evaluation', fallId: 'demir-eval', wann: 'Tag 18, Entlassplanung', titel: 'Evaluation vor der Entlassung', auftrag: 'Drei Tage vor der geplanten Entlassung prüfst du die Ziele und entscheidest, was für zu Hause fortgeschrieben wird.' },
  ],
  evaluation: {
    id: 'demir-eval',
    verlauf: [
      'Tag 18, Entlassplanung mit Herrn Demir, seiner Ehefrau, der Physiotherapeutin und dem Sozialdienst. Die Entlassung ist für Tag 21 geplant.',
      'Herr Demir steht mit Aufsicht allein auf und geht mit dem Vierpunktstock 30 m. Treppen schafft er mit der Physiotherapeutin bisher ein halbes Stockwerk, bis zur Wohnung sind es zwei Stockwerke. Er sagt: „Die Treppe schaffe ich bis Freitag.“',
      'Unter der Woche gibt er beim Transfer NRS 2 bis 3 an. Am Wochenende (Tag 16 und 17) sagte er nach zwei Transfers mit Aushilfen: „Wieder an der Schulter gezogen, eine Sechs.“ Die Aushilfen kannten die Absprache nicht.',
      'Beim Trinken mit kleinen Schlucken hustet er seit einer Woche nicht mehr. Wenn ihn niemand erinnert, lässt er die linke Tellerhälfte weiterhin liegen. Mit Erinnerung isst er die ganze Portion. Seine Frau hat das Drehen des Tellers zweimal beim Abendessen übernommen.',
      'An Tag 15 lagen zwei Werte vor dem Abendessen über 250 mg/dl, nachdem die Ehefrau Gebäck aus der Bäckerei mitgebracht hatte. Unterzuckerungen gab es seit der Dosissenkung auf 16 IE nicht mehr. Den Blutzucker misst er inzwischen einhändig selbst.',
    ],
    ziele: [
      {
        id: 'mobilitaet', problem: 'Beeinträchtigte Mobilität bei Hemiparese links',
        ziel: 'Herr Demir steht mit Aufsicht allein auf und geht mit dem Vierpunktstock 30 m.',
        erwartet: 'ja',
        beleg: 'Er steht mit Aufsicht allein auf und geht 30 m mit dem Stock, genau wie im Ziel vereinbart. Dass die Treppe noch fehlt, betrifft ein anderes, neues Ziel.',
        anpassungen: [
          { text: 'Ziel erreicht, deshalb kann er am Tag 21 ohne weitere Klärung nach Hause.', richtig: false, warum: 'Für die Wohnung im zweiten Stock reicht das Gehen in der Ebene nicht. Zwei Stockwerke Treppe sind noch nicht geschafft.' },
          { text: 'Neues Ziel für die Treppe formulieren (zwei Stockwerke mit Geländer und Begleitung) und mit allen klären, ob die Entlassung am Tag 21 passt oder Physiotherapie zu Hause nötig ist.', richtig: true, warum: 'Das erreichte Ziel wird fortgeschrieben, und das Entlassmanagement (Expertenstandard) verlangt, die Versorgung zu Hause vorab zu sichern.' },
          { text: 'Gehtraining beenden, damit er bis Freitag nur noch Treppe übt.', richtig: false, warum: 'Gehen und Aufstehen bleiben Grundlage für die Treppe und den Alltag. Ein erreichtes Ziel heißt nicht, die Übung abzubrechen.' },
        ],
      },
      {
        id: 'neglect', problem: 'Wahrnehmungsstörung der linken Seite (Neglect)',
        ziel: 'Herr Demir isst seine Portion vollständig, wenn er an die linke Tellerhälfte erinnert wird.',
        erwartet: 'ja',
        beleg: 'Mit Erinnerung isst er die ganze Portion. Das Ziel verlangt die Erinnerung ausdrücklich; dass er ohne sie die linke Hälfte liegen lässt, war zu erwarten.',
        anpassungen: [
          { text: 'Die Ehefrau weiter anleiten (Teller drehen, von links ansprechen) und das Vorgehen im Überleitungsbogen für den ambulanten Dienst festhalten.', richtig: true, warum: 'Zu Hause übernimmt sie das Erinnern. Die Überleitung sorgt dafür, dass der ambulante Dienst dasselbe tut.' },
          { text: 'Teller ab sofort nur noch rechts hinstellen, dann isst er alles.', richtig: false, warum: 'Das umgeht das Problem, statt die linke Seite einzubeziehen, und hilft ihm außerhalb des Tellers nicht.' },
          { text: 'Ziel streichen, weil der Neglect ohnehin bleibt.', richtig: false, warum: 'Ein Neglect kann sich bessern, und auch wenn nicht: Die Maßnahmen bleiben nötig, damit er satt wird und sich nicht stößt.' },
        ],
      },
      {
        id: 'schmerz', problem: 'Schulterschmerz links bei Hemiparese',
        ziel: 'Herr Demir gibt beim Transfer höchstens NRS 3 an.',
        erwartet: 'nein',
        beleg: 'Unter der Woche lag der Schmerz bei NRS 2 bis 3. Am Wochenende gab er nach Transfers wieder NRS 6 an. Das Ziel gilt für jeden Transfer, nicht nur für die meisten.',
        anpassungen: [
          { text: 'Schmerzmittel fest ansetzen lassen, damit der Transfer am Wochenende nicht mehr wehtut.', richtig: false, warum: 'Die Ursache ist bekannt: Zug am Arm. Ein Schmerzmittel deckt sie zu, statt sie abzustellen, und die Schulter wird weiter überdehnt.' },
          { text: 'Den gelähmten Arm ab jetzt dauerhaft in einer Armschlinge tragen lassen.', richtig: false, warum: 'Eine Schlinge über Stunden fördert Fehlhaltung und Versteifung. Ob und wann sie kurz beim Gehen hilft, legt die Therapie fest.' },
          { text: 'Absprache sichtbar machen (Hinweis am Bett und im Maßnahmenplan), Aushilfen vor dem Dienst einweisen, die Ehefrau für zu Hause anleiten.', richtig: true, warum: 'Der Schmerz kam bei Aushilfen, die die Absprache nicht kannten. Das Ziel wird erreicht, wenn wirklich alle den Arm stützen, auch zu Hause.' },
        ],
      },
      {
        id: 'diabetes', problem: 'Gefahr der Unterzuckerung bei Insulin und wechselnder Essmenge',
        ziel: 'Herr Demir misst den Blutzucker einhändig selbst, und die Werte vor den Mahlzeiten liegen zwischen 80 und 200 mg/dl.',
        erwartet: 'teilweise',
        beleg: 'Er misst selbst, Unterzuckerungen gab es nicht mehr. Zwei Werte über 250 mg/dl liegen aber außerhalb des Zielbereichs.',
        anpassungen: [
          { text: 'Insulin selbst wieder auf 20 IE erhöhen, damit die hohen Werte verschwinden.', richtig: false, warum: 'Die Dosis legt der Arzt fest. Zwei hohe Werte nach Gebäck sind ein Ernährungsthema, keine Grundlage für eine eigenmächtige Dosisänderung.' },
          { text: 'Ziel erweitern: Beratung beider zu Ernährung und Werten (Was tun über 250, was unter 70?), Hausarzt über die hohen Werte informieren, Messen und Spritzen für zu Hause klären.', richtig: true, warum: 'Teilweise erreicht heißt: Maßnahmen anpassen. Die Ehefrau hat das Gebäck mitgebracht, also gehört sie in die Beratung, und wer zu Hause spritzt, muss vor der Entlassung feststehen.' },
          { text: 'Der Ehefrau verbieten, Essen mitzubringen.', richtig: false, warum: 'Ein Verbot schafft Konflikte und lernt nichts für zu Hause, wo sie ohnehin gemeinsam essen. Beratung statt Verbot.' },
        ],
      },
    ],
    fazit: 'Vor einer Entlassung schaut die Evaluation nach vorn: Was trägt zu Hause, wer übernimmt was, und welche Ziele müssen in die Überleitung? Drei erreichte Ziele heißen nicht, dass nichts mehr zu tun ist.',
  },
  rueckblick: [
    { frage: 'Der Barthel-Index lag bei 40 Punkten. Welche Bereiche waren für die Rückkehr nach Hause entscheidend, und warum stand die Treppe trotz 0 Punkten nicht im ersten Ziel?', antwort: 'Transfer, Gehen und Treppe. Die Treppe kommt nach dem sicheren Aufstehen und Gehen; Ziele bauen aufeinander auf und müssen in der Zeit erreichbar sein.' },
    { frage: 'Woher kam der Schulterschmerz, und warum kam er am Wochenende zurück?', antwort: 'Vom Ziehen am schlaffen Arm beim Transfer. Den Arm stützen statt ziehen hilft nur, wenn alle es wissen; die Aushilfen am Wochenende kannten die Absprache nicht.' },
    { frage: 'Welche Zeilen der SIS haben die Unterzuckerung am sechsten Tag vorhergesagt?', antwort: 'Diabetes mit Insulin in TF3, die Essmenge mit Neglect und Schluckstörung in TF4 und die Risikomatrix „Sonstiges: Unterzuckerung“. Wer wenig isst und gleich viel Insulin bekommt, gerät in die Unterzuckerung.' },
    { frage: 'Warum fragt die SBAR-Empfehlung nach der Dosis und nicht nach einer Einweisung?', antwort: 'Die Unterzuckerung ist behoben, er ist klar und hat gegessen. Offen ist die Ursache: Dosis und Essmenge passen nicht zusammen. Das entscheidet der Hausarzt, bis zum Abend.' },
  ],
};
