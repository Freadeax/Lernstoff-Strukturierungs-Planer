// Probefälle ohne KI für Altersgruppen und Orte, die bisher fehlten (Ausbau 2026-11-13):
// Säugling mit Bronchiolitis auf der Kinderstation, Herzschwäche beim Hausbesuch.
// Gleiche Regeln wie in demo.ts: genau eine „gut“-Option je Etappe, gefährliche Entscheidungen führen
// in eine eigene Wendung, Medikamente nur „nach Anordnung“, ohne Dosierungen.
// Inhalte erfunden und didaktisch vereinfacht, fachlich ungeprüft (siehe freigaben.ts).

import type { Szenario } from './faelle';
import type { Probefall } from './demo';
import type { Vitalwerte } from './simulator';

const szenario = (s: Omit<Szenario, 'verborgen'>): Szenario => ({ ...s, verborgen: '' });

// ---------- 9. Säugling mit Bronchiolitis ----------

const RSV_START: Partial<Vitalwerte> = { puls: '168', af: '64', spo2: '91', sauerstoff: 'nein', temp: '38,2', bewusstsein: 'A' };

export const BRONCHIOLITIS: Probefall = {
  szenario: szenario({
    id: 'demo-bronchiolitis', titel: 'Probefall: Sie trinkt nur noch die Hälfte', setting: 'paediatrie',
    kurz: 'Mila, 4 Monate, Kinderstation, seit dem Abend mit RSV-Bronchiolitis aufgenommen. Nachts um 1 Uhr ruft dich die Mutter, weil Mila so schnell atmet. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.paediatrie', 'thema.kl.atmung', 'thema.ph.hygiene', 'thema.pro.dehydratation'],
  }),
  reihe: ['b1', 'b2', 'b3', 'b4'],
  etappen: {
    b1: {
      uhrzeit: '01:05', zustand: 'verschlechtert',
      situation: 'Mila liegt im Gitterbett, die Nase ist verstopft, sie atmet schnell und angestrengt. Zwischen den Rippen und am Hals ziehen sich bei jedem Atemzug Gruben ein. Die Flasche vom Abend ist halb voll.',
      optionen: [
        { text: 'Ich zähle eine Minute lang die Atmung, achte auf Einziehungen und Pausen, lege das Pulsoxymeter an und frage die Mutter nach Trinkmenge und nassen Windeln.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Genau: Beim Säugling sind Atemarbeit, Sättigung und Trinkmenge zusammen die Einschätzung. Weniger als die Hälfte getrunken und lange keine nasse Windel sind Warnzeichen.', folge: 'Die Mutter sagt: „Die letzte nasse Windel war vor dem Abendessen.“', vital: RSV_START },
        { text: 'Ich drehe sie auf den Bauch, dann schläft sie ruhiger, und gehe zurück zum Stützpunkt.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bauchlage im Schlaf ohne Anordnung und lückenlose Überwachung erhöht beim Säugling das Risiko des plötzlichen Kindstods. Und ohne Einschätzung bleibt die Atemnot unbeurteilt.', folge: 'Zwanzig Minuten später klingelt die Mutter Sturm.', vital: { ...RSV_START, spo2: '87', af: '70' }, zustand: 'kritisch', weiter: 'b1b' },
        { text: 'Ich gebe ihr die Flasche, damit sie zu Kräften kommt.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Erzwungenes Trinken bei Atemnot erschöpft und kann zum Verschlucken führen. Erst einschätzen, dann kleine Portionen nach Plan.', folge: 'Mila trinkt drei Schlucke, hustet und dreht den Kopf weg.', vital: { ...RSV_START, spo2: '89' } },
      ],
    },
    b1b: {
      uhrzeit: '01:30', zustand: 'kritisch', weiter: 'b2',
      situation: 'Die Mutter ruft: „Sie hat gerade gar nicht geatmet!“ Mila liegt auf dem Bauch, atmet jetzt wieder, aber flach. Die Lippen sind blass.',
      optionen: [
        { text: 'Ich hebe sie hoch und rüttle kräftig, damit sie richtig wach wird.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Schütteln kann beim Säugling schwere Hirnverletzungen verursachen. Stimulation nur sanft, etwa am Rücken oder an den Fußsohlen.', folge: 'Mila schreit, die Mutter erschrickt. Eine Kollegin kommt dazu.' },
        { text: 'Ich drehe sie auf den Rücken, stimuliere sie sanft, beurteile Atmung und Hautfarbe, klingle nach Hilfe und lasse die Ärztin sofort rufen.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Spät, aber jetzt richtig: Atempausen bei einem jungen Säugling mit RSV sind ein Alarmzeichen. Sofort beurteilen, sanft stimulieren und ärztlich eskalieren.', folge: 'Mila atmet nach sanfter Berührung regelmäßiger. Die Kollegin telefoniert.', vital: { spo2: '89', af: '66' } },
        { text: 'Ich beruhige die Mutter: Babys atmen im Schlaf manchmal unregelmäßig.', wertung: 'gefaehrlich', schritt: 'informationssammlung', rueck: 'Periodisches Atmen gibt es, aber eine lange Pause bei Bronchiolitis muss beurteilt und gemeldet werden.', folge: 'Die Mutter klingelt fünf Minuten später erneut.', vital: { spo2: '86' } },
      ],
    },
    b2: {
      uhrzeit: '01:15', zustand: 'verschlechtert',
      situation: 'Die Sättigung liegt um 91 %, Atemfrequenz über 60, Mila trinkt kaum. In der Nase sitzt zäher Schleim. Die Mutter ist erschöpft und fragt, ob sie etwas tun kann.',
      optionen: [
        { text: 'Ich mache die Nase mit Kochsalztropfen und Nasensauger frei, lagere den Oberkörper leicht erhöht in Rückenlage und informiere die Ärztin mit Atemfrequenz, Sättigung, Einziehungen und Trinkmenge.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Freie Nase erleichtert Atmen und Trinken beim Säugling. Mit konkreten Werten nach SBAR erkennt die Ärztin die Dringlichkeit.', folge: 'Viel Schleim kommt heraus, Mila atmet etwas ruhiger. Die Ärztin kommt in zehn Minuten.', vital: { af: '58', spo2: '92' } },
        { text: 'Ich lasse die Mutter füttern, ich habe noch drei andere Kinder.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Die Mutter einzubinden ist gut, aber Trinken ist hier gerade das Problem. Die Ärztin muss von der Trinkschwäche erfahren.', folge: 'Mila trinkt kaum etwas.' },
        { text: 'Ich gebe ihr schon mal Fiebersaft aus dem Schrank, das Fieber macht die schnelle Atmung.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Medikamente nur nach Anordnung, beim Säugling erst recht. Das Fieber erklärt die Atemnot nicht.', folge: 'Die Ärztin weiß weiter nichts von der Lage.' },
      ],
    },
    b3: {
      uhrzeit: '01:40', zustand: 'verschlechtert',
      situation: 'Die Ärztin ordnet an: Sauerstoff über Nasenbrille, Ziel-Sättigung über 92 %, Magensonde für kleine Portionen, Infusion, Monitor mit Apnoealarm. Eine Kollegin fragt: „Können wir ein Kind nach Chemotherapie mit Fieber zu Mila ins Zimmer legen? Ist ja nur Schnupfen.“',
      optionen: [
        { text: 'Ich setze die Anordnung um und sage der Kollegin: Nein, RSV ist hoch ansteckend und für das Kind nach Chemo gefährlich. Kontaktisolierung bleibt, ich arbeite mit Kittel und Händedesinfektion.', wertung: 'gut', schritt: 'massnahmen', rueck: 'Richtig: Therapie nach Anordnung und Schutz anderer Kinder. RSV wird über Hände, Flächen und Tröpfchen übertragen, Abwehrgeschwächte sind besonders gefährdet.', folge: 'Die Kollegin findet ein anderes Bett. Mila schläft mit Nasenbrille ein.', vital: { spo2: '95', af: '52', puls: '152', sauerstoff: 'ja' } },
        { text: 'Ich sage, das geht, wir ziehen den Vorhang zu.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Ein Vorhang schützt nicht vor Kontakt- und Tröpfcheninfektion. Ein abwehrgeschwächtes Kind darf nicht zu einem RSV-Kind.', folge: 'Die Stationsleitung stoppt die Verlegung am Morgen. Das Kind war schon fünf Stunden im Zimmer.', vital: { spo2: '94', sauerstoff: 'ja' } },
        { text: 'Ich lege die Magensonde und gebe gleich die ganze Flasche auf einmal, dann ist sie satt.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Große Mengen auf einmal drücken auf den Bauch und erschweren die Atmung. Kleine, häufige Portionen nach Plan.', folge: 'Mila spuckt, die Sättigung sinkt kurz.', vital: { spo2: '92', sauerstoff: 'ja' } },
      ],
    },
    b4: {
      uhrzeit: '03:00', zustand: 'verbessert',
      situation: 'Mila schläft mit Nasenbrille, der Monitor zeigt ruhigere Werte. Die Mutter fragt, ob sie sich kurz hinlegen darf, und wann Mila wieder normal trinkt.',
      optionen: [
        { text: 'Ich schalte den Apnoealarm leiser, damit Mutter und Kind schlafen können.', wertung: 'gefaehrlich', schritt: 'evaluation', rueck: 'Alarme bleiben hörbar. Gerade nachts sind Atempausen die größte Gefahr.', folge: 'Um 4 Uhr bemerkt erst die Nachtschicht vom Flur aus eine Pause.', vital: { spo2: '90' } },
        { text: 'Ich sage, sie solle sich hinlegen, und kontrolliere Atmung, Sättigung, Sondenmengen und Windeln engmaschig. Die Fragen zur Dauer gebe ich an die Ärztin weiter und übergebe morgens nach SBAR.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: Mutter entlasten, Wirkung engmaschig kontrollieren, Ein- und Ausfuhr festhalten und sauber übergeben.', folge: 'Die Mutter schläft auf dem Klappbett, du dokumentierst stündlich.', vital: { spo2: '96', af: '48', puls: '146' } },
        { text: 'Ich verspreche ihr, dass Mila morgen wieder gesund ist.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Bronchiolitis kann einige Tage dauern, oft ist der dritte bis fünfte Tag der schwerste. Ehrlich bleiben, Prognosefragen beantwortet die Ärztin.', folge: 'Am nächsten Abend ist die Mutter enttäuscht.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '07:00',
    gut: 'Mila hat ohne weitere Pausen geschlafen, die Sondenportionen hat sie gut vertragen und die Windel ist wieder nass. Die Frühschicht übernimmt mit klarer Übergabe.',
    schlecht: 'Mila ist erschöpft und braucht mehr Atemunterstützung. Die Ärztin bespricht eine Verlegung auf die Kinderintensivstation.',
    gutVital: { spo2: '96', af: '46', puls: '142', temp: '37,8', sauerstoff: 'ja', bewusstsein: 'A' }, schlechtVital: { spo2: '89', af: '72', puls: '178', sauerstoff: 'ja', bewusstsein: 'V' },
  },
  wen: 'Mila',
  musterloesung: 'Atemarbeit, Atempausen, Sättigung und Trinkmenge zusammen einschätzen, nasse Windeln erfragen. Nase freimachen, in Rückenlage mit leicht erhöhtem Oberkörper lagern, nie schütteln. Die Ärztin früh mit Werten informieren. Sauerstoff, Sonde und Infusion nach Anordnung, kleine Portionen. Kontaktisolierung bei RSV, Alarme hörbar lassen, Ein- und Ausfuhr dokumentieren und nach SBAR übergeben.',
};

// ---------- 10. Herzschwäche beim Hausbesuch ----------

const HI_START: Partial<Vitalwerte> = { rr: '146/88', puls: '108', af: '25', spo2: '91', sauerstoff: 'nein', temp: '36,7', bewusstsein: 'A' };

export const HERZSCHWAECHE: Probefall = {
  szenario: szenario({
    id: 'demo-herzschwaeche', titel: 'Probefall: Die Schuhe passen nicht mehr', setting: 'ambulant',
    kurz: 'Herr A., 81 Jahre, lebt allein, Herzinsuffizienz und Vorhofflimmern. Du kommst als ambulante Pflegekraft am Montagmorgen zur Medikamentengabe. Fest geschriebener Kurzfall ohne KI.',
    topicIds: ['thema.kl.herz.insuffizienz', 'thema.fa.ambulant', 'thema.ph.medikamente', 'thema.kom.beratung'],
  }),
  reihe: ['h1', 'h2', 'h3'],
  etappen: {
    h1: {
      uhrzeit: '07:40', zustand: 'verschlechtert',
      situation: 'Herr A. sitzt am Küchentisch und spricht in kurzen Sätzen. Die Nacht hat er im Sessel verbracht, im Bett bekam er keine Luft. Die Hausschuhe hat er hinten heruntergetreten, die Knöchel sind dick.',
      optionen: [
        { text: 'Ich ziehe ihm wie jeden Morgen die Kompressionsstrümpfe an und stelle die Tabletten hin.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Bei dekompensierter Herzinsuffizienz sind Kompressionsstrümpfe kontraindiziert: Mehr Volumen strömt zum Herzen und verstärkt die Atemnot. Erst einschätzen.', folge: 'Die Strümpfe gehen nur mit Mühe über die Beine. Kurz danach ringt Herr A. nach Luft.', vital: { ...HI_START, spo2: '88', af: '29' }, zustand: 'kritisch', weiter: 'h1b' },
        { text: 'Ich messe Vitalzeichen, wiege ihn und vergleiche mit dem Gewichtsprotokoll, prüfe die Ödeme und den Tablettendispenser.', wertung: 'gut', schritt: 'informationssammlung', rueck: 'Genau: Gewicht, Ödeme, Atemnot im Liegen und Medikamenteneinnahme zeigen, ob die Herzschwäche entgleist.', folge: '84 kg, am Mittwoch waren es 80,5 kg. Die Furosemid-Fächer von Freitag bis Sonntag sind noch voll.', vital: HI_START },
        { text: 'Ich lasse ihn viel trinken, damit die Nieren besser arbeiten.', wertung: 'unguenstig', schritt: 'massnahmen', rueck: 'Bei Wassereinlagerung durch Herzinsuffizienz verschlechtert zusätzliche Flüssigkeit die Lage. Trinkmenge nur nach ärztlicher Vorgabe.', folge: 'Er trinkt ein großes Glas und hustet danach.', vital: { ...HI_START, spo2: '90' } },
      ],
    },
    h1b: {
      uhrzeit: '07:55', zustand: 'kritisch', weiter: 'h2',
      situation: 'Herr A. hustet, die Atmung rasselt, er kann kaum sprechen. Die Strümpfe sitzen eng über den geschwollenen Beinen.',
      optionen: [
        { text: 'Ich ziehe die Strümpfe sofort aus, setze ihn aufrecht mit herabhängenden Beinen, öffne das Fenster und rufe die Hausärztin an. Wird es nicht besser, Notruf 112.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Jetzt richtig: Auslöser entfernen, Herzbettlage, ärztliche Hilfe. Bei Atemnot in Ruhe ist auch der Notruf berechtigt.', folge: 'Nach ein paar Minuten atmet er etwas ruhiger. Die Hausärztin ist am Telefon.', vital: { spo2: '89', af: '27' } },
        { text: 'Ich lege ihn zum Ausruhen aufs Sofa.', wertung: 'gefaehrlich', schritt: 'massnahmen', rueck: 'Flachlagerung verstärkt die Lungenstauung. Aufrecht sitzen mit tiefen Beinen entlastet das Herz.', folge: 'Er richtet sich panisch wieder auf.', vital: { spo2: '86' } },
        { text: 'Ich gebe ihm eine Furosemid-Tablette mehr aus dem Dispenser.', wertung: 'unguenstig', schritt: 'durchfuehrung', rueck: 'Zusätzliche Medikamente nur nach ärztlicher Anordnung. Zuerst lagern und die Ärztin informieren.', folge: 'Die Atemnot bleibt.' },
      ],
    },
    h2: {
      uhrzeit: '07:55', zustand: 'verschlechtert',
      situation: 'Herr A. hat am Wochenende das Furosemid weggelassen: „Auf dem Geburtstag wollte ich nicht dauernd aufs Klo.“ Er sagt bestimmt: „Ins Krankenhaus gehe ich nicht.“',
      optionen: [
        { text: 'Ich rufe den Rettungsdienst, er weiß nicht, was gut für ihn ist.', wertung: 'gefaehrlich', schritt: 'durchfuehrung', rueck: 'Ein einwilligungsfähiger Mensch darf eine Krankenhausaufnahme ablehnen. Übergehen zerstört Vertrauen und ist rechtlich nicht gedeckt.', folge: 'Herr A. schickt die Sanitäter weg und will auch dich nicht mehr hereinlassen.', vital: { af: '27', puls: '114' } },
        { text: 'Ich lagere ihn aufrecht, rufe die Hausärztin mit Gewicht, Ödemen, Atemnot und den fehlenden Tabletten an und frage nach seinen Gründen gegen das Krankenhaus.', wertung: 'gut', schritt: 'durchfuehrung', rueck: 'Richtig: Lagerung entlastet, die Hausärztin bekommt die entscheidenden Werte, und seine Gründe ernst zu nehmen ist die Grundlage für eine gemeinsame Entscheidung.', folge: 'Die Hausärztin kommt mittags und ordnet telefonisch an, was bis dahin zu tun ist. Er erzählt von seiner Angst, nicht mehr nach Hause zu kommen.', vital: { af: '23', spo2: '92' } },
        { text: 'Ich akzeptiere das, stelle die Tabletten hin und fahre zum nächsten Einsatz.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Selbstbestimmung heißt nicht allein lassen. Ohne ärztliche Rücksprache und Notfallplan bleibt die Gefahr unbehandelt.', folge: 'Mittags ruft der Nachbar an, Herr A. bekomme kaum Luft.', vital: { spo2: '89', af: '28' } },
      ],
    },
    h3: {
      uhrzeit: '08:20', zustand: 'verbessert',
      situation: 'Die Hausärztin kommt mittags. Bis dahin: Oberkörper hoch, keine Kompressionsstrümpfe, Trinkmenge 1,5 Liter, eine zusätzliche Tablette nach telefonischer Anordnung. Die Tochter ruft auf deinem Diensthandy an und fragt, was los ist.',
      optionen: [
        { text: 'Ich erzähle der Tochter alles, sie ist ja die nächste Angehörige.', wertung: 'unguenstig', schritt: 'evaluation', rueck: 'Auch nahe Angehörige brauchen das Einverständnis der Person. Erst fragen, dann informieren.', folge: 'Herr A. schaut irritiert: „Das hätte ich ihr selbst gesagt.“' },
        { text: 'Ich lasse die telefonische Anordnung schriftlich bestätigen, vereinbare mit Herrn A. Warnzeichen für den Notruf, frage, ob ich seiner Tochter Auskunft geben darf, und dokumentiere alles.', wertung: 'gut', schritt: 'evaluation', rueck: 'Vollständig: rechtssichere Anordnung, ein Notfallplan, den er mitträgt, Angehörige mit Einverständnis einbinden und sauber dokumentieren.', folge: 'Er nickt: „Sag’s ihr ruhig.“ Die Tochter will heute Abend vorbeikommen.', vital: { af: '21', spo2: '93', puls: '98' } },
        { text: 'Ich schreibe alles heute Abend im Büro in die Pflegedokumentation.', wertung: 'teilweise', schritt: 'evaluation', rueck: 'Dokumentation ja, aber zeitnah und mit der telefonischen Anordnung. Die Kollegin am Abend braucht den Stand.', folge: 'Die Spätschicht weiß mittags noch nichts von der Lage.' },
      ],
    },
  },
  schluss: {
    uhrzeit: '12:30',
    gut: 'Die Hausärztin passt die Medikamente an. Herr A. atmet im Sitzen ruhiger, wiegt sich ab morgen täglich, und Tochter und Pflegedienst kennen den Notfallplan.',
    schlecht: 'Herr A. hat Atemnot in Ruhe. Die Hausärztin ruft den Rettungsdienst, diesmal willigt er erschöpft ein.',
    gutVital: { rr: '138/84', puls: '94', af: '20', spo2: '94', bewusstsein: 'A' }, schlechtVital: { rr: '158/96', puls: '122', af: '30', spo2: '87', bewusstsein: 'A' },
  },
  wen: 'Herrn A.',
  musterloesung: 'Atemnot, Ödeme und Schlafen im Sessel als mögliche Dekompensation erkennen. Wiegen und mit dem Protokoll vergleichen (mehr als 2 kg in drei Tagen ist ein Warnzeichen), Medikamenteneinnahme prüfen. Aufrecht lagern, keine Kompressionsstrümpfe, keine zusätzliche Trinkmenge. Hausärztin mit Werten informieren, Willen des einwilligungsfähigen Patienten respektieren und einen Notfallplan vereinbaren. Telefonische Anordnung schriftlich bestätigen lassen, Angehörige nur mit Einverständnis informieren, zeitnah dokumentieren.',
};

export const PROBEFAELLE_3: Probefall[] = [BRONCHIOLITIS, HERZSCHWAECHE];
