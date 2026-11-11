// Hygiene-Trainer: Aufgaben und Kurzwissen.
// Grundlage: KRINKO-Empfehlungen (Händehygiene 2016, Infektionsprävention bei MRE),
// Aktion Saubere Hände (5 Indikationen nach WHO), TRBA 250, RKI-Ratgeber zu den Erregern.
// Einrichtungen können abweichende Hygienepläne haben: Die App sagt das auf der Seite.

import { mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';

export const HYGIENE_THEMA = 'thema.ph.hygiene';
const T = [HYGIENE_THEMA];

export type BereichId = 'momente' | 'psa' | 'erreger' | 'basis';

export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

// ---------------------------------------------------------------- 5 Momente

export const MOMENTE = [
  'Vor Patientenkontakt',
  'Vor aseptischen Tätigkeiten',
  'Nach Kontakt mit potenziell infektiösen Materialien',
  'Nach Patientenkontakt',
  'Nach Kontakt mit der unmittelbaren Patientenumgebung',
] as const;

function moment(id: string, frage: string, richtig: 0 | 1 | 2 | 3 | 4, warum: string): AuswahlAufgabe {
  return {
    id: `momente.${id}`, art: 'auswahl', topicIds: T, titel: '5 Momente der Händedesinfektion',
    frage: `${frage} Welche Indikation zur Händedesinfektion liegt vor?`,
    optionen: [...MOMENTE], richtig: [richtig], mehrfach: false,
    erklaerung: [`Indikation ${richtig + 1}: ${MOMENTE[richtig]}.`, warum],
  };
}

const momente: Aufgabe[] = [
  moment('begruessung', 'Du betrittst das Zimmer und gibst Frau K. zur Begrüßung die Hand.', 0, 'Händedesinfektion schützt hier die Patientin vor Erregern, die du an den Händen mitbringst.'),
  moment('mobilisation', 'Du willst Herrn S. vom Bett in den Stuhl mobilisieren.', 0, 'Direkter Körperkontakt beginnt: vorher desinfizieren.'),
  moment('zvk', 'Du bereitest die Kurzinfusion vor und schließt sie gleich am zentralen Venenkatheter an.', 1, 'Eingriffe an Zugängen sind aseptische Tätigkeiten. Desinfiziert wird unmittelbar davor, nicht schon beim Betreten des Zimmers.'),
  moment('mundpflege', 'Du beginnst bei Frau M. mit der Mundpflege.', 1, 'Kontakt mit Schleimhäuten zählt zu den aseptischen Tätigkeiten.'),
  moment('absaugen', 'Du saugst Herrn T. endotracheal ab.', 1, 'Absaugen ist eine aseptische Tätigkeit: erst desinfizieren, dann sterile Handschuhe oder steriler Katheter nach Standard.'),
  moment('augentropfen', 'Du verabreichst Augentropfen.', 1, 'Kontakt mit der Bindehaut ist Schleimhautkontakt, also aseptische Tätigkeit.'),
  moment('urinbeutel', 'Du hast den Urinbeutel entleert und ziehst die Handschuhe aus.', 2, 'Nach Kontakt mit Urin (potenziell infektiös) desinfizieren, auch wenn Handschuhe getragen wurden.'),
  moment('verband', 'Du hast einen durchfeuchteten Wundverband entfernt und die Handschuhe abgelegt.', 2, 'Wundsekret ist potenziell infektiös. Handschuhe ersetzen die Händedesinfektion nicht.'),
  moment('erbrochenes', 'Du hast die Nierenschale mit Erbrochenem entsorgt.', 2, 'Erbrochenes ist potenziell infektiöses Material.'),
  moment('blutdruck', 'Du hast den Blutdruck gemessen und gehst zum nächsten Patienten.', 3, 'Nach dem Patientenkontakt schützt die Händedesinfektion dich und die nächsten Patienten.'),
  moment('puls', 'Du hast den Puls getastet und verlässt das Zimmer.', 3, 'Auch kurzer Hautkontakt ist Patientenkontakt.'),
  moment('nachttisch', 'Du hast nur den Nachttisch abgeräumt und die Klingel umgehängt. Die Patientin hast du nicht berührt.', 4, 'Die unmittelbare Umgebung (Bett, Nachttisch, Klingel, Infusionspumpe) ist mit den Erregern des Patienten besiedelt.'),
  moment('pumpe', 'Du hast an der Infusionspumpe die Laufrate verstellt, ohne den Patienten zu berühren.', 4, 'Geräte direkt am Bett gehören zur unmittelbaren Patientenumgebung.'),
];

// ---------------------------------------------------------------- Schutzausrüstung

const psa: Aufgabe[] = [
  {
    id: 'psa.anlegen', art: 'reihenfolge', topicIds: T, titel: 'Schutzausrüstung anlegen',
    frage: 'Du gehst zu einem Patienten mit Influenza in das Isolierzimmer. In welcher Reihenfolge legst du die Schutzausrüstung an?',
    schritte: ['Hände desinfizieren', 'Schutzkittel anziehen', 'Mund-Nasen-Schutz oder FFP2-Maske aufsetzen', 'Schutzbrille aufsetzen', 'Handschuhe anziehen (über die Kittelbündchen)'],
    erklaerung: [
      'Von „sauber“ zu „am nächsten am Patienten“: Kittel zuerst, Handschuhe zuletzt, damit sie die Bündchen des Kittels abdecken.',
      'Die Maske sitzt vor der Brille, damit die Brille die Maske nicht verschiebt. Der Hygieneplan deiner Einrichtung kann abweichen.',
    ],
  },
  {
    id: 'psa.ablegen', art: 'reihenfolge', topicIds: T, titel: 'Schutzausrüstung ablegen',
    frage: 'Du verlässt das Isolierzimmer. In welcher Reihenfolge legst du die Schutzausrüstung ab?',
    schritte: ['Handschuhe ausziehen', 'Hände desinfizieren', 'Schutzkittel ablegen (Außenseite nach innen rollen)', 'Schutzbrille am Bügel abnehmen', 'Maske an den Bändern abnehmen', 'Hände erneut desinfizieren'],
    erklaerung: [
      'Das am stärksten Verschmutzte zuerst: Handschuhe. Danach sind die Hände desinfiziert, bevor sie Kittel, Brille und Maske anfassen.',
      'Brille und Maske nur an Bügeln und Bändern anfassen, die Vorderseite gilt als kontaminiert. Zum Schluss immer Händedesinfektion.',
    ],
  },
  {
    id: 'psa.einreiben', art: 'reihenfolge', topicIds: T, titel: 'Händedesinfektion durchführen',
    frage: 'Wie läuft die hygienische Händedesinfektion ab?',
    schritte: ['Hände trocken, ohne Schmuck', 'Hohle Hand mit Desinfektionsmittel füllen', 'Alle Hautpartien einreiben, besonders Fingerkuppen und Daumen', 'Hände während der ganzen Einwirkzeit (meist 30 Sekunden) feucht halten', 'Hände an der Luft trocknen lassen'],
    erklaerung: [
      'Eine feste Schrittfolge ist nicht vorgeschrieben (eigenverantwortliches Einreiben), entscheidend ist: alle Flächen benetzt, Einwirkzeit nach Herstellerangabe.',
      'Fingerkuppen und Daumen werden am häufigsten vergessen und haben den meisten Patientenkontakt.',
    ],
  },
  {
    id: 'psa.handschuhe-ersetzen', art: 'auswahl', topicIds: T, titel: 'Schutzausrüstung',
    frage: 'Ersetzen Einmalhandschuhe die Händedesinfektion?',
    optionen: ['Nein, nach dem Ausziehen wird desinfiziert', 'Ja, wenn die Handschuhe unbeschädigt sind', 'Nur bei sterilen Handschuhen', 'Ja, wenn man sie nur kurz getragen hat'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Handschuhe haben Mikroperforationen und Hände werden beim Ausziehen kontaminiert. Deshalb nach dem Ablegen immer Händedesinfektion.'],
  },
  {
    id: 'psa.wann-kittel', art: 'auswahl', topicIds: T, titel: 'Schutzausrüstung',
    frage: 'Wann trägst du bei der Standardhygiene eine Schutzschürze oder einen Schutzkittel?',
    optionen: ['Wenn die Kleidung mit Blut, Sekreten oder Ausscheidungen in Kontakt kommen kann', 'Bei jedem Patientenkontakt', 'Nur bei bekannten MRE-Patienten', 'Nur im OP'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Standardhygiene gilt bei allen Patienten. Kittel oder Schürze schützen die Kleidung immer dann, wenn eine Kontamination zu erwarten ist, etwa bei Körperpflege mit Ausscheidungen.'],
  },
  {
    id: 'psa.ffp2', art: 'auswahl', topicIds: T, titel: 'Schutzausrüstung',
    frage: 'Bei welchem Erreger brauchst du als Atemschutz mindestens eine FFP2-Maske statt eines Mund-Nasen-Schutzes?',
    optionen: ['Offene Lungentuberkulose', 'MRSA in einer Wunde', 'Clostridioides difficile', 'Hepatitis B'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Tuberkulose wird aerogen über Tröpfchenkerne übertragen, die lange in der Luft schweben. Ein Mund-Nasen-Schutz filtert sie nicht sicher.'],
  },
];

// ---------------------------------------------------------------- Erreger und Isolierung

const WEGE = ['Kontakt (direkt und über Hände und Flächen)', 'Tröpfchen', 'Aerogen (Tröpfchenkerne, Luft)', 'Blut und Körperflüssigkeiten (Stich- und Schnittverletzung)'] as const;

function weg(id: string, erreger: string, richtig: number, warum: string[]): AuswahlAufgabe {
  return {
    id: `erreger.${id}.weg`, art: 'auswahl', topicIds: T, titel: `Erreger: ${erreger}`,
    frage: `Auf welchem Weg wird ${erreger} im Krankenhaus hauptsächlich übertragen?`,
    optionen: [...WEGE], richtig: [richtig], mehrfach: false, erklaerung: warum,
  };
}

const erreger: Aufgabe[] = [
  weg('mrsa', 'MRSA', 0, ['MRSA wird vor allem über die Hände des Personals und über Flächen übertragen. Wichtigste Maßnahme ist die konsequente Händedesinfektion.']),
  weg('influenza', 'Influenza', 1, ['Influenza wird über Tröpfchen beim Husten, Niesen und Sprechen übertragen, zusätzlich über Hände. Schutz: Mund-Nasen-Schutz, Abstand, Händehygiene.']),
  weg('tbc', 'offene Lungentuberkulose', 2, ['Tuberkulose wird aerogen übertragen. Einzelzimmer mit geschlossener Tür, Personal mindestens FFP2, Patient trägt beim Transport einen Mund-Nasen-Schutz.']),
  weg('hbv', 'Hepatitis B', 3, ['Hepatitis B wird über Blut übertragen. Schutz: Standardhygiene, kein Recapping, Abwurfbehälter, Impfung. Eine Isolierung ist nicht nötig.']),
  weg('noro', 'Norovirus', 0, ['Norovirus wird fäkal-oral über Kontakt übertragen, beim schwallartigen Erbrechen zusätzlich über Tröpfchen. Schon wenige Viren reichen für eine Infektion.']),
  {
    id: 'erreger.cdiff.haende', art: 'auswahl', topicIds: T, titel: 'Erreger: Clostridioides difficile',
    frage: 'Was ist bei Clostridioides difficile an der Händehygiene besonders?',
    optionen: ['Nach der Händedesinfektion zusätzlich Hände waschen, weil Alkohol die Sporen nicht abtötet', 'Händedesinfektion ist hier überflüssig', 'Es reicht, Handschuhe zu tragen', 'Hände nur mit kaltem Wasser abspülen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['C. difficile bildet Sporen, gegen die alkoholische Händedesinfektionsmittel nicht wirken. Händewaschen entfernt sie mechanisch.', 'Für Flächen braucht es ein sporozid wirksames Mittel (z. B. auf Peressigsäure-Basis).'],
  },
  {
    id: 'erreger.noro.mittel', art: 'auswahl', topicIds: T, titel: 'Erreger: Norovirus',
    frage: 'Welches Desinfektionsmittel ist bei Norovirus nötig?',
    optionen: ['Ein viruzides oder „begrenzt viruzid PLUS“ wirksames Mittel', 'Jedes Händedesinfektionsmittel auf Alkoholbasis', 'Ein nur bakterizides Mittel', 'Kein Mittel, Händewaschen reicht'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Noroviren sind unbehüllt und gegen viele Mittel unempfindlich. Nötig ist ein Präparat mit nachgewiesener Wirksamkeit gegen Noroviren.'],
  },
  {
    id: 'erreger.noro.dauer', art: 'auswahl', topicIds: T, titel: 'Erreger: Norovirus',
    frage: 'Wie lange bleibt eine Patientin mit Norovirus-Gastroenteritis mindestens isoliert?',
    optionen: ['Bis mindestens 48 Stunden nach Ende von Erbrechen und Durchfall', 'Bis zum ersten geformten Stuhl', '24 Stunden nach Aufnahme', 'Bis zur Entlassung, immer'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Nach dem Abklingen der Symptome werden noch Viren ausgeschieden. Empfohlen sind mindestens 48 Stunden nach Symptomende, dein Hygieneplan kann länger vorsehen.'],
  },
  {
    id: 'erreger.mrgn', art: 'auswahl', topicIds: T, titel: 'Erreger: multiresistente gramnegative Erreger',
    frage: 'Wo wird nach KRINKO ein Patient mit 4MRGN isoliert?',
    optionen: ['In allen Bereichen des Krankenhauses', 'Nur auf Intensivstationen', 'Nur bei Durchfall', 'Gar nicht, Standardhygiene reicht'],
    richtig: [0], mehrfach: false,
    erklaerung: ['4MRGN (resistent gegen alle vier Antibiotikagruppen): Isolierung in allen Bereichen. 3MRGN: Isolierung in Risikobereichen wie Intensiv- oder Hämatologiestationen.'],
  },
  {
    id: 'erreger.mrsa.massnahmen', art: 'auswahl', topicIds: T, titel: 'Erreger: MRSA',
    frage: 'Welche Maßnahmen gehören bei einem Patienten mit MRSA zur Kontaktisolierung? Wähle alle zutreffenden.',
    optionen: ['Schutzkittel und Handschuhe bei direktem Kontakt', 'Händedesinfektion nach Ablegen der Handschuhe', 'Patientenbezogene Nutzung von Pflegeutensilien wie Stethoskop und Blutdruckmanschette', 'Grundsätzlich FFP3-Maske für alle Besucher', 'Verzicht auf jede Mobilisation außerhalb des Bettes'],
    richtig: [0, 1, 2], mehrfach: true,
    erklaerung: ['MRSA wird über Kontakt übertragen: Kittel, Handschuhe, Händedesinfektion und eigene Utensilien im Zimmer.', 'Ein Mund-Nasen-Schutz kann bei nasaler Besiedlung oder Tätigkeiten mit Aerosolbildung sinnvoll sein, FFP3 für Besucher nicht. Mobilisation bleibt wichtig.'],
  },
  {
    id: 'erreger.varizellen', art: 'auswahl', topicIds: T, titel: 'Erreger: Varizellen',
    frage: 'Wer darf eine Patientin mit Windpocken (Varizellen) versorgen?',
    optionen: ['Nur Personal mit nachgewiesener Immunität (Impfung oder durchgemachte Erkrankung)', 'Jede Pflegekraft mit FFP2-Maske', 'Nur Schwangere, weil sie Antikörper bilden', 'Jede Pflegekraft mit Handschuhen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Varizellen sind hochansteckend und werden aerogen und über Kontakt übertragen. Nicht immunes Personal und Schwangere sollen nicht eingesetzt werden.'],
  },
];

// ---------------------------------------------------------------- Basishygiene

const basis: Aufgabe[] = [
  {
    id: 'basis.einwirkzeit', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Wie lange dauert die hygienische Händedesinfektion bei den meisten Präparaten?',
    optionen: ['30 Sekunden (nach Herstellerangabe)', '5 Sekunden', '3 Minuten', 'Bis die Hände trocken gerieben sind, egal wie lange'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Die meisten Händedesinfektionsmittel brauchen 30 Sekunden Einwirkzeit, in denen die Hände durchgehend feucht sein müssen. Maßgeblich ist die Herstellerangabe.'],
  },
  {
    id: 'basis.schmuck', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Was ist an Händen und Unterarmen bei Tätigkeiten mit Händedesinfektion erlaubt? Wähle alle zutreffenden.',
    optionen: ['Kurze, rund geschnittene Naturnägel', 'Eheringe', 'Armbanduhr', 'Künstliche oder gegelte Fingernägel', 'Stoffarmband'],
    richtig: [0], mehrfach: true,
    erklaerung: ['Nach TRBA 250 und KRINKO keine Schmuckstücke, Ringe (auch keine Eheringe), Armbänder und Uhren an Händen und Unterarmen, keine künstlichen Nägel.', 'Unter Ringen und künstlichen Nägeln bleiben Erreger, die Desinfektion erreicht sie nicht.'],
  },
  {
    id: 'basis.recapping', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Wie entsorgst du eine benutzte Kanüle nach einer s. c.-Injektion?',
    optionen: ['Ohne Schutzkappe direkt in den durchstichsicheren Abwurfbehälter', 'Schutzkappe vorsichtig mit beiden Händen aufsetzen', 'Abknicken und in den Restmüll', 'Im Nierenschälchen sammeln und später entsorgen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Recapping ist nach TRBA 250 verboten, weil es eine häufige Ursache für Stichverletzungen ist. Abwurfbehälter in Reichweite bringen.'],
  },
  {
    id: 'basis.waschen', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Wann wäschst du die Hände, statt sie nur zu desinfizieren?',
    optionen: ['Bei sichtbarer Verschmutzung', 'Vor jeder aseptischen Tätigkeit', 'Nach jedem Patientenkontakt', 'Nie, Waschen ist im Stationsalltag nicht vorgesehen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Desinfektion wirkt besser und schont die Haut mehr als häufiges Waschen. Gewaschen wird bei sichtbarer Verschmutzung, zum Dienstbeginn, nach dem Toilettengang und bei Sporenbildnern wie C. difficile.'],
  },
  {
    id: 'basis.nosokomial', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Was ist eine nosokomiale Infektion?',
    optionen: [
      'Eine Infektion, die im Zusammenhang mit einer medizinischen Maßnahme erworben wurde und bei Aufnahme weder bestand noch in Inkubation war',
      'Jede Infektion, die ein Patient im Krankenhaus hat',
      'Eine Infektion durch multiresistente Erreger',
      'Eine Infektion, die vom Patienten auf das Personal übergeht',
    ],
    richtig: [0], mehrfach: false,
    erklaerung: ['So definiert es § 2 Nr. 8 Infektionsschutzgesetz. Eine schon bei Aufnahme bestehende Pneumonie ist also nicht nosokomial.'],
  },
  {
    id: 'basis.flaechen', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Wie desinfizierst du den Nachttisch nach der Entlassung?',
    optionen: ['Wischdesinfektion mit dem vorgeschriebenen Mittel und der Konzentration aus dem Hygieneplan', 'Sprühdesinfektion, weil sie gleichmäßiger ist', 'Mit klarem Wasser feucht abwischen', 'Händedesinfektionsmittel aufsprühen'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Wischen entfernt Erreger zusätzlich mechanisch. Sprühen nur dort, wo Wischen nicht möglich ist, weil Aerosole entstehen und Flächen ungleichmäßig benetzt werden.'],
  },
  {
    id: 'basis.katheter', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Was beugt bei einem transurethralen Blasenkatheter einer Harnwegsinfektion vor? Wähle alle zutreffenden.',
    optionen: ['Geschlossenes Ableitungssystem nicht unnötig öffnen', 'Beutel immer unter Blasenniveau, ohne Bodenkontakt', 'Täglich prüfen, ob der Katheter noch nötig ist', 'Katheter routinemäßig täglich anspülen', 'Beutel zum Entleeren auf den Boden stellen'],
    richtig: [0, 1, 2], mehrfach: true,
    erklaerung: ['Jeder Tag mit Katheter erhöht das Infektionsrisiko, deshalb die Indikation täglich prüfen.', 'Routinemäßiges Spülen öffnet das System und ist nicht empfohlen. Rückfluss und Bodenkontakt vermeiden.'],
  },
  {
    id: 'basis.bereichskleidung', art: 'auswahl', topicIds: T, titel: 'Basishygiene',
    frage: 'Wann wechselst du deine Dienstkleidung?',
    optionen: ['Täglich und sofort bei sichtbarer Verschmutzung', 'Einmal pro Woche', 'Nur nach Kontakt mit MRE-Patienten', 'Wenn sie nach Schweiß riecht'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Dienstkleidung wird mindestens täglich gewechselt, bei Kontamination sofort. Sie wird von der Einrichtung aufbereitet, nicht zu Hause gewaschen.'],
  },
];

export const BEREICHE: Bereich[] = [
  {
    id: 'momente', label: '5 Momente', kurz: 'Situationen der passenden Indikation zuordnen',
    wissen: [
      ...MOMENTE.map((m, i) => `${i + 1}. ${m}`),
      'Merksatz: 1 und 2 schützen den Patienten, 3, 4 und 5 schützen dich und die Umgebung.',
    ],
  },
  {
    id: 'psa', label: 'Schutzausrüstung', kurz: 'An- und Ablegen, Handschuhe, Atemschutz',
    wissen: [
      'Anlegen: Händedesinfektion, Kittel, Maske, Brille, Handschuhe.',
      'Ablegen: Handschuhe, Händedesinfektion, Kittel, Brille, Maske, Händedesinfektion.',
      'Handschuhe ersetzen die Händedesinfektion nicht.',
    ],
  },
  {
    id: 'erreger', label: 'Erreger und Isolierung', kurz: 'Übertragungswege und Maßnahmen bei MRSA, MRGN, Noro, C. difficile, Tbc',
    wissen: [
      'Kontakt: MRSA, MRGN, Norovirus, C. difficile. Tröpfchen: Influenza. Aerogen: Tuberkulose, Varizellen, Masern. Blut: Hepatitis B und C, HIV.',
      'Alkohol wirkt nicht gegen Sporen (C. difficile): zusätzlich Hände waschen.',
      'Noroviren: viruzid wirksames Mittel, Isolierung bis mindestens 48 Stunden nach Symptomende.',
    ],
  },
  {
    id: 'basis', label: 'Basishygiene', kurz: 'Einwirkzeit, Schmuck, Kanülen, Flächen, Katheter',
    wissen: [
      'Hygienische Händedesinfektion: meist 30 Sekunden, Hände die ganze Zeit feucht.',
      'Kein Schmuck, keine Uhr, keine künstlichen Nägel an Händen und Unterarmen.',
      'Kein Recapping. Wischdesinfektion statt Sprühen.',
    ],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung({ momente, psa, erreger, basis }, VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
