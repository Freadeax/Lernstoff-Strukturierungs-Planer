// Expertenstandards-Trainer: Aufbau der DNQP-Expertenstandards und Kernaussagen einzelner Standards.
// Grundlage: Veröffentlichungen des DNQP (Hochschule Osnabrück) und die Standardübersicht im Katalog (es.*).
// Nur gesicherte Kernaussagen, keine Detailzahlen, die sich mit Aktualisierungen ändern können.

import { ergaenze, mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';
import { ERWEITERUNG } from './erweiterung';

export const ES_THEMA = 'thema.qw.expertenstandards';

export type BereichId = 'aufbau' | 'prophylaxe' | 'versorgung';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

const EBENEN = ['Strukturkriterium', 'Prozesskriterium', 'Ergebniskriterium'] as const;

function ebene(id: string, aussage: string, richtig: 0 | 1 | 2, warum: string, thema?: string): AuswahlAufgabe {
  return {
    id: `aufbau.ebene.${id}`, art: 'auswahl', topicIds: thema ? [ES_THEMA, thema] : [ES_THEMA], titel: 'Struktur, Prozess, Ergebnis',
    frage: `„${aussage}“ Welche Art von Kriterium ist das?`,
    optionen: [...EBENEN], richtig: [richtig], mehrfach: false,
    erklaerung: [
      'Struktur: Was Einrichtung und Pflegefachkraft mitbringen (Wissen, Kompetenz, Hilfsmittel, Verfahrensregeln). Prozess: Was die Pflegefachkraft tut. Ergebnis: Was am Ende beim Menschen oder in der Dokumentation nachweisbar sein soll.',
      warum,
    ],
  };
}

function frage(bereich: BereichId, id: string, thema: string, titel: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id: `${bereich}.${id}`, art: 'auswahl', topicIds: [ES_THEMA, thema], titel, frage: f, optionen, richtig, mehrfach, erklaerung };
}

// ---------------------------------------------------------------- Aufbau

const aufbau: Aufgabe[] = [
  ebene('wissen', 'Die Pflegefachkraft verfügt über aktuelles Wissen zur Entstehung eines Dekubitus und zur Einschätzung des Risikos.', 0, 'Wissen und Kompetenz der Pflegefachkraft sind Voraussetzungen, also Struktur.', 'thema.pro.dekubitus'),
  ebene('hilfsmittel', 'Die Einrichtung stellt geeignete druckverteilende Hilfsmittel zur Verfügung.', 0, 'Bereitgestellte Mittel und Ressourcen sind Struktur.', 'thema.pro.dekubitus'),
  ebene('einschaetzung', 'Die Pflegefachkraft schätzt das Sturzrisiko zu Beginn des pflegerischen Auftrags und bei Veränderungen ein.', 1, 'Eine Handlung der Pflegefachkraft ist ein Prozesskriterium.', 'thema.pro.sturz'),
  ebene('beratung', 'Die Pflegefachkraft informiert und berät den Patienten und seine Angehörigen zum Schmerzmanagement.', 1, 'Informieren und Beraten ist eine Handlung, also Prozess.', 'thema.beo.bewusstsein'),
  ebene('dokumentiert', 'Eine aktuelle, systematische Einschätzung des Dekubitusrisikos liegt vor.', 2, 'Was nachweisbar vorliegen soll, ist ein Ergebniskriterium.', 'thema.pro.dekubitus'),
  ebene('schmerzarm', 'Der Patient hat eine stabile Schmerzsituation oder seine Schmerzen sind gelindert.', 2, 'Der angestrebte Zustand beim Menschen ist das Ergebnis.', 'thema.beo.bewusstsein'),
  ebene('verfahren', 'Die Einrichtung verfügt über eine Verfahrensregel zur Zusammenarbeit der Berufsgruppen im Entlassungsmanagement.', 0, 'Verfahrensregeln der Einrichtung sind Struktur.'),
  {
    id: 'aufbau.entwicklung', art: 'reihenfolge', topicIds: [ES_THEMA], titel: 'Entstehung eines Expertenstandards',
    frage: 'Wie entsteht ein Expertenstandard beim DNQP?',
    schritte: ['Expertenarbeitsgruppe erarbeitet einen Entwurf auf Grundlage der Literatur', 'Fachöffentliche Konsensus-Konferenz', 'Modellhafte Implementierung in Einrichtungen', 'Veröffentlichung der endgültigen Fassung', 'Regelmäßige Aktualisierung'],
    erklaerung: ['Der Entwurf wird erst in der Fachöffentlichkeit diskutiert, dann in der Praxis erprobt und erst danach endgültig veröffentlicht.', 'Standards werden in Abständen aktualisiert, weil sich das Wissen weiterentwickelt.'],
  },
  {
    id: 'aufbau.dnqp', art: 'auswahl', topicIds: [ES_THEMA], titel: 'Grundlagen',
    frage: 'Wer entwickelt die nationalen Expertenstandards in der Pflege?',
    optionen: ['Das Deutsche Netzwerk für Qualitätsentwicklung in der Pflege (DNQP)', 'Das Robert Koch-Institut', 'Die Pflegekassen', 'Jede Einrichtung für sich'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Das DNQP ist an der Hochschule Osnabrück angesiedelt. Jeder Standard beruht auf einer systematischen Literaturanalyse einer Expertenarbeitsgruppe.'],
  },
  {
    id: 'aufbau.bedeutung', art: 'auswahl', topicIds: [ES_THEMA], titel: 'Grundlagen',
    frage: 'Welche Bedeutung haben Expertenstandards für deine Arbeit?',
    optionen: [
      'Sie beschreiben den anerkannten Stand des Wissens. Wer davon abweicht, muss es fachlich begründen können.',
      'Sie sind unverbindliche Empfehlungen ohne Folgen.',
      'Sie gelten nur in Krankenhäusern.',
      'Sie ersetzen die ärztliche Anordnung.',
    ],
    richtig: [0], mehrfach: false,
    erklaerung: ['Jeder Standard legt seinen Geltungsbereich in der Präambel fest: die meisten gelten in allen Versorgungsbereichen, das Entlassungsmanagement z. B. für Krankenhäuser und Reha-Kliniken. Bei Haftungsfragen wird geprüft, ob nach dem Stand des Wissens gepflegt wurde.', 'Sie lassen Raum für den Einzelfall: Abweichungen sind möglich, wenn sie begründet und dokumentiert sind.'],
  },
];

// ---------------------------------------------------------------- Prophylaxen

const prophylaxe: Aufgabe[] = [
  frage('prophylaxe', 'dekubitus-skala', 'thema.pro.dekubitus', 'Dekubitusprophylaxe',
    'Wie schätzt du nach dem Expertenstandard Dekubitusprophylaxe das Risiko ein?',
    ['Mit einer fachlichen Einschätzung, Skalen wie Braden können sie unterstützen, aber nicht ersetzen', 'Nur mit der Braden-Skala, ein Wert über 18 schließt ein Risiko aus', 'Gar nicht, alle Menschen werden gleich behandelt', 'Nur der Arzt darf das Risiko einschätzen'],
    ['Der Standard setzt auf die klinische Einschätzung der Pflegefachkraft: zuerst ein Screening, bei Hinweisen eine genauere Einschätzung. Eine Skala allein reicht nicht.']),
  frage('prophylaxe', 'dekubitus-massnahme', 'thema.pro.dekubitus', 'Dekubitusprophylaxe',
    'Was ist die wichtigste Maßnahme der Dekubitusprophylaxe?',
    ['Bewegung fördern und Druck regelmäßig entlasten', 'Gefährdete Stellen mit Eis und Föhn behandeln', 'Gefährdete Haut massieren', 'Den Patienten möglichst ruhig liegen lassen'],
    ['Eigenbewegung fördern, Positionswechsel und druckverteilende Hilfsmittel. Massieren gefährdeter Stellen und „Eisen und Föhnen“ schaden und sind überholt.']),
  frage('prophylaxe', 'fingertest', 'thema.pro.dekubitus', 'Dekubitusprophylaxe',
    'Über dem Kreuzbein ist eine Rötung. Mit dem Finger eingedrückt bleibt sie rot. Was bedeutet das?',
    ['Nicht wegdrückbare Rötung: Hinweis auf einen Dekubitus der Kategorie 1, die Stelle sofort entlasten', 'Normale Druckrötung, die von allein verschwindet', 'Ein Zeichen für eine Pilzinfektion', 'Ein Hinweis auf Austrocknung'],
    ['Der Fingertest unterscheidet eine wegdrückbare Rötung (Haut noch intakt durchblutet) von einer nicht wegdrückbaren Rötung (Kategorie 1).']),
  frage('prophylaxe', 'sturz-skala', 'thema.pro.sturz', 'Sturzprophylaxe',
    'Wie wird nach dem Expertenstandard Sturzprophylaxe das Sturzrisiko eingeschätzt?',
    ['Über die individuellen Risikofaktoren, z. B. Gangunsicherheit, frühere Stürze, Medikamente, Sehstörungen', 'Ausschließlich mit einer Punkteskala', 'Nur nach dem Alter', 'Erst nach dem ersten Sturz'],
    ['Der Standard empfiehlt keine bestimmte Skala, sondern die Erfassung der Risikofaktoren. Daraus folgen gezielte Maßnahmen.']),
  frage('prophylaxe', 'sturz-massnahmen', 'thema.pro.sturz', 'Sturzprophylaxe',
    'Welche Maßnahmen passen zur Sturzprophylaxe? Wähle alle zutreffenden.',
    ['Kraft- und Balancetraining', 'Umgebung anpassen: Licht, Stolperfallen entfernen, Hilfsmittel in Reichweite', 'Feste, geschlossene Schuhe', 'Bettgitter hochziehen, damit niemand allein aufsteht', 'Bewohner im Rollstuhl festgurten'],
    ['Freiheitsentziehende Maßnahmen verhindern keine Stürze, sie erhöhen die Gefahr schwerer Verletzungen (z. B. Sturz über das Bettgitter) und brauchen eine rechtliche Grundlage.'],
    [0, 1, 2], true),
  frage('prophylaxe', 'ernaehrung', 'thema.ph.ernaehrung', 'Ernährungsmanagement',
    'Was steht nach dem Expertenstandard Ernährungsmanagement am Anfang?',
    ['Ein Screening auf Mangelernährung oder ein Risiko dafür zu Beginn des pflegerischen Auftrags', 'Sofort eine Trinknahrung für alle', 'Eine Magensonde bei jedem über 80 Jahren', 'Ein Kalorienprotokoll erst nach drei Wochen'],
    ['Erst Screening, bei Auffälligkeiten ein genaueres Assessment (z. B. Essmenge, Gewichtsverlauf, Schluckfähigkeit), dann individuelle Maßnahmen.']),
  frage('prophylaxe', 'mangel-zeichen', 'thema.ph.ernaehrung', 'Ernährungsmanagement',
    'Welche Beobachtungen weisen auf eine Mangelernährung hin? Wähle alle zutreffenden.',
    ['Ungewollter Gewichtsverlust', 'Kleidung oder Zahnprothese sitzen locker', 'Essensreste bleiben regelmäßig auf dem Teller', 'Leicht erhöhter Blutdruck', 'Gute Wundheilung'],
    ['Gewichtsverlauf, Essmenge und äußere Zeichen sind die wichtigsten Hinweise. Eine schlechte Wundheilung kann ebenfalls darauf hindeuten.'],
    [0, 1, 2], true),
];

// ---------------------------------------------------------------- Versorgung

const KONTINENZ = ['Kontinenz', 'Unabhängig erreichte Kontinenz', 'Abhängig erreichte Kontinenz', 'Unabhängig kompensierte Inkontinenz', 'Abhängig kompensierte Inkontinenz', 'Nicht kompensierte Inkontinenz'];

function profil(id: string, fall: string, richtig: number): AuswahlAufgabe {
  return {
    id: `versorgung.kontinenz.${id}`, art: 'auswahl', topicIds: [ES_THEMA, 'thema.ph.ausscheidung'], titel: 'Kontinenzprofile',
    frage: `${fall} Welches Kontinenzprofil liegt vor?`,
    optionen: KONTINENZ, richtig: [richtig], mehrfach: false,
    erklaerung: [
      `${KONTINENZ[richtig]}.`,
      'Erreicht = kein unwillkürlicher Harn- oder Stuhlverlust, aber nur mit Maßnahmen. Kompensiert = Verlust kommt vor, wird aber mit Hilfsmitteln aufgefangen. Unabhängig = die Person macht es selbst, abhängig = sie braucht dafür Hilfe. Seit 2024 gelten die Profile auch für die Stuhlkontinenz.',
    ],
  };
}

const versorgung: Aufgabe[] = [
  profil('selbst-vorlage', 'Frau B. verliert beim Husten etwas Urin. Sie benutzt Vorlagen und wechselt sie selbstständig.', 3),
  profil('toilettentraining', 'Herr K. ist nach festen Toilettenzeiten, an die ihn die Pflege erinnert und zu denen sie ihn begleitet, durchgehend trocken.', 2),
  profil('selbst-zeiten', 'Frau L. geht nach einem selbst geführten Plan alle drei Stunden zur Toilette und ist so trocken.', 1),
  profil('pflege-wechselt', 'Herr M. hat eine Dranginkontinenz. Die Pflege wechselt seine Inkontinenzhose, er kann es nicht selbst.', 4),
  profil('kein-hilfsmittel', 'Frau S. verliert Urin, lehnt aber jedes Hilfsmittel ab. Ihre Kleidung ist häufig nass.', 5),
  frage('versorgung', 'schmerz-einschaetzung', 'thema.beo.bewusstsein', 'Schmerzmanagement',
    'Wie schätzt du Schmerzen bei einem orientierten Patienten am besten ein?',
    ['Mit seiner Selbstauskunft, z. B. auf der Numerischen Rating-Skala', 'Nach deinem Eindruck von seinem Gesichtsausdruck', 'Nach der Höhe des Blutdrucks', 'Gar nicht, er meldet sich ja'],
    ['Die Selbstauskunft hat Vorrang. Nur wenn sie nicht möglich ist, etwa bei fortgeschrittener Demenz, kommt eine Fremdeinschätzung wie BESD zum Einsatz.']),
  frage('versorgung', 'schmerz-wirkung', 'thema.beo.bewusstsein', 'Schmerzmanagement',
    'Du hast ein Schmerzmittel nach Anordnung gegeben. Was gehört danach dazu?',
    ['Die Wirkung nach angemessener Zeit erneut einschätzen und Nebenwirkungen beobachten', 'Nichts, bis sich der Patient wieder meldet', 'Die nächste Dosis vorsorglich gleich mit vorbereiten', 'Den Patienten bitten, nicht mehr nach Schmerzen gefragt zu werden'],
    ['Zum Schmerzmanagement gehört die Verlaufskontrolle. Häufige Nebenwirkungen von Opioiden sind Übelkeit, Verstopfung und Müdigkeit.']),
  frage('versorgung', 'wunde-chronisch', 'thema.ph.wunde', 'Chronische Wunden',
    'Wann gilt eine Wunde nach dem Expertenstandard als chronisch?',
    ['Wenn sie innerhalb von acht Wochen nicht abgeheilt ist', 'Wenn sie größer als 2 cm ist', 'Sobald sie infiziert ist', 'Immer bei Menschen über 65 Jahren'],
    ['Die 2. Aktualisierung 2025 nennt acht Wochen ohne Abheilung. Ältere Lehrbücher nennen oft „4 bis 12 Wochen“; das ist nicht mehr die Definition des Standards.', 'Typische chronische Wunden sind Dekubitus, Ulcus cruris und das diabetische Fußulkus. Der Standard stellt die Lebensqualität und das Selbstmanagement der Betroffenen in den Mittelpunkt.']),
  frage('versorgung', 'wunde-lebensqualitaet', 'thema.ph.wunde', 'Chronische Wunden',
    'Was erfasst du bei einem Menschen mit chronischer Wunde neben der Wunde selbst? Wähle alle zutreffenden.',
    ['Wundbedingte Einschränkungen im Alltag, z. B. Schmerzen, Geruch, Mobilität', 'Wissen und Fähigkeiten zum Umgang mit der Wunde (Selbstmanagement)', 'Die Ursache der Wunde und ihre Behandlung', 'Die Lieblingsfarbe des Verbandes'],
    ['Der Standard verlangt eine Einschätzung der wund- und therapiebedingten Einschränkungen und der Selbstmanagementkompetenzen, nicht nur der Wunde.'],
    [0, 1, 2], true),
  frage('versorgung', 'entlassung', ES_THEMA, 'Entlassungsmanagement',
    'Wann beginnt nach dem Expertenstandard das Entlassungsmanagement?',
    ['Mit einer ersten Einschätzung des Unterstützungsbedarfs innerhalb von 24 Stunden nach der Aufnahme', 'Am Tag der Entlassung', 'Erst wenn der Sozialdienst sich meldet', 'Nach der Entlassung durch den Hausarzt'],
    ['Ein frühes initiales Assessment zeigt, wer nach der Entlassung Unterstützung braucht. So bleibt Zeit, Hilfsmittel, Pflege und Angehörige rechtzeitig einzubinden.']),
  frage('versorgung', 'demenz', 'thema.kl.demenz', 'Beziehungsgestaltung bei Demenz',
    'Welche Haltung steht im Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz im Mittelpunkt?',
    ['Person-zentrierte Pflege: das Gefühl, als Person gehört, verstanden und angenommen zu werden, erhalten oder fördern', 'Möglichst viele Defizite korrigieren', 'Den Menschen immer wieder an die Realität erinnern', 'Abläufe streng nach Plan, ohne Ausnahmen'],
    ['Der Standard baut auf dem person-zentrierten Ansatz (nach Tom Kitwood) auf. Beziehung ist dabei selbst eine pflegerische Intervention.']),
];

export const BEREICHE: Bereich[] = [
  {
    id: 'aufbau', label: 'Aufbau und Bedeutung', kurz: 'Struktur, Prozess, Ergebnis, Entstehung',
    wissen: [
      'Jeder Standard hat eine Standardaussage, eine Begründung und Kriterien auf mehreren Ebenen.',
      'Je Ebene: Struktur (Voraussetzungen), Prozess (Handeln), Ergebnis (was erreicht sein soll).',
      'Entstehung: Expertenarbeitsgruppe, Konsensus-Konferenz, modellhafte Implementierung, Veröffentlichung, Aktualisierung.',
    ],
  },
  {
    id: 'prophylaxe', label: 'Dekubitus, Sturz, Ernährung', kurz: 'Risikoeinschätzung und Maßnahmen',
    wissen: [
      'Dekubitus: fachliche Einschätzung, Skalen nur ergänzend. Bewegung fördern, Druck entlasten.',
      'Sturz: Risikofaktoren erfassen, keine bestimmte Skala. Freiheitsentzug ist keine Sturzprophylaxe.',
      'Ernährung: Screening zu Beginn, bei Auffälligkeiten genaueres Assessment.',
    ],
  },
  {
    id: 'versorgung', label: 'Kontinenz, Schmerz, Wunden, Entlassung', kurz: 'Kontinenzprofile, Einschätzung, Lebensqualität',
    wissen: [
      'Kontinenzförderung (seit 2024 Harn und Stuhl). Profile: Kontinenz, unabhängig/abhängig erreichte Kontinenz, unabhängig/abhängig kompensierte Inkontinenz, nicht kompensierte Inkontinenz.',
      'Schmerz: Selbstauskunft vor Fremdeinschätzung, Wirkung kontrollieren.',
      'Chronische Wunde: innerhalb von acht Wochen nicht abgeheilt. Lebensqualität und Selbstmanagement einschätzen, Wirksamkeit spätestens nach vier Wochen prüfen.',
    ],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung(ergaenze({ aufbau, prophylaxe, versorgung }, ERWEITERUNG), VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
