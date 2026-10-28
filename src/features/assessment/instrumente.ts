// Assessment-Instrumente als Daten: Braden, Norton (erweitert), Barthel (Hamburger Einstufungsmanual),
// NRS, BESD, MNA-SF und Glasgow Coma Scale.
// Oben die Instrumente, unten reine Rechenfunktionen (testbar, ohne React).
//
// Die Stufentexte sind gekürzte Lehrbuchfassungen zum Üben. Grenzwerte unterscheiden sich je nach
// Lehrbuch und Einrichtung; maßgeblich sind das Original-Formular und der Hausstandard.

export type InstrumentId = 'braden' | 'norton' | 'barthel' | 'nrs' | 'besd' | 'mna' | 'gcs';

export interface Stufe { punkte: number; kurz: string; text?: string }

export interface Item {
  id: string;
  label: string;
  frage?: string;
  stufen: Stufe[];
  /** Ersetzt ein anderes Item, wenn dieses nicht erhoben werden kann (MNA: Wadenumfang statt BMI). */
  ersatzFuer?: string;
  /** Viele kurze Stufen nebeneinander statt einer Liste (NRS 0–10). */
  kompakt?: boolean;
}

export type Ton = 'ok' | 'mittel' | 'warn' | 'danger';
export interface Kategorie { id: string; label: string; min: number; max: number; ton: Ton; hinweis: string }

export interface Instrument {
  id: InstrumentId;
  name: string;
  kurz: string;
  zweck: string;
  /** Wie die Punkte zu lesen sind, z. B. „niedrig = hohes Risiko“. */
  richtung: string;
  topicIds: string[];
  items: Item[];
  kategorien: Kategorie[];
  hinweise: string[];
}

const BRADEN: Instrument = {
  id: 'braden', name: 'Braden-Skala', kurz: 'Braden',
  zweck: 'Einschätzung des Dekubitusrisikos in sechs Bereichen.',
  richtung: 'Je niedriger die Summe, desto höher das Risiko (6 bis 23 Punkte).',
  topicIds: ['thema.pro.dekubitus'],
  items: [
    { id: 'sensorik', label: 'Sensorisches Empfindungsvermögen', frage: 'Kann die Person auf druckbedingtes Unbehagen reagieren?', stufen: [
      { punkte: 1, kurz: 'Vollständig ausgefallen', text: 'Keine Reaktion auf Schmerzreize (z. B. bewusstlos, sediert) oder Empfinden fast am ganzen Körper gestört.' },
      { punkte: 2, kurz: 'Stark eingeschränkt', text: 'Reagiert nur auf Schmerzreize, kann Unbehagen nur durch Stöhnen oder Unruhe zeigen, oder Empfinden an mehr als der Hälfte des Körpers gestört.' },
      { punkte: 3, kurz: 'Leicht eingeschränkt', text: 'Reagiert auf Ansprache, kann Unbehagen aber nicht immer mitteilen, oder Empfinden an ein bis zwei Extremitäten gestört.' },
      { punkte: 4, kurz: 'Nicht eingeschränkt', text: 'Reagiert auf Ansprache, Empfinden ungestört, kann Schmerz und Unbehagen mitteilen.' },
    ] },
    { id: 'feuchtigkeit', label: 'Feuchtigkeit', frage: 'Wie stark ist die Haut Feuchtigkeit ausgesetzt?', stufen: [
      { punkte: 1, kurz: 'Ständig feucht', text: 'Haut fast immer feucht durch Schweiß oder Urin, Nässe bei jedem Bewegen oder Drehen.' },
      { punkte: 2, kurz: 'Oft feucht', text: 'Haut oft, aber nicht immer feucht. Wäsche muss mindestens einmal pro Schicht gewechselt werden.' },
      { punkte: 3, kurz: 'Manchmal feucht', text: 'Zusätzlicher Wäschewechsel etwa einmal am Tag.' },
      { punkte: 4, kurz: 'Selten feucht', text: 'Haut meist trocken, Wäschewechsel nur routinemäßig.' },
    ] },
    { id: 'aktivitaet', label: 'Aktivität', frage: 'Wie viel bewegt sich die Person körperlich (Ortswechsel)?', stufen: [
      { punkte: 1, kurz: 'Bettlägerig', text: 'Verlässt das Bett nicht.' },
      { punkte: 2, kurz: 'Sitzt auf', text: 'Kann kaum oder nicht gehen, trägt das eigene Gewicht nicht, braucht Hilfe in den (Roll-)Stuhl.' },
      { punkte: 3, kurz: 'Geht wenig', text: 'Geht tagsüber gelegentlich kurze Strecken, mit oder ohne Hilfe, verbringt die meiste Zeit im Bett oder Stuhl.' },
      { punkte: 4, kurz: 'Geht regelmäßig', text: 'Geht mindestens zweimal pro Schicht außerhalb des Zimmers und etwa alle zwei Stunden im Zimmer.' },
    ] },
    { id: 'mobilitaet', label: 'Mobilität', frage: 'Kann die Person ihre Körperposition selbst verändern?', stufen: [
      { punkte: 1, kurz: 'Komplett immobil', text: 'Verändert ohne Hilfe nicht einmal geringfügig die Position von Körper oder Extremitäten.' },
      { punkte: 2, kurz: 'Stark eingeschränkt', text: 'Verändert die Position gelegentlich und nur minimal, kann sich nicht regelmäßig allein ausreichend umlagern.' },
      { punkte: 3, kurz: 'Gering eingeschränkt', text: 'Verändert die Position häufig und selbstständig, aber nur geringfügig.' },
      { punkte: 4, kurz: 'Mobil', text: 'Verändert die Position häufig und deutlich ohne Hilfe.' },
    ] },
    { id: 'ernaehrung', label: 'Ernährung', frage: 'Wie isst die Person üblicherweise?', stufen: [
      { punkte: 1, kurz: 'Sehr schlechte Ernährung', text: 'Isst nie eine vollständige Mahlzeit, selten mehr als ein Drittel, trinkt wenig; oder nüchtern bzw. nur Infusion länger als 5 Tage.' },
      { punkte: 2, kurz: 'Mäßige Ernährung', text: 'Isst selten eine vollständige Mahlzeit, meist etwa die Hälfte, gelegentlich Ergänzungskost; oder zu wenig Sondenkost.' },
      { punkte: 3, kurz: 'Adäquate Ernährung', text: 'Isst mehr als die Hälfte der meisten Mahlzeiten; oder Sonden- bzw. parenterale Ernährung deckt den Bedarf.' },
      { punkte: 4, kurz: 'Gute Ernährung', text: 'Isst die Mahlzeiten meist vollständig, nie weniger als die Hälfte, isst auch zwischendurch, braucht keine Ergänzungskost.' },
    ] },
    { id: 'reibung', label: 'Reibung und Scherkräfte', frage: 'Schleift die Haut beim Bewegen über die Unterlage?', stufen: [
      { punkte: 1, kurz: 'Problem', text: 'Braucht viel Hilfe beim Bewegen, Anheben ohne Schleifen nicht möglich, rutscht oft nach unten; Spastik, Kontrakturen oder Unruhe.' },
      { punkte: 2, kurz: 'Potenzielles Problem', text: 'Bewegt sich etwas allein oder braucht wenig Hilfe, Haut schleift etwas, rutscht gelegentlich.' },
      { punkte: 3, kurz: 'Kein feststellbares Problem', text: 'Bewegt sich in Bett und Stuhl allein, kann sich vollständig anheben, behält die Position.' },
    ] },
  ],
  kategorien: [
    { id: 'sehr-hoch', label: 'Sehr hohes Risiko', min: 6, max: 9, ton: 'danger', hinweis: 'Engmaschige Hautinspektion, individueller Bewegungsplan, Weichlagerung bzw. Wechseldrucksystem prüfen.' },
    { id: 'hoch', label: 'Hohes Risiko', min: 10, max: 12, ton: 'danger', hinweis: 'Bewegungsplan mit festen Positionswechseln, druckverteilende Hilfsmittel, Haut und Ernährung beobachten.' },
    { id: 'mittel', label: 'Mittleres Risiko', min: 13, max: 14, ton: 'warn', hinweis: 'Eigenbewegung fördern, Positionswechsel planen, Hautinspektion regelmäßig.' },
    { id: 'gering', label: 'Geringes Risiko', min: 15, max: 18, ton: 'mittel', hinweis: 'Mobilität fördern, Risiko bei Veränderungen erneut einschätzen.' },
    { id: 'kein', label: 'Kein erhöhtes Risiko', min: 19, max: 23, ton: 'ok', hinweis: 'Nach der Skala kein Risiko. Klinischer Blick bleibt wichtig, z. B. nach langen OPs oder bei Schmerzen.' },
  ],
  hinweise: [
    'Die Skala ergänzt die fachliche Einschätzung (Hautinspektion, Mobilität), sie ersetzt sie nicht.',
    'Die Grenzwerte unterscheiden sich je nach Lehrbuch und Einrichtung. Hier: ≤ 18 Risiko, ≤ 12 hohes Risiko.',
  ],
};

const NORTON: Instrument = {
  id: 'norton', name: 'Norton-Skala (erweitert nach Bienstein)', kurz: 'Norton',
  zweck: 'Einschätzung des Dekubitusrisikos in neun Bereichen, ältere Alternative zur Braden-Skala.',
  richtung: 'Je niedriger die Summe, desto höher das Risiko (9 bis 36 Punkte).',
  topicIds: ['thema.pro.dekubitus'],
  items: [
    { id: 'kooperation', label: 'Bereitschaft zur Kooperation', frage: 'Wie motiviert ist die Person, bei der Prophylaxe mitzumachen?', stufen: [
      { punkte: 1, kurz: 'Keine' }, { punkte: 2, kurz: 'Teilweise' }, { punkte: 3, kurz: 'Wenig' }, { punkte: 4, kurz: 'Voll' },
    ] },
    { id: 'alter', label: 'Alter', stufen: [
      { punkte: 1, kurz: 'Über 60 Jahre' }, { punkte: 2, kurz: 'Unter 60 Jahre' }, { punkte: 3, kurz: 'Unter 30 Jahre' }, { punkte: 4, kurz: 'Unter 10 Jahre' },
    ] },
    { id: 'haut', label: 'Hautzustand', stufen: [
      { punkte: 1, kurz: 'Wunden, Allergie, Risse' }, { punkte: 2, kurz: 'Feucht' }, { punkte: 3, kurz: 'Schuppig, trocken' }, { punkte: 4, kurz: 'In Ordnung' },
    ] },
    { id: 'zusatz', label: 'Zusatzerkrankungen', stufen: [
      { punkte: 1, kurz: 'Arterielle Verschlusskrankheit' },
      { punkte: 2, kurz: 'MS, Karzinom, Adipositas', text: 'Multiple Sklerose, Krebserkrankung, erhöhter Hämatokrit, Adipositas.' },
      { punkte: 3, kurz: 'Abwehrschwäche, Fieber, Diabetes', text: 'Abwehrschwäche, Fieber, Diabetes mellitus, Anämie.' },
      { punkte: 4, kurz: 'Keine' },
    ] },
    { id: 'koerper', label: 'Körperlicher Zustand', stufen: [
      { punkte: 1, kurz: 'Sehr schlecht' }, { punkte: 2, kurz: 'Schlecht' }, { punkte: 3, kurz: 'Leidlich' }, { punkte: 4, kurz: 'Gut' },
    ] },
    { id: 'geist', label: 'Geistiger Zustand', stufen: [
      { punkte: 1, kurz: 'Stuporös', text: 'Kaum erweckbar, reagiert nur auf starke Reize.' },
      { punkte: 2, kurz: 'Verwirrt' }, { punkte: 3, kurz: 'Apathisch' }, { punkte: 4, kurz: 'Klar' },
    ] },
    { id: 'aktivitaet', label: 'Aktivität', stufen: [
      { punkte: 1, kurz: 'Bettlägerig' }, { punkte: 2, kurz: 'Rollstuhlbedürftig' }, { punkte: 3, kurz: 'Geht mit Hilfe' }, { punkte: 4, kurz: 'Geht ohne Hilfe' },
    ] },
    { id: 'beweglichkeit', label: 'Beweglichkeit', frage: 'Kann die Person ihre Lage im Bett selbst verändern?', stufen: [
      { punkte: 1, kurz: 'Voll eingeschränkt' }, { punkte: 2, kurz: 'Sehr eingeschränkt' }, { punkte: 3, kurz: 'Kaum eingeschränkt' }, { punkte: 4, kurz: 'Voll beweglich' },
    ] },
    { id: 'inkontinenz', label: 'Inkontinenz', stufen: [
      { punkte: 1, kurz: 'Urin und Stuhl' }, { punkte: 2, kurz: 'Meistens Urin' }, { punkte: 3, kurz: 'Manchmal' }, { punkte: 4, kurz: 'Keine' },
    ] },
  ],
  kategorien: [
    { id: 'hoch', label: 'Hohes Risiko', min: 9, max: 18, ton: 'danger', hinweis: 'Bewegungsplan mit festen Positionswechseln, druckverteilende Hilfsmittel, Haut bei jedem Positionswechsel kontrollieren.' },
    { id: 'risiko', label: 'Dekubitusgefahr', min: 19, max: 25, ton: 'warn', hinweis: 'Eigenbewegung fördern, Positionswechsel planen, Haut regelmäßig inspizieren.' },
    { id: 'kein', label: 'Kein erhöhtes Risiko', min: 26, max: 36, ton: 'ok', hinweis: 'Bei Veränderungen erneut einschätzen. Klinischer Blick bleibt wichtig.' },
  ],
  hinweise: [
    'Nach der erweiterten Norton-Skala besteht ab 25 Punkten und weniger Dekubitusgefahr. Die Grenze für „hohes Risiko“ (hier ≤ 18) ist eine verbreitete Orientierung, keine feste Norm.',
    'Das Alter gibt über 60 Jahren schon einen Risikopunkt, auch wenn sonst alles in Ordnung ist. Viele Einrichtungen nutzen deshalb inzwischen die Braden-Skala.',
  ],
};

const BARTHEL: Instrument = {
  id: 'barthel', name: 'Barthel-Index (Hamburger Manual)', kurz: 'Barthel',
  zweck: 'Selbstständigkeit bei zehn Alltagsaktivitäten. Bewertet wird, was die Person tatsächlich tut, nicht was sie könnte.',
  richtung: 'Je höher die Summe, desto selbstständiger (0 bis 100 Punkte, in Fünferschritten).',
  topicIds: ['thema.pp.anamnese', 'thema.ph.koerperpflege'],
  items: [
    { id: 'essen', label: 'Essen', stufen: [
      { punkte: 0, kurz: 'Erfüllt „5“ nicht', text: 'Kein selbstständiges Einnehmen und keine Magensonden- bzw. PEG-Ernährung.' },
      { punkte: 5, kurz: 'Mit Hilfe', text: 'Hilfe bei mundgerechter Vorbereitung, isst aber selbst; oder Hilfe bei der PEG-Beschickung bzw. -Versorgung.' },
      { punkte: 10, kurz: 'Selbstständig', text: 'Isst komplett selbstständig oder versorgt die PEG selbstständig.' },
    ] },
    { id: 'transfer', label: 'Aufsetzen und Umsetzen', frage: 'Vom Liegen im Bett in den (Roll-)Stuhl und zurück.', stufen: [
      { punkte: 0, kurz: 'Kein Transfer', text: 'Wird faktisch nicht aus dem Bett transferiert.' },
      { punkte: 5, kurz: 'Erhebliche Hilfe', text: 'Braucht erhebliche Hilfe (geschulte Laienhilfe oder professionelle Hilfe).' },
      { punkte: 10, kurz: 'Aufsicht oder geringe Hilfe', text: 'Braucht Aufsicht oder geringe Hilfe (ungeschulte Laienhilfe reicht).' },
      { punkte: 15, kurz: 'Selbstständig', text: 'Komplett selbstständig aus dem Liegen in den (Roll-)Stuhl und zurück.' },
    ] },
    { id: 'waschen', label: 'Sich waschen', stufen: [
      { punkte: 0, kurz: 'Erfüllt „5“ nicht' },
      { punkte: 5, kurz: 'Selbstständig', text: 'Vor Ort komplett selbstständig inklusive Zähneputzen, Rasieren und Frisieren.' },
    ] },
    { id: 'toilette', label: 'Toilettenbenutzung', stufen: [
      { punkte: 0, kurz: 'Keine Toilette', text: 'Benutzt faktisch weder Toilette noch Toilettenstuhl.' },
      { punkte: 5, kurz: 'Hilfe oder Aufsicht', text: 'Braucht vor Ort Hilfe oder Aufsicht bei Toilette bzw. Toilettenstuhl oder bei Spülung und Reinigung.' },
      { punkte: 10, kurz: 'Selbstständig', text: 'Nutzt Toilette oder Toilettenstuhl vor Ort komplett selbstständig inklusive Spülung und Reinigung.' },
    ] },
    { id: 'baden', label: 'Baden oder Duschen', stufen: [
      { punkte: 0, kurz: 'Erfüllt „5“ nicht' },
      { punkte: 5, kurz: 'Selbstständig', text: 'Badet oder duscht selbstständig inklusive Ein- und Ausstieg, sich reinigen und abtrocknen.' },
    ] },
    { id: 'gehen', label: 'Aufstehen und Gehen', stufen: [
      { punkte: 0, kurz: 'Erfüllt „5“ nicht' },
      { punkte: 5, kurz: 'Mit Hilfe oder Rollstuhl', text: 'Kommt mit Laienhilfe oder Gehwagen in den Stand und bewältigt Strecken im Wohnbereich; oder fährt im Wohnbereich komplett selbstständig Rollstuhl.' },
      { punkte: 10, kurz: 'Mit Gehwagen', text: 'Kommt ohne Aufsicht oder personelle Hilfe in den Stand und geht mindestens 50 m mit Gehwagen (Rollator).' },
      { punkte: 15, kurz: 'Ohne Gehwagen', text: 'Kommt ohne Aufsicht oder personelle Hilfe in den Stand und geht mindestens 50 m ohne Gehwagen (Stock oder Gehstützen erlaubt).' },
    ] },
    { id: 'treppe', label: 'Treppensteigen', stufen: [
      { punkte: 0, kurz: 'Erfüllt „5“ nicht' },
      { punkte: 5, kurz: 'Mit Aufsicht oder Laienhilfe', text: 'Steigt mit Aufsicht oder Laienhilfe mindestens ein Stockwerk hinauf und hinunter.' },
      { punkte: 10, kurz: 'Selbstständig', text: 'Steigt ohne Aufsicht oder personelle Hilfe mindestens ein Stockwerk hinauf und hinunter (Stock oder Geländer erlaubt).' },
    ] },
    { id: 'kleiden', label: 'An- und Auskleiden', stufen: [
      { punkte: 0, kurz: 'Erfüllt „5“ nicht' },
      { punkte: 5, kurz: 'Oberkörper selbst', text: 'Kleidet mindestens den Oberkörper in angemessener Zeit selbst an und aus, wenn die Sachen bereitliegen.' },
      { punkte: 10, kurz: 'Selbstständig', text: 'Zieht Tageskleidung, Schuhe und nötige Hilfsmittel (z. B. Kompressionsstrümpfe, Prothese) selbst an und aus.' },
    ] },
    { id: 'stuhl', label: 'Stuhlkontinenz', stufen: [
      { punkte: 0, kurz: 'Öfter inkontinent', text: 'Im Durchschnitt mehr als einmal pro Woche stuhlinkontinent.' },
      { punkte: 5, kurz: 'Selten inkontinent oder Hilfe', text: 'Höchstens einmal pro Woche stuhlinkontinent oder braucht Hilfe bei rektalen Abführmaßnahmen bzw. Stoma-Versorgung.' },
      { punkte: 10, kurz: 'Kontinent', text: 'Stuhlkontinent, ggf. selbstständig bei rektalen Abführmaßnahmen oder Stoma-Versorgung.' },
    ] },
    { id: 'harn', label: 'Harnkontinenz', stufen: [
      { punkte: 0, kurz: 'Öfter inkontinent', text: 'Im Durchschnitt mehr als einmal pro Tag harninkontinent.' },
      { punkte: 5, kurz: 'Überwiegend kompensiert oder Hilfe beim DK', text: 'Kompensiert selbstständig mit überwiegendem Erfolg (höchstens einmal pro Tag Einnässen) oder braucht Hilfe bei der Versorgung des Harnkatheters.' },
      { punkte: 10, kurz: 'Kontinent oder voll kompensiert', text: 'Harnkontinent oder versorgt Inkontinenz bzw. Dauerkatheter komplett selbstständig und erfolgreich.' },
    ] },
  ],
  kategorien: [
    { id: 'abhaengig', label: 'Weitgehend pflegeabhängig', min: 0, max: 30, ton: 'danger', hinweis: 'Umfassende Unterstützung in fast allen Alltagsaktivitäten.' },
    { id: 'hilfe', label: 'Hilfebedürftig', min: 35, max: 80, ton: 'warn', hinweis: 'Unterstützung in mehreren Bereichen; Ressourcen gezielt fördern.' },
    { id: 'selbst', label: 'Weitgehend selbstständig', min: 85, max: 100, ton: 'ok', hinweis: 'Höchstens punktuelle Hilfe nötig.' },
  ],
  hinweise: [
    'Es zählt, was die Person tatsächlich tut. „Könnte sie, macht es aber nicht“ gibt keine Punkte.',
    'Hilfsmittel sind erlaubt, wenn die Person sie selbst benutzt. Die Einteilung in drei Gruppen ist eine verbreitete Orientierung, keine feste Norm.',
  ],
};

const NRS_TEXT = ['kein Schmerz', '', '', '', '', '', '', '', '', '', 'stärkster vorstellbarer Schmerz'];
const NRS: Instrument = {
  id: 'nrs', name: 'Numerische Rating-Skala (NRS)', kurz: 'NRS',
  zweck: 'Selbsteinschätzung der Schmerzstärke von 0 bis 10. Vorrang, sobald die Person Auskunft geben kann.',
  richtung: 'Je höher der Wert, desto stärker der Schmerz.',
  topicIds: ['thema.beo.bewusstsein'],
  items: [
    { id: 'wert', label: 'Schmerzstärke', frage: 'Welche Zahl nennt die Person selbst?', kompakt: true,
      stufen: NRS_TEXT.map((t, i) => ({ punkte: i, kurz: String(i), text: t || undefined })) },
  ],
  kategorien: [
    { id: 'kein', label: 'Kein Schmerz', min: 0, max: 0, ton: 'ok', hinweis: 'Regelmäßig weiter erfassen, auch in Bewegung.' },
    { id: 'leicht', label: 'Leichter Schmerz', min: 1, max: 3, ton: 'mittel', hinweis: 'Fragen, ob die Situation für die Person akzeptabel ist.' },
    { id: 'mittel', label: 'Mittelstarker Schmerz', min: 4, max: 6, ton: 'warn', hinweis: 'Meist Handlungsbedarf: Maßnahmen nach Anordnung, Wirkung nach 30 bis 60 Minuten erneut erfassen.' },
    { id: 'stark', label: 'Starker Schmerz', min: 7, max: 10, ton: 'danger', hinweis: 'Zeitnah handeln und Ärztin oder Arzt informieren, Wirkung engmaschig kontrollieren.' },
  ],
  hinweise: [
    'Ruhe- und Belastungsschmerz getrennt erfragen und dokumentieren.',
    'Oft gelehrt: Handlungsbedarf ab Ruheschmerz über 3 bzw. Belastungsschmerz über 5. Entscheidend ist, ob die Schmerzsituation für die Person akzeptabel ist.',
  ],
};

const BESD: Instrument = {
  id: 'besd', name: 'BESD (Beurteilung von Schmerzen bei Demenz)', kurz: 'BESD',
  zweck: 'Fremdeinschätzung für Menschen mit Demenz, die keine Auskunft mehr geben können. Zwei Minuten beobachten, am besten in einer Aktivität und immer in derselben Situation.',
  richtung: 'Je höher die Summe, desto mehr Schmerzverhalten (0 bis 10 Punkte).',
  topicIds: ['thema.beo.bewusstsein', 'thema.kl.demenz'],
  items: [
    { id: 'atmung', label: 'Atmung (unabhängig von Lautäußerung)', stufen: [
      { punkte: 0, kurz: 'Normal' },
      { punkte: 1, kurz: 'Gelegentlich angestrengt', text: 'Gelegentlich angestrengt atmen, kurze Phasen schneller, tiefer Atmung (Hyperventilation).' },
      { punkte: 2, kurz: 'Lautstark angestrengt', text: 'Lautstark angestrengt atmen, lange Phasen von Hyperventilation, Cheyne-Stokes-Atmung.' },
    ] },
    { id: 'laut', label: 'Negative Lautäußerung', stufen: [
      { punkte: 0, kurz: 'Keine' },
      { punkte: 1, kurz: 'Gelegentlich', text: 'Gelegentlich stöhnen oder ächzen, sich leise negativ oder missbilligend äußern.' },
      { punkte: 2, kurz: 'Wiederholt', text: 'Wiederholt beunruhigt rufen, laut stöhnen oder ächzen, weinen.' },
    ] },
    { id: 'gesicht', label: 'Gesichtsausdruck', stufen: [
      { punkte: 0, kurz: 'Lächelnd oder nichtssagend' },
      { punkte: 1, kurz: 'Traurig, ängstlich', text: 'Trauriger, ängstlicher oder sorgenvoller Blick.' },
      { punkte: 2, kurz: 'Grimassieren' },
    ] },
    { id: 'koerper', label: 'Körpersprache', stufen: [
      { punkte: 0, kurz: 'Entspannt' },
      { punkte: 1, kurz: 'Angespannt', text: 'Angespannt, nervös hin und her gehen, nesteln.' },
      { punkte: 2, kurz: 'Starr, abwehrend', text: 'Starr, geballte Fäuste, angezogene Knie, sich entziehen oder wegstoßen, schlagen.' },
    ] },
    { id: 'trost', label: 'Trost', stufen: [
      { punkte: 0, kurz: 'Trösten nicht nötig' },
      { punkte: 1, kurz: 'Ablenken möglich', text: 'Ablenken oder Beruhigen durch Stimme oder Berührung möglich.' },
      { punkte: 2, kurz: 'Trösten nicht möglich', text: 'Trösten, Ablenken oder Beruhigen nicht möglich.' },
    ] },
  ],
  kategorien: [
    { id: 'unauffaellig', label: 'Kein Schmerzverhalten erkennbar', min: 0, max: 1, ton: 'mittel', hinweis: 'Schmerz ist damit nicht ausgeschlossen. Weiter beobachten, Angehörige fragen.' },
    { id: 'wahrscheinlich', label: 'Schmerzen wahrscheinlich', min: 2, max: 10, ton: 'danger', hinweis: 'Ab 2 Punkten Ursachen suchen, Maßnahmen einleiten bzw. ärztlich abklären und den Verlauf in derselben Situation erneut einschätzen.' },
  ],
  hinweise: [
    'Selbstauskunft hat Vorrang. Auch bei leichter Demenz zuerst die NRS oder eine Gesichterskala versuchen.',
    'Werte verschiedener Personen nicht miteinander vergleichen, nur den Verlauf bei derselben Person.',
  ],
};

const MNA: Instrument = {
  id: 'mna', name: 'Mini Nutritional Assessment, Kurzform (MNA-SF)', kurz: 'MNA-SF',
  zweck: 'Screening auf Mangelernährung bei älteren Menschen mit sechs Fragen. Bei Auffälligkeit folgt das vollständige MNA oder ein ausführliches Assessment.',
  richtung: 'Je niedriger die Summe, desto schlechter der Ernährungszustand (0 bis 14 Punkte).',
  topicIds: ['thema.pro.dehydratation', 'thema.beo.haut'],
  items: [
    { id: 'A', label: 'A · Nahrungsaufnahme', frage: 'Weniger gegessen in den letzten 3 Monaten (Appetitverlust, Verdauungsprobleme, Kau- oder Schluckprobleme)?', stufen: [
      { punkte: 0, kurz: 'Starke Abnahme' }, { punkte: 1, kurz: 'Leichte Abnahme' }, { punkte: 2, kurz: 'Keine Abnahme' },
    ] },
    { id: 'B', label: 'B · Gewichtsverlust', frage: 'Gewichtsverlust in den letzten 3 Monaten?', stufen: [
      { punkte: 0, kurz: 'Mehr als 3 kg' }, { punkte: 1, kurz: 'Nicht bekannt' }, { punkte: 2, kurz: '1 bis 3 kg' }, { punkte: 3, kurz: 'Kein Gewichtsverlust' },
    ] },
    { id: 'C', label: 'C · Mobilität', stufen: [
      { punkte: 0, kurz: 'Bettlägerig oder im Stuhl mobilisiert' },
      { punkte: 1, kurz: 'Steht auf, verlässt die Wohnung aber nicht' },
      { punkte: 2, kurz: 'Verlässt die Wohnung' },
    ] },
    { id: 'D', label: 'D · Akute Krankheit oder Stress', frage: 'Akute Krankheit oder psychischer Stress in den letzten 3 Monaten?', stufen: [
      { punkte: 0, kurz: 'Ja' }, { punkte: 2, kurz: 'Nein' },
    ] },
    { id: 'E', label: 'E · Neuropsychologische Probleme', stufen: [
      { punkte: 0, kurz: 'Schwere Demenz oder Depression' }, { punkte: 1, kurz: 'Leichte Demenz' }, { punkte: 2, kurz: 'Keine' },
    ] },
    { id: 'F1', label: 'F1 · Body-Mass-Index', frage: 'BMI = Gewicht in kg ÷ (Größe in m)²', stufen: [
      { punkte: 0, kurz: 'Unter 19' }, { punkte: 1, kurz: '19 bis unter 21' }, { punkte: 2, kurz: '21 bis unter 23' }, { punkte: 3, kurz: '23 und mehr' },
    ] },
    { id: 'F2', label: 'F2 · Wadenumfang', frage: 'Nur wenn kein BMI bestimmt werden kann.', ersatzFuer: 'F1', stufen: [
      { punkte: 0, kurz: 'Unter 31 cm' }, { punkte: 3, kurz: '31 cm und mehr' },
    ] },
  ],
  kategorien: [
    { id: 'mangel', label: 'Mangelernährung', min: 0, max: 7, ton: 'danger', hinweis: 'Ärztin oder Arzt und ggf. Ernährungsfachkraft einbeziehen, Ursachen klären, Ernährungsplan und Gewichtskontrollen.' },
    { id: 'risiko', label: 'Risiko für Mangelernährung', min: 8, max: 11, ton: 'warn', hinweis: 'Vollständiges MNA oder ausführliches Assessment, Ess- und Trinkprotokoll, Gewicht regelmäßig kontrollieren.' },
    { id: 'normal', label: 'Normaler Ernährungszustand', min: 12, max: 14, ton: 'ok', hinweis: 'Screening in regelmäßigen Abständen und bei Veränderungen wiederholen.' },
  ],
  hinweise: [
    'Eine Operation oder akute Erkrankung in den letzten 3 Monaten zählt bei D als „ja“, auch wenn es der Person inzwischen gut geht.',
    'F2 (Wadenumfang) nur verwenden, wenn kein BMI bestimmt werden kann, z. B. ohne Bettwaage.',
  ],
};

const GCS: Instrument = {
  id: 'gcs', name: 'Glasgow Coma Scale (GCS)', kurz: 'GCS',
  zweck: 'Einschätzung der Bewusstseinslage über Augenöffnen, verbale Reaktion und Motorik. Es zählt jeweils die beste Reaktion.',
  richtung: 'Je niedriger die Summe, desto tiefer die Bewusstseinsstörung (3 bis 15 Punkte).',
  topicIds: ['thema.beo.bewusstsein', 'thema.beo.notfall', 'thema.kl.neuro.schlaganfall'],
  items: [
    { id: 'augen', label: 'Augenöffnen', stufen: [
      { punkte: 1, kurz: 'Keine Reaktion' },
      { punkte: 2, kurz: 'Auf Schmerzreiz' },
      { punkte: 3, kurz: 'Auf Ansprache', text: 'Öffnet die Augen erst, wenn man sie anspricht oder laut ruft.' },
      { punkte: 4, kurz: 'Spontan' },
    ] },
    { id: 'verbal', label: 'Verbale Reaktion', stufen: [
      { punkte: 1, kurz: 'Keine Reaktion' },
      { punkte: 2, kurz: 'Unverständliche Laute', text: 'Stöhnen oder Brummen, keine Wörter.' },
      { punkte: 3, kurz: 'Inadäquate Wörter', text: 'Einzelne Wörter ohne Zusammenhang, kein Gespräch möglich.' },
      { punkte: 4, kurz: 'Verwirrt', text: 'Spricht in Sätzen, aber zeitlich, örtlich oder zur Situation desorientiert.' },
      { punkte: 5, kurz: 'Orientiert', text: 'Kennt Name, Ort, Zeit und Situation.' },
    ] },
    { id: 'motorik', label: 'Motorische Reaktion', stufen: [
      { punkte: 1, kurz: 'Keine Reaktion' },
      { punkte: 2, kurz: 'Strecksynergismen', text: 'Streckt Arme und Beine auf Schmerzreiz (Strecken).' },
      { punkte: 3, kurz: 'Beugesynergismen', text: 'Beugt die Arme abnorm auf Schmerzreiz.' },
      { punkte: 4, kurz: 'Ungezielte Abwehr', text: 'Zieht die Extremität auf Schmerzreiz zurück, ohne den Reiz zu lokalisieren.' },
      { punkte: 5, kurz: 'Gezielte Abwehr', text: 'Greift gezielt zum Ort des Schmerzreizes und wehrt ihn ab.' },
      { punkte: 6, kurz: 'Befolgt Aufforderungen', text: 'Führt Aufforderungen aus, z. B. „Drücken Sie meine Hand“.' },
    ] },
  ],
  kategorien: [
    { id: 'schwer', label: 'Schwere Bewusstseinsstörung', min: 3, max: 8, ton: 'danger', hinweis: 'Notfall: Notruf bzw. Notfallteam, Atemweg sichern (Schutzreflexe oft beeinträchtigt), stabile Seitenlage, Vitalzeichen engmaschig.' },
    { id: 'mittel', label: 'Mittelschwere Bewusstseinsstörung', min: 9, max: 12, ton: 'danger', hinweis: 'Sofort ärztlich abklären, nicht allein lassen, Vitalzeichen und Blutzucker kontrollieren.' },
    { id: 'leicht', label: 'Leichte Bewusstseinsstörung', min: 13, max: 14, ton: 'warn', hinweis: 'Ursache klären (z. B. Blutzucker, Fieber, Medikamente), ärztlich informieren und Verlauf engmaschig erneut einschätzen.' },
    { id: 'klar', label: 'Bewusstseinsklar', min: 15, max: 15, ton: 'ok', hinweis: 'Bei Veränderungen erneut einschätzen.' },
  ],
  hinweise: [
    'Immer die beste Reaktion werten, bei Seitenunterschied die bessere Seite. Den Verlauf (z. B. von 14 auf 11) zu erkennen ist wichtiger als der Einzelwert.',
    'Bei Intubation, Aphasie oder Schwellung der Augen ist ein Teilbereich nicht beurteilbar. Dann die drei Teilwerte einzeln dokumentieren (z. B. A3 V– M6).',
  ],
};

export const INSTRUMENTE: Record<InstrumentId, Instrument> = { braden: BRADEN, norton: NORTON, barthel: BARTHEL, nrs: NRS, besd: BESD, mna: MNA, gcs: GCS };

// ---------------------------------------------------------------- Rechnen

export type Werte = Partial<Record<string, number>>;

/** Die Items, die mit der gewählten Ersatz-Variante erhoben werden (MNA: F1 oder F2). */
export function aktiveItems(instr: Instrument, ersatz: ReadonlySet<string> = new Set()): Item[] {
  const ersetzt = new Set(instr.items.filter((i) => i.ersatzFuer && ersatz.has(i.id)).map((i) => i.ersatzFuer!));
  return instr.items.filter((i) => (i.ersatzFuer ? ersatz.has(i.id) : !ersetzt.has(i.id)));
}

export function summe(items: Item[], werte: Werte): number {
  return items.reduce((s, i) => s + (werte[i.id] ?? 0), 0);
}

export function vollstaendig(items: Item[], werte: Werte): boolean {
  return items.every((i) => werte[i.id] !== undefined);
}

export function minMax(instr: Instrument): { min: number; max: number } {
  const items = aktiveItems(instr);
  return {
    min: items.reduce((s, i) => s + Math.min(...i.stufen.map((x) => x.punkte)), 0),
    max: items.reduce((s, i) => s + Math.max(...i.stufen.map((x) => x.punkte)), 0),
  };
}

export function kategorie(instr: Instrument, punkte: number): Kategorie | undefined {
  return instr.kategorien.find((k) => punkte >= k.min && punkte <= k.max);
}

/** BMI aus Gewicht (kg) und Größe (cm), eine Nachkommastelle. */
export function bmi(kg: number, cm: number): number | null {
  if (!(kg > 0) || !(cm > 0)) return null;
  return Math.round((kg / (cm / 100) ** 2) * 10) / 10;
}

/** MNA-Punkte für einen BMI. */
export function bmiPunkte(wert: number): number {
  return wert < 19 ? 0 : wert < 21 ? 1 : wert < 23 ? 2 : 3;
}
