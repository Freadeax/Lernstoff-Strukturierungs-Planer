// Leitfälle für Stufe 1 (geführt). Jeder Schritt folgt dem ABCDE-Vorgehen und dem Pflegeprozess:
// Ersteindruck → Einschätzung → Sofortmaßnahme → Hilfe holen → Übergabe → Anordnung → Wirkung → Dokumentation.
// Rolle: Auszubildende/r im ersten Jahr mit Praxisanleitung. Ärztliche Aufgaben (Diagnose, Verordnung,
// i.v.-Gabe ohne Aufsicht) liegen nicht bei der/dem Auszubildenden; das ist in den Optionen berücksichtigt.
// Fachlich ausgerichtet an den Quellen je Fall, didaktisch vereinfacht und bis zur Freigabe ungeprüft.

import type { Leitfall } from './typen';

const NEWS2 = 'Royal College of Physicians: National Early Warning Score (NEWS2), 2017';
const ABCDE = 'Resuscitation Council UK / ERC: ABCDE-Vorgehen';

export const LEITFAELLE: Leitfall[] = [
  {
    fall: 'nachtwache',
    rahmen: 'Nachtdienst auf der internistischen Station. Du bist im ersten Ausbildungsjahr, deine Praxisanleiterin Jana ist auf Station.',
    lernziele: ['Akute Atemnot nach ABCDE einschätzen', 'Zeichen einer Lungenstauung bei Herzinsuffizienz erkennen', 'Atemerleichternd lagern und früh eskalieren', 'Angeordnetes Diuretikum sicher vorbereiten und die Wirkung kontrollieren'],
    quellen: [ABCDE, NEWS2, 'ESC-Leitlinie Herzinsuffizienz 2021 (Update 2023)'],
    schritte: [
      {
        id: 'blick', phase: 'ersteindruck',
        lage: 'Es ist kurz nach drei Uhr. Herr Keller hat geklingelt. Er sitzt auf der Bettkante und ringt nach Luft.',
        frage: 'Du betrittst das Zimmer. Was machst du zuerst?',
        optionen: [
          { id: 'ansprechen', text: 'Ihn ansprechen und in wenigen Sekunden Bewusstsein, Atmung und Hautfarbe erfassen', wertung: 'gut', aktionen: ['assessment'], warum: 'Der Ersteindruck („Ist er wach? Atmet er? Wie sieht er aus?“) entscheidet in Sekunden, ob ein Notfall vorliegt.' },
          { id: 'messen', text: 'Sofort alle Vitalwerte am Gerät messen', wertung: 'vertretbar', aktionen: ['vitals'], zeigt: ['pulse', 'sys', 'dia', 'spo2', 'resp', 'temp'], warum: 'Messwerte sind wichtig, aber erst kommt der Blick auf den Menschen. Er kann dir in einem Satz sagen, was los ist.' },
          { id: 'hinlegen', text: 'Ihn bitten, sich wieder hinzulegen und zu schlafen', wertung: 'gefaehrlich', aktionen: ['flat'], warum: 'Im Liegen fließt mehr Blut zum Herzen zurück, die gestaute Lunge wird noch nasser. Atemnot im Liegen (Orthopnoe) ist ein Warnzeichen.' },
          { id: 'kurve', text: 'Erst im Dienstzimmer die Kurve lesen, dann wiederkommen', wertung: 'falsch', sekunden: 180, warum: 'Ein Patient mit akuter Atemnot wird nicht allein gelassen. Die Kurve kannst du später lesen oder dir bringen lassen.' },
        ],
      },
      {
        id: 'atmung', phase: 'b', mehrfach: 2,
        lage: 'Er spricht nur in kurzen Sätzen und stützt die Arme auf.',
        frage: 'Wie schätzt du die Atmung ein? Wähle bis zu zwei Schritte.',
        optionen: [
          { id: 'af', text: 'Atemfrequenz eine halbe Minute zählen und Atemmuster beobachten', wertung: 'gut', sekunden: 30, zeigt: ['resp'], befund: 'Schnelle, angestrengte Atmung mit Einsatz der Atemhilfsmuskulatur. Er kann nur wenige Worte am Stück sprechen.', warum: 'Die Atemfrequenz ist der früheste und empfindlichste Warnwert, wird aber am häufigsten nicht gezählt.' },
          { id: 'spo2', text: 'Sauerstoffsättigung mit dem Fingerclip messen', wertung: 'gut', sekunden: 20, zeigt: ['spo2'], befund: 'Der Clip zeigt eine erniedrigte Sättigung bei Raumluft.', warum: 'Die Sättigung zeigt, ob genug Sauerstoff im Blut ankommt. Sie zählt im NEWS2 und entscheidet über Sauerstoffgabe.' },
          { id: 'hoeren', text: 'Die Lunge abhören lassen bzw. selbst orientierend abhören', wertung: 'gut', sekunden: 45, befund: 'Beidseits feuchte Rasselgeräusche über den unteren Lungenabschnitten.', warum: 'Feuchte Rasselgeräusche basal passen zu Flüssigkeit in der Lunge (Lungenstauung).' },
          { id: 'peakflow', text: 'Peak-Flow messen lassen', wertung: 'falsch', sekunden: 60, befund: 'Er schafft es vor Atemnot kaum, in das Gerät zu pusten.', warum: 'Peak-Flow dient der Verlaufskontrolle bei Asthma. Bei akuter Atemnot quält er den Patienten und hilft hier nicht weiter.' },
        ],
      },
      {
        id: 'kreislauf', phase: 'c', mehrfach: 2,
        frage: 'Was prüfst du am Kreislauf? Wähle bis zu zwei Schritte.',
        optionen: [
          { id: 'rrpuls', text: 'Puls und Blutdruck messen', wertung: 'gut', aktionen: ['vitals'], zeigt: ['pulse', 'sys', 'dia', 'temp'], befund: 'Der Puls ist schnell, der Blutdruck erhöht.', warum: 'Puls und Blutdruck gehören zu jeder Einschätzung und zum NEWS2. Ein hoher Blutdruck ist bei einer Lungenstauung häufig.' },
          { id: 'beine', text: 'Beine ansehen und auf Ödeme drücken', wertung: 'gut', sekunden: 30, befund: 'Beide Unterschenkel sind geschwollen, eine Delle bleibt nach dem Drücken stehen.', warum: 'Beidseitige eindrückbare Ödeme sprechen für eine Wasseransammlung bei Herzschwäche.' },
          { id: 'bilanz', text: 'Gewicht und Ein- und Ausfuhr der letzten Tage ansehen', wertung: 'gut', aktionen: ['balance_review'], warum: 'Eine Gewichtszunahme von mehr als 2 kg in drei Tagen ist ein typisches Zeichen einer Dekompensation.' },
          { id: 'bz', text: 'Blutzucker messen', wertung: 'vertretbar', sekunden: 30, zeigt: ['glucose'], warum: 'Kann nicht schaden, beantwortet aber nicht die Frage nach der Ursache der Atemnot. Hier gibt es keinen Hinweis auf eine Stoffwechselentgleisung.' },
        ],
      },
      {
        id: 'lagern', phase: 'massnahme',
        frage: 'Was tust du sofort für Herrn Keller?',
        optionen: [
          { id: 'herzbett', text: 'Oberkörper hoch, Beine tief lagern (Herzbettlage), Arme abstützen', wertung: 'gut', aktionen: ['care'], warum: 'Weniger Blut strömt zum Herzen zurück, die Lunge wird entlastet und die Atemhilfsmuskulatur kann besser arbeiten.' },
          { id: 'flach', text: 'Flach lagern und die Beine hochlegen', wertung: 'gefaehrlich', aktionen: ['flat'], warum: 'Beine hoch wäre bei einem Schock richtig. Bei einer Lungenstauung verschlimmert es die Atemnot sofort.' },
          { id: 'fenster', text: 'Fenster öffnen und gut zureden', wertung: 'vertretbar', sekunden: 30, befund: 'Die frische Luft tut ihm gut, die Atemnot bleibt.', warum: 'Beruhigung und frische Luft helfen gegen die Angst, ersetzen aber keine atemerleichternde Lagerung.' },
          { id: 'trinken', text: 'Ein großes Glas Wasser zum Beruhigen geben', wertung: 'falsch', sekunden: 30, warum: 'Bei Herzinsuffizienz mit Wasseransammlung ist die Trinkmenge meist begrenzt. Trinken beruhigt die Atemnot nicht.' },
        ],
      },
      {
        id: 'hilfe', phase: 'hilfe',
        lage: 'Herr Keller ist kurzatmig und hat feuchte Rasselgeräusche. Sein NEWS2 liegt bei mindestens 7 Punkten.',
        frage: 'Wen informierst du, und wie dringend?',
        optionen: [
          { id: 'jana', text: 'Über die Rufanlage sofort Jana dazuholen, die mit dir die diensthabende Ärztin bzw. das Notfallteam verständigt', wertung: 'gut', aktionen: ['help'], befund: 'Jana ist nach einer Minute im Zimmer und greift zum Telefon.', warum: 'NEWS2 ab 7 bedeutet eine Notfallreaktion. Als Auszubildende/r holst du sofort die verantwortliche Pflegefachperson, die Ärztin wird ohne Verzögerung informiert.' },
          { id: 'met', text: 'Selbst das Notfallteam nach Hausregel alarmieren und bei ihm bleiben', wertung: 'gut', aktionen: ['met'], warum: 'Bei NEWS2 ab 7 ist das Notfallteam der richtige Weg. Jeder darf und soll es rufen. Informiere danach die Pflegefachperson.' },
          { id: 'morgen', text: 'Notieren und bei der Frühvisite ansprechen', wertung: 'gefaehrlich', folge: { text: 'Die Atemnot nimmt weiter zu. Ohne ärztliche Behandlung bleibt die Lungenstauung bestehen.', effekt: { spo2: -2, resp: 2 } }, sekunden: 60, warum: 'Eine akute Verschlechterung mit hohem NEWS2 duldet keinen Aufschub bis zur Visite.' },
          { id: 'fragen', text: 'Bei einer Mitschülerin nachfragen, ob das normal ist', wertung: 'falsch', sekunden: 90, warum: 'Unsicherheit ist richtig, aber die Frage gehört an die verantwortliche Pflegefachperson, nicht an eine Mitschülerin.' },
        ],
      },
      {
        id: 'sbar', phase: 'uebergabe',
        lage: 'Die Ärztin ist am Telefon und hat wenig Zeit.',
        frage: 'Welche Übergabe ist am besten?',
        optionen: [
          { id: 'gut', text: '„Herr Keller, 78, Zimmer 12, hat seit 03:00 akute Atemnot. Bekannte Herzinsuffizienz, plus 2 kg in drei Tagen. Atemfrequenz um 29, Sättigung um 89 % bei Raumluft, Puls um 112, RR um 156/90, basal feuchte Rasselgeräusche, Beinödeme. Ich vermute eine Lungenstauung. Bitte kommen Sie sofort.“', wertung: 'gut', aktionen: ['orders'], sbar: ['Herr Keller, 78 J., seit 03:00 akute Atemnot, Orthopnoe', 'Bekannte Herzinsuffizienz, +2,1 kg in drei Tagen, Ausfuhr rückläufig', 'AF um 29/min, SpO₂ um 89 % Raumluft, HF um 112, RR um 156/90, basal feuchte RGs, Beinödeme – V. a. Lungenstauung, NEWS2 mindestens 7', 'Bitte sofort ärztliche Beurteilung; Herzbettlage begonnen, bleibe beim Patienten'], warum: 'Situation, Hintergrund, Einschätzung mit Zahlen und eine klare Bitte: So kann die Ärztin sofort entscheiden.' },
          { id: 'vage', text: '„Herrn Keller geht es nicht so gut, er atmet komisch. Können Sie mal schauen, wenn Sie Zeit haben?“', wertung: 'falsch', aktionen: ['orders'], warum: 'Ohne Werte und ohne klare Dringlichkeit wird die Lage unterschätzt. „Wenn Sie Zeit haben“ verzögert die Behandlung.' },
          { id: 'diagnose', text: '„Herr Keller hat ein Lungenödem, er braucht sofort 40 mg Furosemid i.v.“', wertung: 'vertretbar', aktionen: ['orders'], warum: 'Die Dringlichkeit stimmt, aber die Diagnose und die Medikamentenwahl sind ärztliche Aufgaben. Nenne deine Beobachtungen und deine Einschätzung als Verdacht.' },
        ],
      },
      {
        id: 'warten', phase: 'verlauf',
        lage: 'Die Ärztin kommt in wenigen Minuten.',
        frage: 'Was machst du, bis sie da ist?',
        optionen: [
          { id: 'monitor', text: 'Bei ihm bleiben, Monitor anschließen und die Werte im Blick behalten', wertung: 'gut', aktionen: ['monitor'], zeigt: ['pulse', 'spo2', 'resp', 'sys', 'dia'], warum: 'Ein instabiler Patient bleibt nicht allein. Der Monitor zeigt Veränderungen sofort.' },
          { id: 'urin', text: 'Urinflasche bereitstellen und die Ausscheidung ab jetzt messen', wertung: 'gut', aktionen: ['urine'], warum: 'Nach einem Diuretikum muss die Ausscheidung gemessen werden. Die Vorbereitung spart später Zeit.' },
          { id: 'schreiben', text: 'Ins Dienstzimmer gehen und schon mal den Bericht schreiben', wertung: 'falsch', sekunden: 300, warum: 'Dokumentation ist wichtig, aber nicht jetzt. Bis die Ärztin da ist, gehört deine Aufmerksamkeit dem Patienten.' },
        ],
      },
      {
        id: 'furosemid', phase: 'anordnung', wartenAuf: 'orders',
        lage: 'Die Ärztin hat Herrn Keller untersucht. Anordnung: Furosemid 40 mg i.v., Ampulle 10 mg/ml, langsam über mindestens 10 Minuten. Sauerstoff nach Zielbereich.',
        frage: 'Wie setzt du die Anordnung um?',
        optionen: [
          { id: 'sicher', text: 'Gemeinsam mit Jana: Anordnung schriftlich prüfen, 8-R-Regel, 4 ml aufziehen, Jana gibt langsam, du beobachtest', wertung: 'gut', medikation: 'furosemide', warum: '40 mg ÷ 10 mg/ml = 4 ml. Intravenöse Gaben übernehmen Auszubildende nur unter direkter Aufsicht einer Pflegefachperson. Zu schnelles Spritzen kann das Gehör schädigen.' },
          { id: 'bolus', text: 'Die 4 ml schnell spritzen, damit es schneller wirkt', wertung: 'gefaehrlich', folge: { text: 'Eine schnelle Gabe von Furosemid kann Hörschäden und einen Blutdruckabfall auslösen. Jana stoppt dich.' }, warum: 'Furosemid i.v. langsam geben (höchstens etwa 4 mg pro Minute). Schneller wirkt es nicht, schadet aber.' },
          { id: 'rechnen', text: '40 ml aufziehen, das steht ja auf der Anordnung', wertung: 'gefaehrlich', folge: { text: '40 ml wären 400 mg, das Zehnfache der Dosis. Jana bemerkt den Rechenfehler beim Gegencheck.' }, warum: 'Immer Dosis und Volumen unterscheiden: Volumen = Dosis ÷ Konzentration. Das Vier-Augen-Prinzip fängt solche Fehler ab.' },
          { id: 'muendlich', text: 'Allein vorbereiten und geben, die Ärztin hat es ja gesagt', wertung: 'falsch', sekunden: 60, warum: 'Mündliche Anordnungen werden schriftlich bestätigt. Im ersten Jahr gibst du i.v. nichts ohne Aufsicht.' },
        ],
      },
      {
        id: 'wirkung', phase: 'verlauf', vorlauf: 15 * 60,
        lage: 'Eine Viertelstunde ist vergangen.',
        frage: 'Wie prüfst du, ob die Behandlung wirkt?',
        optionen: [
          { id: 'neu', text: 'Atemnot, Atemfrequenz, Sättigung, Blutdruck und Urinmenge erneut erheben und mit vorher vergleichen', wertung: 'gut', aktionen: ['reassess', 'vitals'], zeigt: ['pulse', 'sys', 'dia', 'spo2', 'resp'], warum: 'Nach jeder Maßnahme wird erneut beurteilt. Nach Furosemid achtest du besonders auf Blutdruckabfall und die Ausscheidung.' },
          { id: 'fragen', text: 'Nur fragen, ob es besser ist', wertung: 'vertretbar', sekunden: 20, befund: '„Ein bisschen besser.“', warum: 'Das Befinden zählt, reicht aber nicht. Zahlen zeigen, ob sich die Lage wirklich bessert.' },
          { id: 'schlafen', text: 'Licht aus, er soll jetzt schlafen', wertung: 'falsch', sekunden: 30, warum: 'Ohne erneute Einschätzung bleibt eine Verschlechterung unbemerkt.' },
        ],
      },
      {
        id: 'bericht', phase: 'doku',
        frage: 'Welcher Eintrag gehört in den Pflegebericht?',
        optionen: [
          { id: 'sachlich', text: '„03:05 akute Atemnot im Sitzen, AF erhöht, SpO₂ erniedrigt, basal feuchte RGs, Beinödeme. Herzbettlage, Ärztin und Notfallweg informiert, Furosemid 40 mg i.v. nach Anordnung unter Aufsicht. Ausscheidung wird gemessen, Wirkung kontrolliert.“', wertung: 'gut', notiz: '03:05 akute Atemnot im Sitzen, AF erhöht, SpO₂ erniedrigt, basal feuchte RGs, Beinödeme. Herzbettlage, Ärztin informiert, Furosemid 40 mg i.v. nach schriftlicher Anordnung unter Aufsicht. Ausscheidung wird gemessen, Wirkung kontrolliert.', warum: 'Beobachtung, Handlung und Wirkung mit Uhrzeit, sachlich und nachvollziehbar.' },
          { id: 'wertend', text: '„Pat. hatte nachts Panik, jetzt wieder ok.“', wertung: 'falsch', sekunden: 30, warum: 'Wertend und ohne Fakten. Niemand kann daraus ablesen, was passiert ist.' },
          { id: 'diagnose', text: '„Pat. hat Lungenödem, wurde behandelt.“', wertung: 'falsch', sekunden: 30, warum: 'Diagnosen stellt die Ärztin. Der Pflegebericht beschreibt, was du beobachtet und getan hast.' },
        ],
      },
    ],
  },
  {
    fall: 'pflegeheim',
    rahmen: 'Wohnbereich im Pflegeheim, kurz vor dem Mittagessen. Du bist im ersten Ausbildungsjahr, die Pflegefachkraft Herr Demir ist im Nachbarzimmer.',
    lernziele: ['Eine Unterzuckerung an ihren Zeichen erkennen', 'Vor der Gabe Wachheit und Schlucken prüfen', 'Richtig behandeln: schnell, dann langsam wirksame Kohlenhydrate, nachmessen', 'Insulin zurückhalten und ärztlich abstimmen'],
    quellen: [ABCDE, 'Deutsche Diabetes Gesellschaft: Praxisempfehlung Hypoglykämie', 'Expertenstandard Ernährungsmanagement (DNQP)'],
    schritte: [
      {
        id: 'blick', phase: 'ersteindruck',
        lage: 'Herr Winter sitzt im Rollstuhl am Tisch. Er ist blass, schwitzt und wirkt plötzlich unruhig.',
        frage: 'Was machst du zuerst?',
        optionen: [
          { id: 'ansprechen', text: 'Ihn ansprechen und ansehen: Ist er wach? Wie sieht die Haut aus? Zittert er?', wertung: 'gut', aktionen: ['assessment'], warum: 'Blässe, kalter Schweiß, Zittern und Unruhe bei einem Menschen mit Insulin: Daran musst du sofort denken.' },
          { id: 'essen', text: 'Das Mittagessen servieren, dann geht es ihm sicher besser', wertung: 'falsch', sekunden: 120, warum: 'Ohne Einschätzung weißt du nicht, ob er überhaupt sicher essen kann. Eine Mahlzeit hebt den Zucker außerdem zu langsam.' },
          { id: 'alles', text: 'Alle Vitalzeichen einzeln messen', wertung: 'vertretbar', aktionen: ['vitals'], zeigt: ['pulse', 'sys', 'dia', 'spo2', 'resp', 'temp'], warum: 'Richtig, aber langsam. Bei diesen Zeichen ist der Blutzucker der wichtigste Wert.' },
        ],
      },
      {
        id: 'bz', phase: 'd',
        frage: 'Herr Winter spritzt Insulin. Was prüfst du jetzt sofort?',
        optionen: [
          { id: 'bz', text: 'Blutzucker kapillär messen', wertung: 'gut', sekunden: 40, zeigt: ['glucose'], befund: 'Das Gerät zeigt einen deutlich zu niedrigen Wert.', warum: 'Unter 70 mg/dl (3,9 mmol/l) liegt eine Unterzuckerung vor. Ohne Messung behandelst du blind.' },
          { id: 'temp', text: 'Fieber messen', wertung: 'falsch', sekunden: 60, zeigt: ['temp'], warum: 'Schwitzen kommt auch bei Fieber vor, aber Zittern, Blässe und Insulin weisen auf den Blutzucker.' },
          { id: 'plan', text: 'Insulinplan und Essprotokoll lesen', wertung: 'vertretbar', aktionen: ['insulinplan'], warum: 'Wichtig für die Ursache, aber erst nach der Messung. Die Behandlung darf nicht warten.' },
        ],
      },
      {
        id: 'schlucken', phase: 'a',
        lage: 'Der Blutzucker ist zu niedrig.',
        frage: 'Bevor du ihm etwas gibst: Was klärst du?',
        optionen: [
          { id: 'pruefen', text: 'Ob er wach ist und sicher schlucken kann', wertung: 'gut', aktionen: ['swallow'], befund: 'Er antwortet, hält den Kopf selbst und schluckt einen kleinen Schluck Wasser ohne Husten.', warum: 'Orale Kohlenhydrate nur bei Wachheit und sicherem Schlucken, sonst droht Aspiration.' },
          { id: 'sofort', text: 'Nichts klären, sofort Saft in den Mund geben', wertung: 'vertretbar', sekunden: 10, warum: 'Er ist hier wach. Trotzdem: Die Schluckprüfung dauert Sekunden und schützt vor Aspiration.' },
          { id: 'insulin', text: 'Erst das Mittagsinsulin spritzen, damit er gleich essen kann', wertung: 'gefaehrlich', aktionen: ['insulin_given'], warum: 'Insulin senkt den Blutzucker weiter. Bei einer Unterzuckerung wird kein Insulin gegeben, bis ärztlich neu entschieden ist.' },
        ],
      },
      {
        id: 'zucker', phase: 'massnahme',
        frage: 'Was gibst du ihm?',
        optionen: [
          { id: 'schnell', text: '15–20 g schnell wirksame Kohlenhydrate, z. B. Traubenzucker oder etwa 150–200 ml Fruchtsaft', wertung: 'gut', aktionen: ['care'], befund: 'Herr Winter trinkt den Saft in kleinen Schlucken.', warum: 'Traubenzucker und Saft gehen schnell ins Blut. Die Menge folgt der Haus-SOP.' },
          { id: 'schoko', text: 'Ein Stück Schokolade', wertung: 'falsch', sekunden: 60, folge: { text: 'Der Zucker steigt kaum. Fett in der Schokolade verzögert die Aufnahme.', effekt: { glucose: 4 } }, warum: 'Schokolade enthält viel Fett und wirkt deshalb zu langsam.' },
          { id: 'light', text: 'Ein Glas Cola light', wertung: 'falsch', sekunden: 30, warum: 'Light-Getränke enthalten keinen Zucker und helfen nicht.' },
        ],
      },
      {
        id: 'hilfe', phase: 'hilfe',
        frage: 'Wen informierst du?',
        optionen: [
          { id: 'fachkraft', text: 'Herrn Demir dazuholen; er informiert den Hausarzt bzw. ärztlichen Dienst', wertung: 'gut', aktionen: ['help'], befund: 'Herr Demir übernimmt das Telefonat und bittet dich, bei Herrn Winter zu bleiben.', warum: 'Eine Unterzuckerung bei Insulin muss ärztlich besprochen werden: Ursache und nächste Insulindosis.' },
          { id: 'notruf', text: 'Sofort 112 anrufen', wertung: 'vertretbar', sekunden: 60, warum: 'Richtig, wenn er nicht mehr wach ist oder nicht schlucken kann. Solange er wach ist und trinkt, reichen Behandlung, Nachmessen und ärztliche Rücksprache.' },
          { id: 'niemand', text: 'Niemand, das Problem ist ja behoben', wertung: 'falsch', sekunden: 10, warum: 'Die Ursache ist nicht geklärt, und das nächste Insulin droht die nächste Unterzuckerung auszulösen.' },
        ],
      },
      {
        id: 'nachmessen', phase: 'verlauf', vorlauf: 12 * 60,
        lage: 'Eine Viertelstunde nach dem Saft.',
        frage: 'Was tust du jetzt?',
        optionen: [
          { id: 'messen', text: 'Blutzucker nachmessen und ihn erneut ansehen', wertung: 'gut', aktionen: ['reassess'], zeigt: ['glucose', 'pulse'], warum: 'Nach 15 Minuten nachmessen. Liegt der Wert noch unter 70 mg/dl, wird die Gabe wiederholt.' },
          { id: 'fertig', text: 'Nichts mehr, es geht ihm sichtlich besser', wertung: 'falsch', sekunden: 30, warum: 'Besser aussehen heißt nicht stabil. Schnelle Kohlenhydrate wirken nur kurz.' },
        ],
      },
      {
        id: 'mahlzeit', phase: 'massnahme',
        frage: 'Wie geht es weiter?',
        optionen: [
          { id: 'brot', text: 'Langsam wirksame Kohlenhydrate anbieten, z. B. Brot oder das Mittagessen', wertung: 'gut', aktionen: ['meal'], warum: 'Langsam wirksame Kohlenhydrate halten den Blutzucker, nachdem der Traubenzucker verbraucht ist.' },
          { id: 'insulin', text: 'Mittagsinsulin nach Plan spritzen, jetzt isst er ja', wertung: 'gefaehrlich', aktionen: ['insulin_given'], warum: 'Nach einer Unterzuckerung wird die nächste Insulindosis ärztlich neu festgelegt, nicht nach altem Plan gegeben.' },
          { id: 'nichts', text: 'Abwarten bis zum Abendessen', wertung: 'falsch', sekunden: 30, warum: 'Ohne weitere Kohlenhydrate droht eine erneute Unterzuckerung.' },
        ],
      },
      {
        id: 'bericht', phase: 'doku',
        frage: 'Welcher Eintrag gehört in den Pflegebericht?',
        optionen: [
          { id: 'sachlich', text: '„11:20 blass, schwitzig, zittrig. BZ erniedrigt. Wach, Schlucken sicher, 200 ml Saft. Nach 15 min BZ kontrolliert, Brot gegessen. Herr Demir und Hausarzt informiert, Mittagsinsulin bis zur Rückmeldung zurückgestellt.“', wertung: 'gut', notiz: '11:20 blass, schwitzig, zittrig. BZ erniedrigt. Wach, Schlucken sicher, 200 ml Saft. Nach 15 min BZ kontrolliert, Brot gegessen. Pflegefachkraft und Hausarzt informiert, Mittagsinsulin bis zur ärztlichen Rückmeldung zurückgestellt.', warum: 'Zeitpunkt, Werte, Maßnahme, Kontrolle und Absprache: So kann der nächste Dienst daran anknüpfen.' },
          { id: 'kurz', text: '„Hypo gehabt, Saft gegeben.“', wertung: 'falsch', sekunden: 20, warum: 'Es fehlen Zeit, Werte, Kontrolle und die Absprache zum Insulin.' },
        ],
      },
    ],
  },
  {
    fall: 'asthma',
    rahmen: 'Kinderstation am Nachmittag. Du bist im ersten Ausbildungsjahr, die Pflegefachperson Sara ist auf Station.',
    lernziele: ['Einen schweren Asthmaanfall bei einem Kind erkennen', 'Atemerleichternd lagern, ohne zu schaden', 'Früh ärztlich hinzuziehen, wenn das Notfallspray nicht wirkt', 'Erschöpfung („stille Lunge“) nicht mit Besserung verwechseln'],
    quellen: [ABCDE, 'Nationale VersorgungsLeitlinie Asthma, 4. Auflage', 'GINA 2024: Akutes Asthma bei Kindern'],
    schritte: [
      {
        id: 'blick', phase: 'ersteindruck',
        lage: 'Ben (7) sitzt vornübergebeugt im Bett und stützt die Arme auf. Beim Ausatmen pfeift es. Seine Mutter ist bei ihm.',
        frage: 'Was machst du zuerst?',
        optionen: [
          { id: 'ansehen', text: 'Ruhig ansprechen und ansehen: Wie spricht er? Wie atmet er? Welche Farbe haben die Lippen?', wertung: 'gut', aktionen: ['assessment'], warum: 'Der Ersteindruck zeigt die Schwere: Kann ein Kind nur noch einzelne Wörter sprechen, ist der Anfall schwer.' },
          { id: 'fieber', text: 'Fieber messen', wertung: 'falsch', sekunden: 60, zeigt: ['temp'], warum: 'Die Atemnot steht im Vordergrund. Fieber ist hier nachrangig.' },
          { id: 'mutter', text: 'Die Mutter bitten, draußen zu warten', wertung: 'falsch', sekunden: 30, warum: 'Die Mutter gibt Sicherheit und kennt den Notfallplan. Angst verschlimmert die Atemnot.' },
        ],
      },
      {
        id: 'atmung', phase: 'b', mehrfach: 2,
        frage: 'Wie schätzt du die Atmung ein? Wähle bis zu zwei Schritte.',
        optionen: [
          { id: 'sprechen', text: 'Sprechfähigkeit und Atemarbeit beurteilen (Einziehungen, Nasenflügeln)', wertung: 'gut', aktionen: ['talk'], warum: 'Nur Drei-Wort-Sätze und Einziehungen zeigen einen schweren Anfall.' },
          { id: 'werte', text: 'Atemfrequenz zählen und Sättigung messen', wertung: 'gut', sekunden: 45, zeigt: ['resp', 'spo2', 'pulse'], befund: 'Schnelle Atmung, die Sättigung ist erniedrigt, der Puls schnell.', warum: 'Bei Kindern zählen die altersabhängigen Normwerte. Eine Sättigung unter 92 % ist beim Asthmaanfall ein Zeichen für einen schweren Anfall.' },
          { id: 'hoeren', text: 'Abhören lassen bzw. hinhören', wertung: 'gut', sekunden: 45, befund: 'Pfeifendes Ausatmen (Giemen) beidseits, die Ausatmung ist verlängert.', warum: 'Giemen und verlängerte Ausatmung zeigen die verengten Atemwege.' },
          { id: 'tuete', text: 'In eine Tüte atmen lassen, er atmet ja zu schnell', wertung: 'gefaehrlich', aktionen: ['bag'], warum: 'Ben hyperventiliert nicht, seine Atemwege sind eng. Tütenatmung senkt den Sauerstoff weiter.' },
        ],
      },
      {
        id: 'lagern', phase: 'massnahme',
        frage: 'Wie hilfst du Ben beim Atmen?',
        optionen: [
          { id: 'kutscher', text: 'Aufrecht sitzen lassen, Arme abstützen, ruhig ausatmen lassen', wertung: 'gut', aktionen: ['care'], befund: 'Ben stützt die Arme auf das Kissen und pustet „wie eine Kerze, die nicht ausgehen soll“.', warum: 'Aufrechtes Sitzen mit abgestützten Armen erleichtert die Atemhilfsmuskulatur. Ruhe senkt den Sauerstoffbedarf.' },
          { id: 'flach', text: 'Hinlegen, damit er sich ausruht', wertung: 'gefaehrlich', aktionen: ['flat'], warum: 'Im Liegen kann Ben die Atemhilfsmuskulatur nicht nutzen. Die Atemnot nimmt zu.' },
          { id: 'trinken', text: 'Viel trinken lassen, das löst den Schleim', wertung: 'falsch', sekunden: 30, warum: 'Trinken löst keinen Asthmaanfall. Bei schwerer Atemnot kann er sich verschlucken.' },
        ],
      },
      {
        id: 'plan', phase: 'e',
        frage: 'Was fragst du die Mutter?',
        optionen: [
          { id: 'notfallplan', text: 'Notfallplan und wie oft das Notfallspray heute schon gebraucht wurde', wertung: 'gut', aktionen: ['plan'], warum: 'Hilft das Notfallspray nicht wie sonst, ist das ein Warnzeichen für einen schweren Anfall.' },
          { id: 'impfung', text: 'Ob Ben alle Impfungen hat', wertung: 'falsch', sekunden: 30, warum: 'Für die akute Lage nicht entscheidend.' },
        ],
      },
      {
        id: 'hilfe', phase: 'hilfe',
        lage: 'Ben hatte heute schon viermal zwei Hübe. Das Spray hilft kaum noch.',
        frage: 'Was tust du?',
        optionen: [
          { id: 'sofort', text: 'Sara und die Kinderärztin sofort rufen, bei Ben bleiben', wertung: 'gut', aktionen: ['help'], warum: 'Ein schwerer Anfall, bei dem das Notfallspray nicht wirkt, braucht sofort ärztliche Behandlung.' },
          { id: 'sprayen', text: 'Die Mutter noch einmal zwei Hübe geben lassen und 30 Minuten abwarten', wertung: 'gefaehrlich', folge: { text: 'Die Atemnot nimmt zu, wertvolle Zeit vergeht.', effekt: { spo2: -2, resp: 3 } }, sekunden: 300, warum: 'Der Notfallplan sagt: Ohne Besserung nach 10 Minuten Arzt. Abwarten verzögert die Behandlung.' },
          { id: 'spaeter', text: 'Bei der nächsten Runde wieder vorbeischauen', wertung: 'gefaehrlich', folge: { text: 'Ben bleibt mit einem schweren Anfall unbeobachtet.', effekt: { spo2: -3 } }, sekunden: 300, warum: 'Ein Kind mit schwerer Atemnot bleibt nicht allein.' },
        ],
      },
      {
        id: 'sbar', phase: 'uebergabe',
        frage: 'Welche Meldung an die Kinderärztin ist am besten?',
        optionen: [
          { id: 'gut', text: '„Ben, 7, Zimmer 4, schwerer Asthmaanfall: spricht nur Drei-Wort-Sätze, Einziehungen, Sättigung um 91 %, AF um 34. Heute viermal Salbutamol ohne Wirkung. Ich habe ihn aufrecht gelagert. Bitte kommen Sie sofort.“', wertung: 'gut', aktionen: ['orders'], sbar: ['Ben, 7 J., schwerer Asthmaanfall, Drei-Wort-Sätze', 'Bekanntes Asthma, Infekt, heute 4× 2 Hübe Salbutamol ohne ausreichende Wirkung', 'SpO₂ um 91 %, AF um 34, Einziehungen, Giemen – schwerer Anfall', 'Bitte sofort ärztliche Beurteilung; aufrecht gelagert, bleibe beim Kind'], warum: 'Alle Warnzeichen mit Zahlen und eine klare Bitte.' },
          { id: 'vage', text: '„Ben hat wieder Asthma. Können Sie gelegentlich vorbeikommen?“', wertung: 'falsch', aktionen: ['orders'], warum: 'Die Schwere wird nicht deutlich. Es fehlen die Warnzeichen.' },
        ],
      },
      {
        id: 'sauerstoff', phase: 'b',
        frage: 'Die Ärztin ist unterwegs. Die Sättigung bleibt niedrig. Was bereitest du vor?',
        optionen: [
          { id: 'o2', text: 'Sauerstoff über eine Kindermaske nach Hausstandard, Ziel um 94–98 %', wertung: 'gut', aktionen: ['oxygen'], warum: 'Beim schweren Asthmaanfall bekommen Kinder mit erniedrigter Sättigung Sauerstoff. Der Notfallstandard der Station regelt den Start.' },
          { id: 'vernebler', text: 'Den Vernebler vorbereiten, damit die Inhalation sofort starten kann', wertung: 'gut', sekunden: 60, befund: 'Vernebler, Maske und NaCl liegen bereit.', warum: 'Vorbereiten spart Zeit. Das Medikament selbst ordnet die Ärztin an.' },
          { id: 'nichts', text: 'Nichts, die Ärztin entscheidet alles', wertung: 'falsch', sekunden: 60, warum: 'Vorbereiten und Sauerstoff nach Standard gehören zu deinen pflegerischen Aufgaben.' },
        ],
      },
      {
        id: 'erschoepfung', phase: 'verlauf', wartenAuf: 'orders',
        lage: 'Die Inhalation nach ärztlicher Anordnung läuft.',
        frage: 'Woran erkennst du, ob es Ben besser oder schlechter geht?',
        optionen: [
          { id: 'zeichen', text: 'Sprechen, Atemarbeit, Sättigung, Puls und Wachheit eng beobachten, Monitor anschließen', wertung: 'gut', aktionen: ['monitor'], zeigt: ['spo2', 'resp', 'pulse'], warum: 'Besserung zeigt sich in ganzen Sätzen und weniger Einziehungen. Der Puls steigt durch Salbutamol oft an.' },
          { id: 'leiser', text: 'Das Pfeifen wird leiser, also wird es besser. Zimmer verlassen.', wertung: 'gefaehrlich', folge: { text: 'Leiser werdendes Giemen mit flacher Atmung kann Erschöpfung bedeuten. Ben bleibt unbeobachtet.' }, sekunden: 120, warum: 'Eine „stille Lunge“ bei weiter bestehender Atemnot ist ein Alarmzeichen, keine Besserung.' },
        ],
      },
      {
        id: 'bericht', phase: 'doku',
        frage: 'Welcher Eintrag passt in den Pflegebericht?',
        optionen: [
          { id: 'sachlich', text: '„15:10 Atemnot, Drei-Wort-Sätze, Einziehungen, Giemen. SpO₂ und AF dokumentiert, 4× Salbutamol ohne Wirkung. Aufrecht gelagert, Kinderärztin informiert, Inhalation nach Anordnung, Monitoring. Mutter anwesend.“', wertung: 'gut', notiz: '15:10 Atemnot, Drei-Wort-Sätze, Einziehungen, Giemen. SpO₂ und AF dokumentiert, heute 4× Salbutamol ohne ausreichende Wirkung. Aufrecht gelagert, Kinderärztin informiert, Inhalation nach Anordnung, Monitoring. Mutter anwesend.', warum: 'Beobachtung, Maßnahme, Information und Verlauf sachlich festgehalten.' },
          { id: 'kurz', text: '„Asthma, Arzt da.“', wertung: 'falsch', sekunden: 20, warum: 'Zu knapp. Es fehlen Zeit, Zeichen, Maßnahmen und Verlauf.' },
        ],
      },
    ],
  },
  {
    fall: 'sepsis',
    rahmen: 'Frühdienst auf der Normalstation. Du bist im ersten Ausbildungsjahr, deine Praxisanleiterin Frau Yıldız ist auf Station.',
    lernziele: ['Neue Verwirrtheit als Warnzeichen ernst nehmen', 'Vitalzeichen vollständig erheben und NEWS2 einordnen', 'Bei Verdacht auf Sepsis ohne Verzögerung eskalieren', 'Diagnostik und Therapie zügig unterstützen'],
    quellen: [ABCDE, NEWS2, 'S3-Leitlinie Sepsis (AWMF 079-001)', 'Surviving Sepsis Campaign 2021'],
    schritte: [
      {
        id: 'blick', phase: 'ersteindruck',
        lage: 'Frau Hahn (81) zupft an der Bettdecke und weiß nicht, wo sie ist. Gestern war sie laut Übergabe voll orientiert. Ihre Haut ist heiß.',
        frage: 'Was machst du zuerst?',
        optionen: [
          { id: 'ansprechen', text: 'Ansprechen, Bewusstsein und Atmung einschätzen, Haut ansehen', wertung: 'gut', aktionen: ['assessment'], warum: 'Der Ersteindruck zeigt: verlangsamt, schnelle Atmung, heiße Haut. Das ist eine akute Veränderung.' },
          { id: 'alter', text: 'Das ist im Alter so, später wiederkommen', wertung: 'gefaehrlich', aktionen: ['waited'], warum: 'Neue Verwirrtheit ist nie „normal im Alter“. Sie kann das erste Zeichen einer Sepsis sein.' },
          { id: 'fixieren', text: 'Bettgitter hochziehen, damit sie nicht aufsteht', wertung: 'falsch', sekunden: 30, warum: 'Das löst nicht das Problem und ist ohne richterliche Genehmigung oder Einwilligung eine freiheitsentziehende Maßnahme.' },
        ],
      },
      {
        id: 'bewusstsein', phase: 'd',
        frage: 'Wie prüfst du das Bewusstsein?',
        optionen: [
          { id: 'orient', text: 'Orientierung zu Ort, Zeit und Person prüfen und mit gestern vergleichen', wertung: 'gut', aktionen: ['orient'], warum: 'Neu aufgetretene Verwirrtheit zählt im NEWS2 mit 3 Punkten (C in ACVPU).' },
          { id: 'schlafen', text: 'Sie schlafen lassen, sie ist bestimmt nur müde', wertung: 'falsch', sekunden: 30, warum: 'Müdigkeit und Verwirrtheit bei Fieber sind Warnzeichen, keine Erklärung.' },
        ],
      },
      {
        id: 'vital', phase: 'c',
        frage: 'Was misst du?',
        optionen: [
          { id: 'alle', text: 'Alle Vitalzeichen: Atemfrequenz, Sättigung, Blutdruck, Puls, Temperatur', wertung: 'gut', aktionen: ['vitals'], zeigt: ['resp', 'spo2', 'sys', 'dia', 'pulse', 'temp'], warum: 'Erst alle Werte zusammen ergeben den NEWS2. Hier: schnelle Atmung, niedriger Blutdruck, schneller Puls, Fieber.' },
          { id: 'temp', text: 'Nur Fieber messen, das ist ja das Problem', wertung: 'falsch', sekunden: 60, zeigt: ['temp'], warum: 'Fieber allein sagt wenig. Atemfrequenz und Blutdruck zeigen, wie gefährlich die Lage ist.' },
        ],
      },
      {
        id: 'urin', phase: 'e', mehrfach: 2,
        frage: 'Was schaust du dir noch an? Wähle bis zu zwei Schritte.',
        optionen: [
          { id: 'beutel', text: 'Urinbeutel und Katheter', wertung: 'gut', aktionen: ['urine_look'], warum: 'Wenig, trüber Urin weist auf die Infektquelle und eine schlechte Nierendurchblutung hin.' },
          { id: 'haut', text: 'Haut an Knien und Füßen', wertung: 'gut', sekunden: 30, befund: 'Die Knie sind marmoriert, Hände und Füße kühl, der Körper heiß.', warum: 'Marmorierte Haut zeigt eine gestörte Durchblutung, ein Zeichen für Kreislaufversagen.' },
          { id: 'zimmer', text: 'Das Zimmer aufräumen', wertung: 'falsch', sekunden: 60, warum: 'Hilft Frau Hahn nicht.' },
        ],
      },
      {
        id: 'hilfe', phase: 'hilfe',
        lage: 'Fieber, neue Verwirrtheit, schnelle Atmung, niedriger Blutdruck. Ihr NEWS2 liegt bei mindestens 7 Punkten.',
        frage: 'Was tust du?',
        optionen: [
          { id: 'sofort', text: 'Sofort Frau Yıldız holen; die Ärztin bzw. das Notfallteam wird ohne Verzögerung gerufen', wertung: 'gut', aktionen: ['help'], warum: 'Verdacht auf Sepsis ist ein Notfall. Jede Stunde ohne Behandlung erhöht das Sterberisiko.' },
          { id: 'visite', text: 'Bis zur Visite in drei Stunden abwarten', wertung: 'gefaehrlich', aktionen: ['waited'], warum: 'Abwarten verschiebt eine zeitkritische Behandlung.' },
          { id: 'fieber', text: 'Erst ein fiebersenkendes Zäpfchen geben', wertung: 'falsch', sekunden: 60, warum: 'Fiebersenken behandelt nicht die Ursache, ist ohne Anordnung nicht erlaubt und verschleiert den Verlauf.' },
        ],
      },
      {
        id: 'sbar', phase: 'uebergabe',
        frage: 'Welche Meldung an die Ärztin ist am besten?',
        optionen: [
          { id: 'gut', text: '„Frau Hahn, 81, Zimmer 7, seit heute Morgen neu verwirrt. Harnwegsinfekt mit Katheter. Temperatur um 38,7, AF um 23, RR um 104/60, Puls um 108, marmorierte Knie, kaum Urin. NEWS2 mindestens 7. Ich vermute eine Sepsis. Bitte kommen Sie sofort.“', wertung: 'gut', aktionen: ['orders'], sbar: ['Frau Hahn, 81 J., seit heute Morgen neu verwirrt', 'Harnwegsinfekt, Blasenkatheter, gestern orientiert', 'T um 38,7, AF um 23, RR um 104/60, HF um 108, Marmorierung, Oligurie – V. a. Sepsis, NEWS2 mindestens 7', 'Bitte sofort ärztliche Beurteilung'], warum: 'Klare Werte, klare Vermutung, klare Bitte.' },
          { id: 'vage', text: '„Frau Hahn ist heute etwas durcheinander und hat Fieber.“', wertung: 'falsch', aktionen: ['orders'], warum: 'So klingt es harmlos. Die Werte, die eine Sepsis zeigen, fehlen.' },
        ],
      },
      {
        id: 'vorbereiten', phase: 'massnahme',
        frage: 'Die Ärztin kommt. Was bereitest du vor?',
        optionen: [
          { id: 'material', text: 'Monitor anschließen, Material für Blutkulturen, Labor und Infusion bereitlegen, Bilanz beginnen', wertung: 'gut', aktionen: ['monitor', 'care'], zeigt: ['pulse', 'spo2', 'resp', 'sys', 'dia'], warum: 'Bei Sepsis zählt die erste Stunde. Wenn alles bereitliegt, können Blutkulturen, Laktat, Flüssigkeit und Antibiotikum ohne Verzögerung beginnen.' },
          { id: 'waschen', text: 'Erst die Grundpflege beenden', wertung: 'falsch', sekunden: 600, warum: 'Die Grundpflege kann warten, die Sepsisbehandlung nicht.' },
        ],
      },
      {
        id: 'reihenfolge', phase: 'anordnung', wartenAuf: 'orders',
        lage: 'Die Ärztin ordnet Blutkulturen, Laktat, Infusion und ein Antibiotikum an.',
        frage: 'Was ist bei der Reihenfolge wichtig?',
        optionen: [
          { id: 'richtig', text: 'Blutkulturen möglichst vor dem Antibiotikum abnehmen, aber das Antibiotikum dadurch nicht verzögern', wertung: 'gut', aktionen: ['lab'], warum: 'Blutkulturen vor der ersten Dosis zeigen den Erreger. Die Antibiotikagabe soll trotzdem innerhalb der ersten Stunde beginnen.' },
          { id: 'warten', text: 'Mit dem Antibiotikum warten, bis die Laborwerte da sind', wertung: 'gefaehrlich', folge: { text: 'Der Beginn der Therapie verzögert sich um fast eine Stunde.', effekt: { sys: -6, pulse: 6 } }, sekunden: 120, warum: 'Bei Verdacht auf Sepsis wartet die Antibiotikagabe nicht auf Laborwerte.' },
          { id: 'egal', text: 'Reihenfolge egal', wertung: 'falsch', sekunden: 30, warum: 'Nach der ersten Antibiotikadosis wachsen Erreger in der Blutkultur oft nicht mehr an.' },
        ],
      },
      {
        id: 'wirkung', phase: 'verlauf', vorlauf: 15 * 60,
        frage: 'Die Infusion läuft. Wie überwachst du Frau Hahn?',
        optionen: [
          { id: 'eng', text: 'Vitalzeichen, Bewusstsein und Urinmenge engmaschig kontrollieren und Veränderungen sofort melden', wertung: 'gut', aktionen: ['reassess'], zeigt: ['sys', 'dia', 'pulse', 'resp', 'spo2'], warum: 'Ob die Behandlung wirkt, zeigen Blutdruck, Puls, Bewusstsein und Ausscheidung.' },
          { id: 'normal', text: 'Wieder normale Runde, die Ärztin kümmert sich', wertung: 'falsch', sekunden: 60, warum: 'Die Überwachung ist eine pflegerische Kernaufgabe. Ohne sie bleibt ein septischer Schock unbemerkt.' },
        ],
      },
      {
        id: 'bericht', phase: 'doku',
        frage: 'Welcher Eintrag passt?',
        optionen: [
          { id: 'sachlich', text: '„07:10 neu desorientiert, T 38,7, AF, RR und Puls auffällig, Knie marmoriert, Urin trüb und wenig. Ärztin sofort informiert, Blutkulturen, Labor, Infusion und Antibiotikum nach Anordnung, Monitoring und Bilanz.“', wertung: 'gut', notiz: '07:10 neu desorientiert, T 38,7, AF, RR und Puls auffällig, Knie marmoriert, Urin trüb und wenig. Ärztin sofort informiert, Blutkulturen, Labor, Infusion und Antibiotikum nach Anordnung, Monitoring und Bilanz begonnen.', warum: 'Zeit, Beobachtung, Information, Maßnahme: sachlich und vollständig.' },
          { id: 'kurz', text: '„Pat. verwirrt, Fieber.“', wertung: 'falsch', sekunden: 20, warum: 'Es fehlen Werte, Information und Maßnahmen.' },
        ],
      },
    ],
  },
  {
    fall: 'aufwachraum',
    rahmen: 'Aufwachraum nach einer Gallenblasen-OP. Du bist im ersten Ausbildungsjahr und arbeitest mit der Anästhesiepflegekraft Frau Berger.',
    start: ['monitor'],
    lernziele: ['Opioidbedingte Atemdepression erkennen', 'Den Atemweg frei halten', 'Sofort die Anästhesie rufen', 'Erst nach festen Kriterien verlegen'],
    quellen: [ABCDE, 'DGAI: Empfehlungen zur Überwachung im Aufwachraum', 'Aldrete-Score (modifiziert)'],
    schritte: [
      {
        id: 'blick', phase: 'ersteindruck',
        lage: 'Frau Vogt schnarcht laut. Der Monitor zeigt eine Sättigung knapp unter 90 % trotz 2 l/min Sauerstoff.',
        frage: 'Was machst du zuerst?',
        optionen: [
          { id: 'ansprechen', text: 'Laut ansprechen und die Atmung beobachten: Frequenz, Tiefe, Pausen', wertung: 'gut', aktionen: ['assessment'], zeigt: ['resp', 'spo2'], warum: 'Sie öffnet nur kurz die Augen und atmet langsam und flach. Atemfrequenz und Wachheit zeigen die Gefahr früher als die Sättigung.' },
          { id: 'ruhe', text: 'Schlafen lassen, sie braucht Ruhe nach der OP', wertung: 'gefaehrlich', folge: { text: 'Die Atmung wird noch flacher, die Sättigung fällt.', effekt: { spo2: -3, resp: -1 } }, sekunden: 120, warum: 'Schnarchen mit Pausen nach Opioiden ist kein erholsamer Schlaf, sondern eine Atemstörung.' },
          { id: 'sensor', text: 'Den Sensor neu anbringen, das wird ein Messfehler sein', wertung: 'falsch', sekunden: 30, warum: 'Erst den Menschen ansehen. Die flache, langsame Atmung erklärt den Wert.' },
        ],
      },
      {
        id: 'atemweg', phase: 'a',
        frage: 'Sie schnarcht und atmet mit Pausen. Was tust du für den Atemweg?',
        optionen: [
          { id: 'frei', text: 'Laut ansprechen, zum tiefen Atmen auffordern, Oberkörper hoch, Kopf überstrecken', wertung: 'gut', aktionen: ['care'], warum: 'Das Schnarchen zeigt einen teilweise verlegten Atemweg. Kopf überstrecken und Wecken öffnen ihn kurzfristig.' },
          { id: 'o2', text: 'Nur den Sauerstoff auf 4 l/min erhöhen', wertung: 'falsch', aktionen: ['o2up'], warum: 'Mehr Sauerstoff hebt die Sättigung, aber nicht die Atmung. Das Kohlendioxid steigt weiter, und die Sättigung zeigt eine Verschlechterung später an.' },
          { id: 'flach', text: 'Flach lagern', wertung: 'gefaehrlich', folge: { text: 'In Rückenlage fällt die Zunge zurück, das Schnarchen wird lauter, die Sättigung sinkt.', effekt: { spo2: -3 } }, warum: 'Flachlage verschlechtert bei Adipositas und Schlafapnoe den Atemweg.' },
        ],
      },
      {
        id: 'ursache', phase: 'b',
        frage: 'Was ist das wahrscheinliche Problem?',
        optionen: [
          { id: 'opioid', text: 'Atemdepression durch das Opioid bei Schlafapnoe', wertung: 'gut', sekunden: 20, befund: 'Langsame, flache Atmung, enge Pupillen, kaum weckbar, 15 mg Piritramid in kurzer Zeit.', warum: 'Opioide dämpfen den Atemantrieb. Schlafapnoe und Adipositas verstärken das.' },
          { id: 'schmerz', text: 'Starke Schmerzen', wertung: 'falsch', sekunden: 20, warum: 'Sie gibt kaum Schmerz an. Schmerz würde eher schnell atmen lassen.' },
          { id: 'kalt', text: 'Sie ist nur ausgekühlt', wertung: 'vertretbar', sekunden: 20, warum: 'Die Temperatur ist leicht erniedrigt, aber das erklärt nicht die langsame Atmung.' },
        ],
      },
      {
        id: 'hilfe', phase: 'hilfe',
        frage: 'Was tust du jetzt?',
        optionen: [
          { id: 'anaesthesie', text: 'Frau Berger und sofort die Anästhesie rufen, bei der Patientin bleiben', wertung: 'gut', aktionen: ['help'], warum: 'Eine Atemdepression muss ärztlich behandelt werden. Im Aufwachraum ist die Anästhesie in einer Minute da.' },
          { id: 'piri', text: 'Die Bedarfsdosis Piritramid geben, damit sie ruhig schläft', wertung: 'gefaehrlich', aktionen: ['piri'], warum: 'Ein weiteres Opioid vertieft die Atemdepression. Bedarfsanordnungen gelten nur, wenn der Zustand passt.' },
          { id: 'abwarten', text: 'Abwarten, das Opioid baut sich ab', wertung: 'gefaehrlich', folge: { text: 'Der Monitor alarmiert eine Atempause.', effekt: { spo2: -4, resp: -1 } }, sekunden: 180, warum: 'Bis das Opioid abgebaut ist, kann sie aufhören zu atmen.' },
        ],
      },
      {
        id: 'sbar', phase: 'uebergabe',
        frage: 'Was sagst du der Anästhesistin?',
        optionen: [
          { id: 'gut', text: '„Frau Vogt, 71, nach Cholezystektomie, nur auf laute Ansprache kurz wach, AF 8, SpO₂ um 89 % unter 2 l O₂, schnarcht mit Pausen. Schlafapnoe mit CPAP, 15 mg Piritramid. Ich vermute eine Atemdepression durch das Opioid. Bitte sofort kommen.“', wertung: 'gut', aktionen: ['orders'], sbar: ['Frau Vogt, 71 J., post-OP kaum weckbar, AF 8/min', 'Lap. Cholezystektomie, Schlafapnoe mit CPAP, BMI 38, 15 mg Piritramid', 'SpO₂ um 89 % unter 2 l O₂, schnarchend mit Pausen, Pupillen eng – V. a. opioidbedingte Atemdepression', 'Bitte sofort kommen; Atemweg frei gehalten, bleibe bei ihr'], warum: 'Kurz, mit Zahlen und einer klaren Vermutung.' },
          { id: 'vage', text: '„Frau Vogt schläft sehr tief.“', wertung: 'falsch', aktionen: ['orders'], warum: 'Klingt harmlos. Atemfrequenz, Sättigung und Opioid fehlen.' },
        ],
      },
      {
        id: 'nach', phase: 'verlauf', wartenAuf: 'orders', mehrfach: 2,
        lage: 'Die Anästhesistin hat Naloxon gegeben. Frau Vogt ist wach.',
        frage: 'Was folgt jetzt? Wähle bis zu zwei Schritte.',
        optionen: [
          { id: 'pruefen', text: 'Bewusstsein und Atmung erneut prüfen', wertung: 'gut', aktionen: ['wach'], zeigt: ['resp', 'spo2', 'pulse'], warum: 'Nach jeder Maßnahme erneut beurteilen. Naloxon wirkt kürzer als Piritramid: Sie kann wieder einschlafen.' },
          { id: 'cpap', text: 'Ihr eigenes CPAP-Gerät anlegen', wertung: 'gut', aktionen: ['cpap'], warum: 'CPAP hält die Atemwege offen und verhindert die Pausen.' },
          { id: 'waerme', text: 'Mit der Warmluftdecke wärmen', wertung: 'vertretbar', aktionen: ['warm'], warum: 'Sinnvoll gegen Auskühlung, aber nicht vor der Atmung.' },
        ],
      },
      {
        id: 'verlegen', phase: 'e', vorlauf: 10 * 60,
        lage: 'Die Station ruft an: Das Bett ist frei.',
        frage: 'Darf Frau Vogt jetzt verlegt werden?',
        optionen: [
          { id: 'kriterien', text: 'Erst Verlegungskriterien (Aldrete-Score) prüfen; verlegt wird nach Freigabe durch die Anästhesie und frühestens 60 Minuten nach der letzten Naloxongabe', wertung: 'gut', aktionen: ['aldrete'], warum: 'Verlegt wird nach festen Kriterien, nicht nach Bettenlage.' },
          { id: 'jetzt', text: 'Ja, sie hat ja Sauerstoff', wertung: 'gefaehrlich', aktionen: ['verlegen'], warum: 'Auf Station wird sie weniger eng überwacht. Das Opioid kann länger wirken als Naloxon.' },
        ],
      },
      {
        id: 'bericht', phase: 'doku',
        frage: 'Welcher Eintrag passt?',
        optionen: [
          { id: 'sachlich', text: '„Kaum weckbar, AF 8, SpO₂ < 90 % unter O₂, Schnarchen mit Pausen. Atemweg frei gehalten, Anästhesie sofort informiert, Naloxon ärztlich gegeben, danach wach, AF 14. CPAP angelegt. Überwachung ≥ 60 min nach letzter Gabe.“', wertung: 'gut', notiz: 'Kaum weckbar, AF 8, SpO₂ unter 90 % unter O₂, Schnarchen mit Pausen. Atemweg frei gehalten, Anästhesie sofort informiert, Naloxon ärztlich gegeben, danach wach, AF 14. CPAP angelegt. Überwachung mindestens 60 min nach letzter Gabe.', warum: 'Beobachtung, Maßnahme und Wirkung, dazu der Grund für die längere Überwachung.' },
          { id: 'kurz', text: '„Pat. hat geschlafen, jetzt wach.“', wertung: 'falsch', sekunden: 20, warum: 'Verschweigt den Notfall und die Gründe für die weitere Überwachung.' },
        ],
      },
    ],
  },
  {
    fall: 'hausbesuch',
    rahmen: 'Ambulante Pflege, Vormittagstour. Du bist im ersten Ausbildungsjahr und fährst mit der Pflegefachperson Frau Lorenz.',
    lernziele: ['Zeichen eines Flüssigkeitsmangels im Alter erkennen', 'Sturzgefahr durch Kreislaufschwäche einschätzen', 'Die richtige ärztliche Stelle wählen', 'Frau Sommer und ihre Tochter einbeziehen'],
    quellen: [ABCDE, 'Expertenstandard Sturzprophylaxe (DNQP, 2. Aktualisierung)', 'Expertenstandard Ernährungsmanagement (DNQP)'],
    schritte: [
      {
        id: 'blick', phase: 'ersteindruck',
        lage: 'Frau Sommer (79) sitzt erschöpft im Sessel. Ein fast volles Glas steht seit gestern auf dem Tisch.',
        frage: 'Was machst du zuerst?',
        optionen: [
          { id: 'ansprechen', text: 'Begrüßen, ansehen und fragen, wie es ihr geht', wertung: 'gut', aktionen: ['assessment', 'patient'], warum: 'Sie antwortet langsam und klagt über Schwindel beim Aufstehen. Ihr Bericht gibt die wichtigsten Hinweise.' },
          { id: 'medis', text: 'Gleich die Tabletten für heute richten', wertung: 'falsch', sekunden: 90, warum: 'Erst den Menschen einschätzen. Sie wirkt verändert.' },
        ],
      },
      {
        id: 'fluessigkeit', phase: 'e', mehrfach: 2,
        frage: 'Was prüfst du? Wähle bis zu zwei Schritte.',
        optionen: [
          { id: 'trinken', text: 'Mundschleimhaut, Urinfarbe und Trinkmenge von gestern', wertung: 'gut', aktionen: ['hydration'], warum: 'Trockene Zunge, dunkler Urin und kaum 500 ml Trinkmenge sprechen für Flüssigkeitsmangel. Die Hautfalte ist im Alter wenig aussagekräftig.' },
          { id: 'medplan', text: 'Medikationsplan und Wochendispenser', wertung: 'gut', aktionen: ['medplan'], warum: 'Ein Diuretikum bei geringer Trinkmenge verstärkt den Flüssigkeitsmangel. Das gehört in die ärztliche Rücksprache.' },
          { id: 'gewicht', text: 'Auf die Waage stellen', wertung: 'falsch', sekunden: 60, folge: { text: 'Beim Aufstehen wird ihr schwarz vor Augen, du hältst sie gerade noch.', effekt: { pulse: 6 } }, warum: 'Mit Schwindel beim Aufstehen ist das jetzt riskant und bringt wenig.' },
        ],
      },
      {
        id: 'kreislauf', phase: 'c',
        frage: 'Wie prüfst du den Kreislauf?',
        optionen: [
          { id: 'ortho', text: 'Mit Einwilligung Blutdruck und Puls im Sitzen und nach dem Aufstehen vergleichen, dabei absichern', wertung: 'gut', aktionen: ['deescalate', 'orthostase'], zeigt: ['sys', 'dia', 'pulse'], warum: 'Ein deutlicher Blutdruckabfall beim Aufstehen zeigt eine Kreislaufschwäche bei Flüssigkeitsmangel.' },
          { id: 'einmal', text: 'Einmal Blutdruck im Sitzen messen', wertung: 'vertretbar', aktionen: ['vitals'], zeigt: ['sys', 'dia', 'pulse', 'spo2', 'resp', 'temp'], warum: 'Gibt einen Überblick, zeigt aber nicht, was beim Aufstehen passiert.' },
        ],
      },
      {
        id: 'sturz', phase: 'massnahme',
        lage: 'Frau Sommer muss zur Toilette.',
        frage: 'Wie gehst du vor?',
        optionen: [
          { id: 'begleiten', text: 'Langsam aufstehen lassen, begleiten, Laufweg sichern (Teppichkante, Licht, Notrufknopf)', wertung: 'gut', aktionen: ['fallsafe'], warum: 'Schwindel, Diuretikum und wenig Trinken ergeben ein hohes Sturzrisiko. Langsames Aufstehen und Begleitung schützen.' },
          { id: 'allein', text: 'Allein gehen lassen, um Zeit zu sparen', wertung: 'gefaehrlich', aktionen: ['unsupervised'], warum: 'Bei Kreislaufschwäche droht ein Sturz.' },
        ],
      },
      {
        id: 'hilfe', phase: 'hilfe',
        lage: 'Die Hausarztpraxis ist heute geschlossen.',
        frage: 'Wen informiert ihr?',
        optionen: [
          { id: 'bereitschaft', text: 'Frau Lorenz informieren; gemeinsam den ärztlichen Bereitschaftsdienst (116117) anrufen', wertung: 'gut', aktionen: ['bereitschaft'], warum: 'Kein lebensbedrohlicher Notfall, aber eine ärztliche Abklärung heute ist nötig. Dafür ist 116117 da.' },
          { id: '112', text: 'Rettungsdienst 112 rufen', wertung: 'vertretbar', aktionen: ['ems'], warum: '112 ist für Lebensgefahr, Bewusstlosigkeit oder Sturz mit Verletzung. Frau Sommer ist wach und ansprechbar.' },
          { id: 'niemand', text: 'Niemanden, einfach mehr trinken lassen', wertung: 'falsch', sekunden: 30, warum: 'Diuretikum und Flüssigkeitsmangel müssen ärztlich abgestimmt werden. Eigenmächtig absetzen geht nicht.' },
        ],
      },
      {
        id: 'trinkplan', phase: 'massnahme',
        frage: 'Wie sorgt ihr dafür, dass sie mehr trinkt?',
        optionen: [
          { id: 'plan', text: 'Mit ihr einen Trinkplan mit Lieblingsgetränken vereinbaren, das erste Glas begleiten, Becher in Reichweite', wertung: 'gut', aktionen: ['trinkplan'], warum: 'Lieblingsgetränke, sichtbare Becher und feste Zeiten helfen. Mit ihr, nicht über sie entscheiden.' },
          { id: 'druck', text: 'Ihr sagen, dass sie zwei Liter trinken muss', wertung: 'falsch', sekunden: 30, warum: 'Druck ohne Plan ändert wenig. Die Trinkmenge bei Herz- oder Nierenerkrankung legt außerdem die Ärztin fest.' },
        ],
      },
      {
        id: 'bericht', phase: 'doku',
        frage: 'Welcher Eintrag passt?',
        optionen: [
          { id: 'sachlich', text: '„09:30 erschöpft, Schwindel beim Aufstehen, Zunge trocken, Urin dunkel, Trinkmenge gestern ca. 500 ml. RR fällt beim Aufstehen. Diuretikum weiter eingenommen. Bereitschaftsdienst informiert, Trinkplan vereinbart, Tochter informiert, Laufweg gesichert.“', wertung: 'gut', notiz: '09:30 erschöpft, Schwindel beim Aufstehen, Zunge trocken, Urin dunkel, Trinkmenge gestern ca. 500 ml. RR fällt beim Aufstehen. Diuretikum weiter eingenommen. Bereitschaftsdienst informiert, Trinkplan vereinbart, Tochter informiert, Laufweg gesichert.', warum: 'Beobachtung, Maßnahmen und Absprachen: Der nächste Besuch kann anknüpfen.' },
          { id: 'kurz', text: '„Trinkt zu wenig.“', wertung: 'falsch', sekunden: 20, warum: 'Zu knapp. Es fehlen Befunde, Information und Plan.' },
        ],
      },
    ],
  },
];

export const leitfallFuer = (fall: string) => LEITFAELLE.find((l) => l.fall === fall);
