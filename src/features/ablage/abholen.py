#!/usr/bin/env python3
"""Setzt Dateien aus der Material-Ablage wieder zusammen und prüft sie.

Die Lernstoff-App lädt große Dateien in Teilen (je höchstens 15 MiB) in ein privates
GitHub-Repo. Jede Datei hat einen eigenen Ordner unter dateien/ mit manifest.json.

Aufruf im geklonten Material-Repo:
    python3 abholen.py                      # alle Dateien auflisten
    python3 abholen.py pflege-heute         # Ordner dateien/pflege-heute zusammensetzen
    python3 abholen.py --alle               # alle zusammensetzen
    python3 abholen.py pflege-heute -z /tmp/buecher

Ausgabe: standardmäßig nach ausgabe/<Originalname>. Bricht ab, wenn ein Teil fehlt
oder seine Prüfsumme (SHA-256) nicht zum Manifest passt.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

FORMAT = "lernstoff-ablage/1"


def manifeste(wurzel: Path):
    for m in sorted((wurzel / "dateien").glob("*/manifest.json")):
        daten = json.loads(m.read_text(encoding="utf-8"))
        if daten.get("format") == FORMAT:
            yield m.parent, daten


def zusammensetzen(ordner: Path, daten: dict, ziel: Path) -> Path:
    ziel.mkdir(parents=True, exist_ok=True)
    ausgabe = ziel / Path(daten["name"]).name
    gesamt = 0
    with open(ausgabe, "wb") as out:
        for teil in daten["teile"]:
            pfad = ordner / teil["datei"]
            if not pfad.exists():
                raise SystemExit(
                    f"Teil fehlt: {pfad}. Bei einem Sparse-Klon zuerst "
                    f"'git sparse-checkout add /dateien/{ordner.name}/' ausführen."
                )
            inhalt = pfad.read_bytes()
            if hashlib.sha256(inhalt).hexdigest() != teil["sha256"]:
                raise SystemExit(f"Prüfsumme stimmt nicht: {pfad}")
            out.write(inhalt)
            gesamt += len(inhalt)
    if gesamt != daten["groesse"]:
        raise SystemExit(f"Größe stimmt nicht: {ausgabe} hat {gesamt} statt {daten['groesse']} Bytes")
    return ausgabe


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("ordner", nargs="*", help="Ordnernamen unter dateien/")
    p.add_argument("--alle", action="store_true", help="alle Dateien zusammensetzen")
    p.add_argument("-z", "--ziel", default="ausgabe", help="Zielordner (Standard: ausgabe)")
    p.add_argument("-r", "--repo", default=".", help="Pfad zum Material-Repo (Standard: .)")
    a = p.parse_args()

    wurzel = Path(a.repo)
    alle = list(manifeste(wurzel))
    if not a.ordner and not a.alle:
        if not alle:
            print("Keine Dateien gefunden (dateien/*/manifest.json).")
        for ordner, d in alle:
            mb = d["groesse"] / 1024 / 1024
            info = " · ".join(x for x in (d.get("kategorie"), d.get("notiz")) if x)
            print(f"{ordner.name}\t{d['name']}\t{mb:.1f} MB\t{len(d['teile'])} Teil(e)" + (f"\t{info}" if info else ""))
        return

    gewuenscht = None if a.alle else set(a.ordner)
    gefunden = [(o, d) for o, d in alle if gewuenscht is None or o.name in gewuenscht]
    fehlend = (gewuenscht or set()) - {o.name for o, _ in gefunden}
    if fehlend:
        sys.exit(f"Nicht gefunden: {', '.join(sorted(fehlend))}")
    for ordner, d in gefunden:
        print(zusammensetzen(ordner, d, Path(a.ziel)))


if __name__ == "__main__":
    main()
