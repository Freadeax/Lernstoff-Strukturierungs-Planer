// Präfixbaum für die Autovervollständigung der globalen Suche. Indiziert auch Wortteile ab
// drei Zeichen, damit „prophylaxe“ in „Dekubitusprophylaxe“ gefunden wird (deutsche Komposita).

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function tokenize(text: string): string[] {
  return normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
}

interface Node { children: Map<string, Node>; ids: Set<number>; }
const node = (): Node => ({ children: new Map(), ids: new Set() });

export interface TrieEntry { label: string; keywords?: string[] }

export class Trie<T extends TrieEntry> {
  private root = node();
  private entries: T[] = [];

  constructor(items: T[] = []) { items.forEach((i) => this.insert(i)); }

  insert(item: T) {
    const id = this.entries.push(item) - 1;
    const words = new Set([...tokenize(item.label), ...(item.keywords ?? []).flatMap(tokenize)]);
    const parts = new Set<string>();
    for (const w of words) for (let i = 0; i === 0 || i <= w.length - 3; i++) parts.add(w.slice(i));
    for (const word of parts) {
      let n = this.root;
      for (const ch of word) {
        let next = n.children.get(ch);
        if (!next) { next = node(); n.children.set(ch, next); }
        next.ids.add(id);
        n = next;
      }
    }
  }

  private prefix(word: string): Set<number> {
    let n: Node | undefined = this.root;
    for (const ch of word) { n = n.children.get(ch); if (!n) return new Set(); }
    return n.ids;
  }

  /** Alle Suchwörter müssen vorkommen. Reihenfolge: Label-Anfang, Wortanfang, Wortteil. */
  search(query: string, limit = 12): T[] {
    const words = tokenize(query);
    if (!words.length) return [];
    let hits: Set<number> | undefined;
    for (const w of words) {
      const ids = this.prefix(w);
      hits = hits ? new Set([...hits].filter((id) => ids.has(id))) : new Set(ids);
      if (!hits.size) return [];
    }
    const q = normalize(query.trim());
    const score = (e: T) => {
      if (normalize(e.label).startsWith(q)) return 0;
      const tokens = [...tokenize(e.label), ...(e.keywords ?? []).flatMap(tokenize)];
      return words.every((w) => tokens.some((t) => t.startsWith(w))) ? 1 : 2;
    };
    return [...hits!]
      .map((id) => this.entries[id]!)
      .sort((a, b) => score(a) - score(b) || a.label.length - b.label.length || a.label.localeCompare(b.label, 'de'))
      .slice(0, limit);
  }
}
