import type { DomainModule } from '../../core/types';

/**
 * Fachmodul generalistische Pflegeausbildung.
 * Platzhalter: Der vollständige Themenkatalog wird im Thread "Pflege-Fachsystem" erarbeitet
 * (YAML + JSON Schema) und hier beim Build als JSON eingebunden.
 */
export const pflegeModule: DomainModule = {
  id: 'pflege-generalistisch',
  name: 'Generalistische Pflegeausbildung',
  version: '0.1.0',
  subjects: [
    { id: 'fach.pflege.krankheitslehre', moduleId: 'pflege-generalistisch', name: 'Pflege und Krankheitslehre' },
    { id: 'fach.pflege.pflegeprozess', moduleId: 'pflege-generalistisch', name: 'Pflegeprozess und Dokumentation' },
    { id: 'fach.pflege.recht', moduleId: 'pflege-generalistisch', name: 'Recht und Rahmenbedingungen' },
    { id: 'fach.pflege.praxisfaelle', moduleId: 'pflege-generalistisch', name: 'Praxisfälle und Fallbearbeitung' },
  ],
  topics: [],
  glossary: [],
  taskFormats: [
    { id: 'pesr', name: 'PESR', description: 'Pflegediagnose: Problem, Einflussfaktor, Symptom, Ressource', requiredParts: ['Problem', 'Einflussfaktor', 'Symptom', 'Ressource'] },
    { id: 'smart', name: 'SMART', description: 'Pflegeziel: spezifisch, messbar, akzeptiert, realistisch, terminiert', requiredParts: ['spezifisch', 'messbar', 'akzeptiert', 'realistisch', 'terminiert'] },
    { id: 'sis', name: 'SIS', description: 'Strukturierte Informationssammlung', requiredParts: [] },
  ],
  checkRules: [],
};
