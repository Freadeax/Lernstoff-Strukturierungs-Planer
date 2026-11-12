// Synonyme und Abkürzungen für den Schnellsucher. Jede Zeile: gleichwertige Ausdrücke.
// Ein Suchwort aus einer Zeile findet auch Einträge mit den anderen Ausdrücken derselben Zeile.
// Mehrteilige Ausdrücke müssen ganz im Eintrag vorkommen. Ergänzt wird automatisch um Glossar-Synonyme
// und Abkürzungen (siehe quellen.ts).

import type { SynonymGruppen } from './suchkern';

export const SYNONYME: SynonymGruppen = [
  // Standards und ihre Alltagsnamen
  ['Dekubitus', 'Druckgeschwür', 'Druckgeschwüre', 'Druckulkus', 'Wundliegen', 'Druckstelle', 'Dekubitalulkus'],
  ['Sturz', 'Stürze', 'Hinfallen', 'Sturzgefahr', 'Sturzrisiko'],
  ['Schmerz', 'Schmerzen', 'Schmerzmanagement', 'Analgesie'],
  ['Inkontinenz', 'Kontinenz', 'Harninkontinenz', 'Kontinenzförderung', 'Blasenschwäche', 'Einnässen'],
  ['Mangelernährung', 'Malnutrition', 'Unterernährung', 'Ernährungsmanagement', 'Gewichtsverlust'],
  ['Exsikkose', 'Dehydratation', 'Flüssigkeitsmangel', 'Austrocknung'],
  ['Entlassung', 'Entlassungsmanagement', 'Überleitung', 'Überleitungsmanagement', 'Versorgungsübergang', 'Entlassplanung'],
  ['Wunde', 'Wunden', 'Ulkus', 'Ulcus', 'Wundversorgung', 'Wundmanagement', 'Wundheilung'],
  ['Ulcus cruris', 'Unterschenkelgeschwür', 'offenes Bein'],
  ['diabetisches Fußsyndrom', 'DFS', 'diabetischer Fuß'],
  ['Demenz', 'Beziehungsgestaltung', 'kognitive Einschränkung', 'Alzheimer'],
  ['person-zentriert', 'personzentriert', 'Kitwood'],
  ['Mobilität', 'Bewegung', 'Mobilisation', 'Bewegungsförderung'],
  ['Mundgesundheit', 'Mundpflege', 'Mundhygiene', 'Zahnpflege', 'Zahnprothese', 'Prothese'],
  ['Hautintegrität', 'Hautschutz', 'Hautpflege', 'Hautschäden'],
  ['IAD', 'inkontinenzassoziierte Dermatitis', 'Inkontinenzdermatitis'],
  ['Intertrigo', 'Hautfaltenentzündung', 'Wundsein'],
  ['Hautriss', 'Skin Tear', 'Hauteinriss'],

  // Aufbau der Standards
  ['Struktur', 'Strukturkriterium', 'Strukturkriterien', 'Voraussetzung'],
  ['Prozess', 'Prozesskriterium', 'Prozesskriterien', 'Handlung'],
  ['Ergebnis', 'Ergebniskriterium', 'Ergebniskriterien', 'Outcome'],
  ['Einschätzung', 'Assessment', 'Screening', 'Risikoeinschätzung', 'Erfassung'],
  ['Beratung', 'Information', 'Schulung', 'Anleitung', 'Edukation'],
  ['Evaluation', 'Überprüfung', 'Wirksamkeit', 'Erfolgskontrolle'],
  ['Verfahrensregel', 'Verfahrensanweisung', 'Verfahrensstandard', 'Hausstandard'],
  ['Angehörige', 'Bezugspersonen', 'Familie', 'Zugehörige'],
  ['Pflegefachkraft', 'Pflegefachperson', 'Pflegefachfrau', 'Pflegefachmann', 'Pflegekraft'],
  ['DNQP', 'Deutsches Netzwerk für Qualitätsentwicklung in der Pflege'],
  ['Expertenstandard', 'Expertenstandards', 'nationaler Standard'],
  ['Konsensus-Konferenz', 'Konsensuskonferenz', 'Konsentierung'],
  ['Implementierung', 'Einführung', 'Umsetzung'],
  ['Audit', 'Auditinstrument', 'Qualitätsprüfung'],

  // Instrumente und Abkürzungen
  ['NRS', 'Numerische Rating-Skala', 'Numerische Ratingskala', 'Schmerzskala'],
  ['VAS', 'Visuelle Analogskala'],
  ['BESD', 'Beurteilung von Schmerzen bei Demenz', 'Fremdeinschätzung'],
  ['Selbstauskunft', 'Selbsteinschätzung', 'Selbstbericht'],
  ['MNA', 'Mini Nutritional Assessment', 'MNA-SF'],
  ['TUG', 'Timed Up and Go', 'Aufstehtest'],
  ['Tinetti', 'Tinetti-Test', 'Mobilitätstest'],
  ['Braden', 'Braden-Skala', 'Bradenskala'],
  ['Norton', 'Norton-Skala', 'Nortonskala'],
  ['Barthel', 'Barthel-Index', 'Barthelindex'],
  ['BMI', 'Body-Mass-Index', 'Körpermasseindex'],
  ['PEG', 'Ernährungssonde', 'Magensonde', 'Sondenernährung'],
  ['DK', 'Blasenverweilkatheter', 'Dauerkatheter', 'Katheter'],
  ['FEM', 'freiheitsentziehende Maßnahmen', 'Fixierung', 'Bettgitter'],
  ['Hüftprotektor', 'Hüftschutzhose', 'Protektor'],
  ['Positionswechsel', 'Lagerung', 'Umlagerung', 'Bewegungsplan', 'Lagerungsplan'],
  ['Fingertest', 'Fingerdrucktest', 'Hautrötung'],
  ['Weichlagerung', 'Wechseldruckmatratze', 'Weichlagerungsmatratze', 'druckverteilend'],
  ['Beckenboden', 'Beckenbodentraining', 'Beckenbodengymnastik'],
  ['Toilettentraining', 'Miktionstraining', 'Blasentraining', 'Toilettengang'],
  ['Opioid', 'Opioide', 'Opiat', 'Morphin'],
  ['WHO-Stufenschema', 'Stufenschema', 'Schmerztherapie'],
  ['Lebensqualität', 'Wohlbefinden'],
  ['Selbstmanagement', 'Selbstpflege', 'Eigenständigkeit'],
];
