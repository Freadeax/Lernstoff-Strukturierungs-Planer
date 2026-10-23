#!/usr/bin/env python3
"""Baut ein Fachmodul aus <modulordner>/katalog/*.yaml zu <modulordner>/<id>.json und prüft es.

Aufruf:  python3 scripts/build-module.py src/modules/pflege
Abhängigkeiten: pip install pyyaml jsonschema
Prüft:   JSON Schema, eindeutige IDs, alle Verweise, Zyklen in parentId/prerequisites.
Exit-Code 1 bei Fehlern, damit das Skript in CI laufen kann.
"""
import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

REPO = Path(__file__).resolve().parent.parent
ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / "src" / "modules" / "pflege"
SCHEMA = REPO / "src" / "modules" / "schema" / "domain-module.schema.json"
LISTS = ["subjects", "topics", "glossary", "taskFormats", "checkRules",
         "frameworks", "references", "operators", "examFormats"]


def load_sources():
    module = {key: [] for key in LISTS}
    for path in sorted((ROOT / "katalog").glob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        for key, value in data.items():
            if key in LISTS:
                module[key].extend(value)
            elif key in module:
                raise SystemExit(f"{path.name}: Schlüssel '{key}' doppelt definiert")
            else:
                module[key] = value
    return module


def apply_defaults(module):
    for subject in module["subjects"]:
        subject.setdefault("moduleId", module["id"])
    topics = {t["id"]: t for t in module["topics"]}
    # subjectId vom Elternthema erben (Eltern stehen in der Datei vor den Kindern)
    for topic in module["topics"]:
        topic.setdefault("prerequisites", [])
        if "subjectId" not in topic and topic.get("parentId") in topics:
            topic["subjectId"] = topics[topic["parentId"]].get("subjectId")
    for fmt in module["taskFormats"]:
        fmt["requiredParts"] = [p["key"] for p in fmt.get("parts", []) if p["required"]]
    for entry in module["glossary"]:
        entry.setdefault("origin", "katalog")
    return module


def check_references(module):
    errors = []
    ids = {}

    def register(kind, item_id):
        if item_id in ids:
            errors.append(f"ID doppelt: {item_id} ({ids[item_id]} und {kind})")
        ids[item_id] = kind

    for key in LISTS:
        for item in module[key]:
            if "id" in item:
                register(key, item["id"])
    for fw in module["frameworks"]:
        for item in fw["items"]:
            register("framework-item", item["id"])

    def expect(owner, ref, kinds):
        if ref not in ids:
            errors.append(f"{owner}: Verweis auf unbekannte ID {ref}")
        elif ids[ref] not in kinds:
            errors.append(f"{owner}: {ref} ist {ids[ref]}, erwartet {kinds}")

    for ref in module.get("rechtsgrundlagen", []):
        expect("modul", ref, {"references"})
    for t in module["topics"]:
        expect(t["id"], t["subjectId"], {"subjects"})
        if "parentId" in t:
            expect(t["id"], t["parentId"], {"topics"})
        for r in t["prerequisites"]:
            expect(t["id"], r, {"topics"})
        for r in t.get("competencyIds", []):
            expect(t["id"], r, {"framework-item"})
        for r in t.get("referenceIds", []):
            expect(t["id"], r, {"references"})
        for r in t.get("taskFormatIds", []):
            expect(t["id"], r, {"taskFormats"})
    for g in module["glossary"]:
        for r in g.get("topicIds", []):
            expect(g.get("id", g["term"]), r, {"topics"})
    for f in module["taskFormats"]:
        for r in f.get("referenceIds", []):
            expect(f["id"], r, {"references"})
        for r in f.get("checkRuleIds", []):
            expect(f["id"], r, {"checkRules"})
    for c in module["checkRules"]:
        for r in c.get("scope", []):
            if r != "zusammenfassung":
                expect(c["id"], r, {"taskFormats"})
    for fw in module["frameworks"]:
        for r in fw.get("referenceIds", []):
            expect(fw["id"], r, {"references"})
        for item in fw["items"]:
            if "parentId" in item:
                expect(item["id"], item["parentId"], {"framework-item"})
    for e in module["examFormats"]:
        for r in e.get("competencyIds", []):
            expect(e["id"], r, {"framework-item"})
        for r in e.get("taskFormatIds", []):
            expect(e["id"], r, {"taskFormats"})
        for r in e.get("referenceIds", []):
            expect(e["id"], r, {"references"})

    # Ein Kind darf nicht Voraussetzung seines eigenen Elternthemas sein und umgekehrt;
    # Zyklen im Graphen aus parentId + prerequisites würden die Lernplanung blockieren.
    edges = {t["id"]: list(t["prerequisites"]) for t in module["topics"]}
    state = {}

    def visit(node, path):
        if state.get(node) == "done":
            return
        if state.get(node) == "active":
            errors.append("Zyklus in prerequisites: " + " -> ".join(path + [node]))
            return
        state[node] = "active"
        for nxt in edges.get(node, []):
            visit(nxt, path + [node])
        state[node] = "done"

    for node in edges:
        visit(node, [])
    return errors


def main():
    module = apply_defaults(load_sources())
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    errors = [f"Schema: {'/'.join(map(str, e.absolute_path))}: {e.message}"
              for e in Draft202012Validator(schema).iter_errors(module)]
    errors += check_references(module)
    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} Fehler – nichts geschrieben.")
        sys.exit(1)

    out = ROOT / f"{module['id']}.json"
    out.write_text(json.dumps(module, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    minutes = sum(t.get("estimatedMinutes", 0) for t in module["topics"])
    print(f"OK: {out.relative_to(REPO)}")
    for key in LISTS:
        print(f"  {key:12} {len(module[key]):4}")
    print(f"  Erstlernzeit laut Katalog: {minutes / 60:.0f} h")


if __name__ == "__main__":
    main()
