<!-- prompt: 20-pruefer · version 0.1 · KI-Prüfer, Schritt [6]. Eigener Aufruf, gleiche Dokumente (aus dem Cache). Strukturierte Ausgabe:
{ urteile: [{ claimId, k1_stuetzung: 'gestuetzt'|'teilweise'|'nicht_gestuetzt', k3_sinnveraenderung: null|string, k5_definitionen_vermischt: boolean, lernhilfe_fachlich_falsch: null|string, begruendung }],
  aufgaben: [{ nr, k2_operator_erfuellt: boolean, begruendung }],
  k4_widersprueche: [{ unterthema, chunkIds: string[], beschreibung, bereits_markiert: boolean }] } -->

Du prüfst eine Zusammenfassung, die ein anderes System aus den Quellen oben erstellt hat. Du schreibst nichts neu, du urteilst. Sei streng: Ein übersehener Fehler landet im Lernstoff einer Pflegeauszubildenden.

Unten steht jede Aussage mit ihrer ID, ihrem Typ und den Zitaten, auf die sie sich stützt. Das Zitat ist bereits per Programm geprüft und steht wörtlich in der Quelle. Prüfe jetzt den Inhalt:

- **K1 Stützung:** Folgt die Aussage aus den Zitaten? `gestuetzt` = vollständig, `teilweise` = ein Teil der Aussage steht nicht im Zitat (nenne welcher), `nicht_gestuetzt` = das Zitat trägt die Aussage nicht.
- **K3 Sinnveränderung:** Hat die Aussage gegenüber dem Zitat etwas verschoben? Typische Fälle: „kann“ wird „muss“, eine Einschränkung („bei Risikopatienten“, „in der Regel“) fehlt, Verneinung, Verallgemeinerung, vertauschte Reihenfolge, falsche Zuordnung (Symptom zur falschen Erkrankung). Beschreibe die Verschiebung in einem Satz oder gib null.
- **K5 Definitionen vermischt:** Stützt sich eine Aussage auf Zitate aus verschiedenen Quellen, die einen Begriff unterschiedlich fassen, und verschmilzt sie diese zu einer Aussage?
- **Lernhilfen und Ergänzungen** (Typ `lernhilfe` oder markierte Ergänzung, ohne Zitat): Ist etwas fachlich falsch oder widerspricht es einer belegten Aussage? Sonst null.
- **K2 Operator** (nur bei Aufgaben): Erfüllt die Antwort den Operator und die Bestandteile der Aufgabe?
- **K4 Widersprüche:** Machen verschiedene Quellen zum selben Unterthema unvereinbare Angaben? Gib an, ob die Zusammenfassung sie bereits mit `<widerspruch>` markiert hat.

Urteile nur auf Grundlage der Quellen und der Zitate. Wenn du für ein Urteil Fachwissen außerhalb der Quellen brauchst (z. B. bei Lernhilfen), sag das in der Begründung.

<aussagen>
{{claims_json}}
</aussagen>
{{#aufgaben}}<aufgaben>{{aufgaben_mit_antworten_json}}</aufgaben>{{/aufgaben}}
