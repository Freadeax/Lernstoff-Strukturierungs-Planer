// Einstellungsbereich „Töne und Vorlesen“ (wird in den Einstellungen nachgeladen).

import { useEffect, useState } from 'react';
import './audio.css';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { audioEinstellungen, KATEGORIEN, setzeAudio, setzeKategorie } from './einstellungen';
import { audioMoeglich, entsperre } from './motor';
import { spiele } from './spieler';
import { deutscheStimmen, kannVorlesen, lies } from './vorlesen';

function useStimmen() {
  const [stimmen, setStimmen] = useState(() => deutscheStimmen());
  useEffect(() => {
    if (!kannVorlesen()) return;
    const neu = () => setStimmen(deutscheStimmen());
    speechSynthesis.addEventListener?.('voiceschanged', neu);
    neu();
    return () => speechSynthesis.removeEventListener?.('voiceschanged', neu);
  }, []);
  return stimmen;
}

const PROBE: Array<[string, string]> = [['richtig', 'Richtig'], ['falsch', 'Nicht richtig'], ['monitor-piep', 'Monitor'], ['alarm-mittel', 'Alarm gelb'], ['telefon', 'Telefon']];

export function Klangeinstellungen() {
  const e = useStore(audioEinstellungen, (s) => s);
  const stimmen = useStimmen();
  const apple = typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  return (
    <section className="card form-card audio-einst" aria-labelledby="audio-title">
      <h2 id="audio-title">Töne und Vorlesen</h2>
      <p className="form-section__description">Alle Klänge entstehen direkt im Gerät, ohne Dateien und ohne Internet. Körpergeräusche im <a href="#/lernen/hoeren">Hör-Trainer</a> sind vereinfachte Nachbildungen.</p>
      {!audioMoeglich() && <p className="note">Dieser Browser kann keine Töne erzeugen. Vorlesen funktioniert eventuell trotzdem.</p>}
      <fieldset>
        <legend className="visually-hidden">Töne</legend>
        <label className="check"><input type="checkbox" checked={e.an} onChange={(x) => { setzeAudio({ an: x.target.checked }); if (x.target.checked) entsperre(); }} />
          <span><strong>Töne abspielen</strong><br />Hauptschalter für alle automatischen Töne. Abspielknöpfe im Hör-Trainer spielen auch, wenn er aus ist.</span></label>
        {KATEGORIEN.map((k) => (
          <label key={k.id} className="check"><input type="checkbox" disabled={!e.an} checked={e.kategorien[k.id]} onChange={(x) => setzeKategorie(k.id, x.target.checked)} />
            <span><strong>{k.label}</strong><br />{k.text}</span></label>
        ))}
        <label className="field audio-einst__regler"><span>Lautstärke: {Math.round(e.lautstaerke * 100)} %</span>
          <input type="range" min={0} max={1} step={0.05} value={e.lautstaerke} onChange={(x) => setzeAudio({ lautstaerke: Number(x.target.value) })} /></label>
        {apple && (
          <label className="check"><input type="checkbox" checked={e.trotzLautlos} onChange={(x) => setzeAudio({ trotzLautlos: x.target.checked })} />
            <span><strong>Auch im Lautlos-Modus abspielen</strong><br />iPhone und iPad schalten Töne sonst mit dem Lautlos-Schalter stumm. Mit Haken unterbricht die App dafür laufende Musik.</span></label>
        )}
        <div className="audio-einst__probe" role="group" aria-label="Probehören">
          {PROBE.map(([id, label]) => (
            <button key={id} type="button" className="small ghost audio-knopf" onClick={() => { entsperre(); spiele(id, { puls: 72, spo2: 97 }, { erzwingen: true }); }}>
              <Icon name="ton" size={16} /> {label}</button>
          ))}
        </div>
      </fieldset>
      {kannVorlesen() && (
        <fieldset>
          <legend><strong>Vorlesen</strong></legend>
          <p className="form-section__description">Karteikarten, Skript, Krankheitsbilder und Fälle haben einen Knopf „Vorlesen“. Es spricht die Stimme deines Geräts, offline.</p>
          <label className="field"><span>Stimme</span>
            <select value={e.stimme} onChange={(x) => setzeAudio({ stimme: x.target.value })}>
              <option value="">Automatisch (erste deutsche Stimme)</option>
              {stimmen.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}{v.localService ? '' : ' (online)'}</option>)}
            </select></label>
          {stimmen.length === 0 && <p className="muted">Keine deutsche Stimme gefunden. Auf dem iPhone unter Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen eine deutsche Stimme laden.</p>}
          <label className="field audio-einst__regler"><span>Sprechtempo: {e.tempo.toFixed(1).replace('.', ',')}×</span>
            <input type="range" min={0.6} max={1.6} step={0.1} value={e.tempo} onChange={(x) => setzeAudio({ tempo: Number(x.target.value) })} /></label>
          <button type="button" className="small ghost audio-knopf" onClick={() => lies('So klingt die Vorlesestimme. Die Sauerstoffsättigung liegt bei 94 Prozent, die Atemfrequenz bei 22 pro Minute.', 'probe')}>
            <Icon name="ton" size={16} /> Stimme anhören</button>
        </fieldset>
      )}
    </section>
  );
}

export default Klangeinstellungen;
