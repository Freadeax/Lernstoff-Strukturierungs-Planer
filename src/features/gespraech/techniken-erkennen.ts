// Gesprächssimulator, eigene Worte: typische Formulierungen je Gesprächstechnik erkennen (offline).
// Die Muster sind bewusst eng gefasst. Sie geben nur einen Zuschlag beim Abgleich, entscheiden nie allein.

import { falte } from '../../core/abgleich/normalisieren';
import type { TechnikId } from './dialoge';

const MUSTER: Array<[TechnikId, RegExp]> = [
  ['spiegeln', /\bsie (sind|wirken|scheinen|klingen)( \w+){0,3} (wuetend|sauer|veraergert|traurig|besorgt|aengstlich|aufgebracht|enttaeuscht|verunsichert|bewegt|aufgeregt|verzweifelt)|\bmir scheint\b|\bich sehe,? (dass|wie)\b|\bsie machen sich (grosse )?sorgen\b|\bdas (macht|bewegt|belastet) sie\b|\bdas klingt (so|nach)\b|\bsie haben (grosse |solche )?angst\b|\bsie muessen sich nicht entschuldigen\b/],
  ['zuhoeren', /\bwenn ich sie richtig verstehe\b|\bsie (meinen|sagen),? dass\b|\b(habe|hab) ich (sie|das) richtig verstanden\b|\bsie haben (also )?den eindruck\b/],
  ['offen', /^(und )?(was|wie|wo|wann|warum|wieso|weshalb|welche\w*)\b|\berzaehlen sie\b|\b(was|wie) (genau|merken|meinen|stellen|wuenschen|moechten|haben)\b/],
  ['ich', /\bich (habe|hab) (den eindruck|bemerkt|beobachtet|gesehen)\b|\bmir ist wichtig\b|\bich wuensche mir\b|\bich mache mir sorgen\b/],
  ['validation', /\b(ihre kinder|ihre familie) (sind|ist) ihnen (sehr )?wichtig\b|\bsie (waren|sind) (eine )?gute\b|\bsie vermissen\b|\bsie waren immer\b|\bsollen (etwas|was) warmes\b/],
  ['informieren', /\bich (erklaere|messe|kontrolliere|hole|sage der|sage dem|informiere)\b|\b(die aerztin|der arzt) hat\b|\bwir (haben|kontrollieren|messen|beobachten)\b|\bdas roentgen\b/],
  ['grenze', /\bdas geht (hier )?(so )?nicht\b|\bich moechte (nicht|dass)\b/],
  ['vereinbaren', /\b(passt (ihnen|das)|ist das (fuer sie )?(ok|okay|in ordnung)|einverstanden)\b|\bich rufe sie\b|\bwollen wir\b|\bwir (vereinbaren|machen aus)\b/],
  ['beschwichtigen', /\b(keine sorgen?|machen sie sich keine|das wird schon|wird (schon )?wieder|alles (wird )?gut|keine gedanken|dann ist ja alles)\b/],
  ['bagatellisieren', /\b(so schlimm (ist es|ist das)( ja)? nicht|nicht so schlimm|halb so wild|ist normal|ganz normal|kommt (oefter|haeufig|leider oefter) vor|ist egal|routine\w*|beruhigen sie sich|keine angst zu haben)\b/],
  ['rechtfertigen', /\b(ich hatte (gar )?keinen dienst|nicht meine schuld|dafuer kann ich nichts|da muessen sie sich an|(bin|sind) (dafuer )?nicht zustaendig|steht (bestimmt )?in der doku\w*|war die (spaet|frueh|nacht)schicht|dann eben nicht|das weiss ich nicht|hatte keine zeit)\b/],
  ['ratschlag', /\b(sie sollten|sie muessten|an ihrer stelle|trinken sie|sollen wir (ihn|sie)|ich lasse ihnen|ziehen wir|gehen wir in ihr zimmer|kommen sie,? wir gehen)\b/],
  ['korrigieren', /\b(ihre kinder sind (doch )?(laengst |schon )?erwachsen|sie wohnen (jetzt |doch )?hier|das stimmt (doch )?nicht|das ist (doch )?(schon )?(lange|jahre) her)\b/],
  ['drohen', /\b(wenn sie (jetzt )?(so|nicht|weiter|raus)\w*|dann (schreibe|rufe|melde) ich|sie muessen (aber|die|das)|muessen sie aber|da kommen sie nicht raus|tuer ist (ab)?geschlossen|nicht kooperieren|sonst (bekommen|passiert|rufe))/],
];

const GESCHLOSSEN = /^(ist|sind|hat|haben|hatten|wissen|koennen|sollen|soll|wollen|moechten|brauchen|tut|haben sie|geht)\b/;

export function erkenneTechniken(text: string): Set<TechnikId> {
  const f = falte(text);
  const out = new Set<TechnikId>();
  for (const [id, re] of MUSTER) if (re.test(f)) out.add(id);
  // Ja-Nein-Frage am Satzanfang, ohne W-Wort
  const saetze = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (const s of saetze) if (s.endsWith('?') && GESCHLOSSEN.test(falte(s)) && !/^darf ich\b/.test(falte(s))) out.add('geschlossen');
  return out;
}
