// Katalog-Erweiterungen eines Fachmoduls. Fachneutral: gilt für Pflege und jedes weitere Fachgebiet.
// Alle Kernfelder stammen aus src/core/types.ts; hier stehen nur optionale Zusätze.
// Das gebaute Modul-JSON erfüllt CatalogModule und damit auch DomainModule.

import type { DomainModule, Topic, GlossaryEntry, TaskFormat, CheckRule, ID } from '../core/types';

export type Pruefstatus = 'ungeprueft' | 'geprueft' | 'veraltet';

export interface CatalogTopic extends Topic {
  competencyIds?: ID[];   // Einträge aus frameworks[].items
  referenceIds?: ID[];    // Normen, Standards, Assessments, Modelle
  taskFormatIds?: ID[];   // typische Aufgabenformate
  tags?: string[];
}

export interface CatalogGlossaryEntry extends GlossaryEntry {
  id?: ID;
  topicIds?: ID[];
  synonyms?: string[];    // dürfen den Fachbegriff nicht stillschweigend ersetzen
  note?: string;
  origin?: 'katalog' | 'quelle';  // katalog = ergänzendes Wissen, noch nicht durch Nutzermaterial belegt
}

export interface TaskFormatPart { key: string; label: string; required: boolean; hint?: string; }

export interface CatalogTaskFormat extends TaskFormat {
  parts?: TaskFormatPart[];
  referenceIds?: ID[];
  checkRuleIds?: ID[];
}

export interface CatalogCheckRule extends CheckRule {
  severity?: 'fehler' | 'warnung' | 'hinweis';
  method?: 'struktur' | 'llm' | 'abgleich';
  scope?: string[];       // TaskFormat-IDs oder 'zusammenfassung'
}

/** Kompetenzrahmen oder Curriculum (Pflege: Kompetenzbereiche I-V, curriculare Einheiten). */
export interface Framework {
  id: ID;
  name: string;
  kind: 'kompetenzen' | 'curriculum' | 'lernziele';
  referenceIds?: ID[];
  pruefstatus?: Pruefstatus;
  hinweis?: string;
  items: Array<{ id: ID; parentId?: ID; code: string; name: string }>;
}

/** Wissensobjekt mit eigener Identität, auf das Themen verweisen. */
export interface Reference {
  id: ID;
  kind: 'norm' | 'standard' | 'assessment' | 'modell' | 'klassifikation' | 'leitlinie';
  name: string;
  details?: string;
  url?: string;
  pruefstatus?: Pruefstatus;
}

/** Operator einer Aufgabenstellung mit Anforderungsbereich I-III. */
export interface Operator { id: ID; name: string; afb: 1 | 2 | 3; expects: string; }

/** Vorlage für Exam-Objekte, die der Nutzer anlegt. */
export interface ExamFormat {
  id: ID;
  name: string;
  kind: 'schriftlich' | 'muendlich' | 'praktisch' | 'gemischt';
  details?: string;
  durationMinutes?: number;
  count?: number;
  competencyIds?: ID[];
  taskFormatIds?: ID[];
  referenceIds?: ID[];
  pruefstatus?: Pruefstatus;
}

export interface CatalogModule extends DomainModule {
  sprache?: string;
  stand?: string;
  rechtsgrundlagen?: ID[];
  topics: CatalogTopic[];
  glossary: CatalogGlossaryEntry[];
  taskFormats: CatalogTaskFormat[];
  checkRules: CatalogCheckRule[];
  frameworks?: Framework[];
  references?: Reference[];
  operators?: Operator[];
  examFormats?: ExamFormat[];
}
