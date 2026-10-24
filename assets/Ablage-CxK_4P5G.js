import{n as e,t}from"./jsx-runtime-BjLx7v8f.js";var n=e(),r=`#!/usr/bin/env python3
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
            print(f"{ordner.name}\\t{d['name']}\\t{mb:.1f} MB\\t{len(d['teile'])} Teil(e)" + (f"\\t{info}" if info else ""))
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
`,i=`lernstoff-ablage/1`,a=15728640,o=`https://api.github.com`,s=class extends Error{status;constructor(e,t){super(e),this.status=t}},c=`lernstoff.ablage`;function l(){try{return{owner:``,repo:``,token:``,...JSON.parse(localStorage.getItem(c)??`{}`)}}catch{return{owner:``,repo:``,token:``}}}function u(e){try{e?localStorage.setItem(c,JSON.stringify({owner:e.owner.trim(),repo:e.repo.trim(),token:e.token.trim()})):localStorage.removeItem(c)}catch{}}function d(e){let t=e.trim().replace(/\.git$/,``).match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/i);return t?{owner:t[1],repo:t[2]}:null}function f(e){return e.replace(/\.[^.]+$/,``).normalize(`NFC`).toLowerCase().replace(/ä/g,`ae`).replace(/ö/g,`oe`).replace(/ü/g,`ue`).replace(/ß/g,`ss`).normalize(`NFKD`).replace(/[̀-ͯ]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,60).replace(/-+$/,``)||`datei`}function p(e){let t=(e.match(/\.([A-Za-z0-9]{1,8})$/)?.[1]??``).toLowerCase();return f(e)+(t?`.${t}`:``)}function m(e,t=a){return Math.max(1,Math.ceil(e/t))}function h(e,t,n){return t===1?p(n):`teil-${String(e+1).padStart(3,`0`)}`}function g(e){return Array.from(new Uint8Array(e),e=>e.toString(16).padStart(2,`0`)).join(``)}async function _(e){return g(await crypto.subtle.digest(`SHA-256`,e))}async function v(e){let t=new TextEncoder().encode(`blob ${e.length}\0`),n=new Uint8Array(t.length+e.length);return n.set(t),n.set(e,t.length),g(await crypto.subtle.digest(`SHA-1`,n))}function y(e){let t=``;for(let n=0;n<e.length;n+=32768)t+=String.fromCharCode(...e.subarray(n,n+32768));return btoa(t)}function b(e){return y(new TextEncoder().encode(e))}function x(e){return e<1048576?`${Math.max(1,Math.round(e/1024))} KB`:e<1024**3?`${(e/1024/1024).toFixed(1).replace(`.`,`,`)} MB`:`${(e/1024**3).toFixed(2).replace(`.`,`,`)} GB`}async function S(e,t,n={},r=fetch){let i;try{i=await r(`${o}/repos/${e.owner}/${e.repo}${t}`,{...n,headers:{Accept:`application/vnd.github+json`,Authorization:`Bearer ${e.token}`,"X-GitHub-Api-Version":`2022-11-28`,...n.body?{"Content-Type":`application/json`}:{},...n.headers}})}catch{throw new s(`Keine Verbindung zu GitHub. Internet prüfen und erneut versuchen.`)}if(!i.ok){let e=``;try{e=(await i.json()).message??``}catch{}throw new s(C(i.status,e),i.status)}if(n.method!==`HEAD`&&i.status!==204)return await i.json()}function C(e,t){return e===401?`Der Token ist ungültig oder abgelaufen.`:e===403?`GitHub verweigert den Zugriff${t?` (${t})`:``}. Hat der Token „Contents: Read and write“ für dieses Repo?`:e===404?`Repo nicht gefunden. Name prüfen und ob der Token Zugriff auf genau dieses Repo hat.`:`GitHub-Fehler ${e}${t?`: ${t}`:``}`}async function w(e,t,n){try{return await S(e,t,{method:`HEAD`},n),!0}catch(e){if(e instanceof s&&e.status===404)return!1;throw e}}async function T(e,t=fetch){let n=await S(e,``,{},t),r=!1;try{await S(e,`/git/ref/heads/${n.default_branch}`,{},t)}catch(e){if(e instanceof s&&(e.status===409||e.status===404))r=!0;else throw e}let i=!r&&await w(e,`/contents/abholen.py?ref=${n.default_branch}`,t);return{privat:n.private,branch:n.default_branch,schreiben:n.permissions?.push!==!1,leer:r,eingerichtet:i,vollerName:n.full_name}}async function E(e,t,n,r,i=fetch){for(let[a,o]of[[`README.md`,n],[`abholen.py`,r]]){let n;if(!t.leer)try{n=(await S(e,`/contents/${a}?ref=${t.branch}`,{},i)).sha}catch(e){if(!(e instanceof s&&e.status===404))throw e}await S(e,`/contents/${a}`,{method:`PUT`,body:JSON.stringify({message:`Ablage: ${a} aktualisieren`,content:b(o),branch:t.branch,...n?{sha:n}:{}})},i),t.leer=!1}t.eingerichtet=!0}async function D(e,t=fetch){let n;try{n=await S(e,`/contents/dateien`,{},t)}catch(e){if(e instanceof s&&e.status===404)return[];throw e}let r=n.filter(e=>e.type===`dir`);return Promise.all(r.map(async n=>({ordner:n.name,manifest:await O(e,n.name,t)})))}async function O(e,t,n){try{let r=await S(e,`/contents/dateien/${t}/manifest.json`,{headers:{Accept:`application/vnd.github.raw+json`}},n);return r?.format===`lernstoff-ablage/1`?r:void 0}catch{return}}function k(e,t){let n=t.find(t=>t.manifest&&t.manifest.name.normalize(`NFC`)===e.name.normalize(`NFC`)&&t.manifest.groesse===e.size);if(n)return{ordner:n.ordner,schonDa:!0};let r=f(e.name),i=new Set(t.map(e=>e.ordner));for(let e=1;;e++){let t=e===1?r:`${r}-${e}`;if(!i.has(t))return{ordner:t,schonDa:!1}}}async function A(e,t,n){let r=n.fetch??fetch,a=n.teilGroesse??15728640,o=m(t.size,a),c=(e,t,r)=>n.onFortschritt?.({phase:e,bytes:t,teil:r,teile:o}),{ordner:l,schonDa:u}=k(t,n.vorhanden);if(u)return c(`uebersprungen`,t.size,o),{ordner:l,manifest:n.vorhanden.find(e=>e.ordner===l).manifest,uebersprungen:!0};let d=[];for(let i=0;i<o;i++){n.signal?.throwIfAborted();let l=i*a;c(`pruefen`,l,i);let u=new Uint8Array(await t.slice(l,Math.min(t.size,l+a)).arrayBuffer()),[f,p]=await Promise.all([v(u),_(u)]);if(n.signal?.throwIfAborted(),!await w(e,`/git/blobs/${f}`,r)&&(c(`hochladen`,l,i),(await S(e,`/git/blobs`,{method:`POST`,body:JSON.stringify({content:y(u),encoding:`base64`}),signal:n.signal},r)).sha!==f))throw new s(`Teil ${i+1} kam beschädigt bei GitHub an. Bitte erneut versuchen.`);d.push({datei:h(i,o,t.name),groesse:u.length,sha256:p,git:f})}let f={format:i,name:t.name,groesse:t.size,typ:t.type||`application/octet-stream`,hochgeladen:new Date().toISOString(),...n.kategorie?{kategorie:n.kategorie}:{},...n.notiz?{notiz:n.notiz}:{},teile:d.map(({git:e,...t})=>t)};c(`speichern`,t.size,o);let p=[...d.map(e=>({path:`dateien/${l}/${e.datei}`,mode:`100644`,type:`blob`,sha:e.git})),{path:`dateien/${l}/manifest.json`,mode:`100644`,type:`blob`,content:JSON.stringify(f,null,2)+`
`}];for(let i=1;;i++){let a=await S(e,`/git/ref/heads/${n.branch}`,{},r),c=await S(e,`/git/commits/${a.object.sha}`,{},r),l=await S(e,`/git/trees`,{method:`POST`,body:JSON.stringify({base_tree:c.tree.sha,tree:p})},r),u=await S(e,`/git/commits`,{method:`POST`,body:JSON.stringify({message:`Ablage: ${t.name} (${x(t.size)}, ${o} Teil${o===1?``:`e`})`,tree:l.sha,parents:[a.object.sha]})},r);try{await S(e,`/git/refs/heads/${n.branch}`,{method:`PATCH`,body:JSON.stringify({sha:u.sha})},r);break}catch(e){if(!(e instanceof s&&e.status===422)||i>=3)throw e}}return c(`fertig`,t.size,o),{ordner:l,manifest:f,uebersprungen:!1}}function j(e){return`# Material-Ablage (privat)

Schulmaterial für den Lernstoff-Planer. **Dieses Repo muss privat bleiben**, es enthält
urheberrechtlich geschützte Bücher und Skripte.

Hochgeladen wird mit der Lernstoff-App: Material → Große Dateien. Jede Datei liegt in einem
eigenen Ordner unter \`dateien/\`. Dateien über 15 MiB sind in Teile zerlegt
(\`teil-001\`, \`teil-002\`, …), \`manifest.json\` nennt Originalname, Größe und die
SHA-256-Prüfsumme jedes Teils.

## Für Claude: Dateien abholen

Voraussetzung: das Repo \`${e.owner}/${e.repo}\` ist in den Projekteinstellungen unter
den Repositories eingetragen.

\`\`\`sh
# Nur die Liste holen, ohne die großen Teile herunterzuladen
git clone --filter=blob:none --sparse https://github.com/${e.owner}/${e.repo}.git material
cd material
git sparse-checkout set --no-cone '/*' '!/dateien/' '/dateien/*/manifest.json'
python3 abholen.py                         # Übersicht: Ordner, Name, Größe

# Eine Datei holen und zusammensetzen (Ordnername aus der Übersicht)
git sparse-checkout add /dateien/pflege-heute/
python3 abholen.py pflege-heute            # -> ausgabe/<Originalname>, Prüfsummen geprüft
\`\`\`

Ohne Sparse-Checkout geht auch \`git clone\` komplett und dann \`python3 abholen.py --alle\`.
`}var M=t(),N=1;function P(e){return e instanceof s||e instanceof Error?e.message:String(e)}function F(){let[e,t]=(0,n.useState)(l),[i,a]=(0,n.useState)(()=>{let e=l();return e.owner?`${e.owner}/${e.repo}`:``}),[o,c]=(0,n.useState)(null),[f,p]=(0,n.useState)(``),[m,h]=(0,n.useState)(``),[g,_]=(0,n.useState)([]),[v,y]=(0,n.useState)(``),[b,S]=(0,n.useState)(``),[C,w]=(0,n.useState)([]),[O,k]=(0,n.useState)(!1),F=(0,n.useRef)(null),I=(0,n.useRef)([]),R=(0,n.useRef)(!1),z=!!o?.privat;async function B(e){h(``),p(`Prüfe Zugriff …`);try{let t=await T(e);if(!t.privat){c(null),h(`${t.vollerName} ist öffentlich. Bücher dürfen dort nicht hin. Bitte ein privates Repo verwenden oder dieses unter Settings → Danger Zone auf „Private“ stellen.`);return}if(!t.schreiben)throw new s(`Der Token darf in diesem Repo nicht schreiben. Bei „Contents“ „Read and write“ wählen.`);t.eingerichtet||(p(`Richte Repo ein …`),await E(e,t,j(e),r)),c(t),p(`Lade Liste …`),_(await D(e))}catch(e){c(null),h(P(e))}finally{p(``)}}(0,n.useEffect)(()=>{e.owner&&e.repo&&e.token&&B(e)},[]);function V(){let n=d(i);if(!n){h(`Repo bitte als „name/repo“ angeben, z. B. Freadeax/lernstoff-material.`);return}if(!e.token.trim()){h(`Bitte den Token einfügen.`);return}let r={...n,token:e.token.trim()};t(r),u(r),B(r)}function H(){confirm(`Token von diesem Gerät entfernen?`)&&(u(null),t({owner:``,repo:``,token:``}),a(``),c(null),_([]))}function U(e,t){w(n=>n.map(n=>n.id===e?{...n,...t}:n));let n=I.current.find(t=>t.id===e);n&&Object.assign(n,t)}function W(e){if(!e?.length)return;let t=Array.from(e).map(e=>({id:N++,datei:e,status:`wartet`}));I.current.push(...t),w(e=>[...e,...t]),R.current||G()}async function G(){if(!o||R.current)return;R.current=!0,k(!0);let t=new AbortController;F.current=t;let n;try{n=await navigator.wakeLock?.request(`screen`)}catch{}let r=g;try{for(let n=I.current.find(e=>e.status===`wartet`);n&&!t.signal.aborted;n=I.current.find(e=>e.status===`wartet`)){let i=n.id;U(i,{status:`laeuft`});try{let a=await A(e,n.datei,{branch:o.branch,vorhanden:r,kategorie:v.trim(),notiz:b.trim(),signal:t.signal,onFortschritt:e=>U(i,{fortschritt:e})});U(i,{status:a.uebersprungen?`uebersprungen`:`fertig`,ordner:a.ordner}),a.uebersprungen||(r=[...r.filter(e=>e.ordner!==a.ordner),{ordner:a.ordner,manifest:a.manifest}]),_(r)}catch(e){if(t.signal.aborted){U(i,{status:`abgebrochen`});break}U(i,{status:`fehler`,fehler:P(e)})}}}finally{for(let e of I.current)e.status===`wartet`&&t.signal.aborted&&U(e.id,{status:`abgebrochen`});try{await n?.release()}catch{}F.current=null,R.current=!1,k(!1)}}function K(){for(let e of I.current)(e.status===`fehler`||e.status===`abgebrochen`)&&U(e.id,{status:`wartet`,fehler:void 0});R.current||setTimeout(G,0)}let q=C.reduce((e,t)=>e+t.datei.size,0),J=C.reduce((e,t)=>e+(t.status===`fertig`||t.status===`uebersprungen`?t.datei.size:t.status===`laeuft`?t.fortschritt?.bytes??0:0),0),Y=C.some(e=>e.status===`fehler`||e.status===`abgebrochen`);return(0,M.jsxs)(`section`,{className:`page ablage`,children:[(0,M.jsxs)(`div`,{className:`page__head`,children:[(0,M.jsx)(`h2`,{children:`Große Dateien`}),(0,M.jsx)(`p`,{className:`muted`,children:`Bücher und Skripte beliebiger Größe in dein privates GitHub-Repo laden, damit Claude sie lesen kann. Große Dateien werden automatisch in Teile zerlegt.`})]}),(0,M.jsxs)(`div`,{className:`card`,children:[(0,M.jsx)(`h3`,{children:`Verbindung`}),z?(0,M.jsxs)(M.Fragment,{children:[(0,M.jsxs)(`p`,{children:[`Verbunden mit `,(0,M.jsx)(`strong`,{children:o.vollerName}),` `,(0,M.jsx)(`span`,{className:`badge`,children:`privat`})]}),(0,M.jsxs)(`div`,{className:`row`,children:[(0,M.jsx)(`span`,{className:`muted`,children:`Token liegt nur auf diesem Gerät.`}),(0,M.jsx)(`button`,{className:`small`,onClick:H,children:`Trennen`})]})]}):(0,M.jsxs)(M.Fragment,{children:[(0,M.jsxs)(`label`,{className:`field`,children:[`Privates Repo`,(0,M.jsx)(`input`,{className:`wide`,autoCapitalize:`off`,autoCorrect:`off`,spellCheck:!1,placeholder:`Freadeax/lernstoff-material`,value:i,onChange:e=>a(e.target.value)})]}),(0,M.jsxs)(`label`,{className:`field`,children:[`Fine-grained Token (nur dieses Repo, „Contents: Read and write“)`,(0,M.jsx)(`input`,{className:`wide`,type:`password`,autoComplete:`off`,placeholder:`github_pat_…`,value:e.token,onChange:n=>t({...e,token:n.target.value})})]}),(0,M.jsxs)(`div`,{className:`row`,children:[(0,M.jsx)(`button`,{className:`primary`,disabled:!!f,onClick:V,children:`Verbinden`}),f&&(0,M.jsx)(`span`,{className:`muted`,children:f})]}),(0,M.jsxs)(`details`,{className:`ablage__hilfe`,children:[(0,M.jsx)(`summary`,{children:`So richtest du es ein (einmalig, ca. 3 Minuten)`}),(0,M.jsxs)(`ol`,{children:[(0,M.jsxs)(`li`,{children:[`Auf github.com: `,(0,M.jsx)(`strong`,{children:`+ → New repository`}),`. Name z. B. `,(0,M.jsx)(`code`,{children:`lernstoff-material`}),`, `,(0,M.jsx)(`strong`,{children:`Private`}),` wählen, „Add a README file“ ankreuzen, Create.`]}),(0,M.jsxs)(`li`,{children:[`Profilbild → `,(0,M.jsx)(`strong`,{children:`Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token`}),`.`]}),(0,M.jsxs)(`li`,{children:[`Repository access: `,(0,M.jsx)(`strong`,{children:`Only select repositories`}),` → nur `,(0,M.jsx)(`code`,{children:`lernstoff-material`}),`. Permissions → Repository permissions → `,(0,M.jsx)(`strong`,{children:`Contents: Read and write`}),`. Generate, Token kopieren.`]}),(0,M.jsx)(`li`,{children:`Hier Repo und Token eintragen und verbinden.`}),(0,M.jsx)(`li`,{children:`Damit Claude die Dateien abholen kann, das Repo in den Projekteinstellungen unter Repositories hinzufügen.`})]})]})]}),m&&(0,M.jsx)(`div`,{className:`note warn`,children:m})]}),z&&(0,M.jsxs)(`div`,{className:`card`,children:[(0,M.jsx)(`h3`,{children:`Hochladen`}),(0,M.jsxs)(`div`,{className:`ablage__felder`,children:[(0,M.jsxs)(`label`,{className:`field`,children:[`Kategorie (optional)`,(0,M.jsx)(`input`,{placeholder:`z. B. Pflege Heute, Anatomie`,value:v,onChange:e=>y(e.target.value)})]}),(0,M.jsxs)(`label`,{className:`field`,children:[`Notiz (optional)`,(0,M.jsx)(`input`,{placeholder:`z. B. Auflage 8, Kapitel 1–12`,value:b,onChange:e=>S(e.target.value)})]})]}),(0,M.jsxs)(`label`,{className:`upload`,children:[(0,M.jsx)(`input`,{type:`file`,multiple:!0,onChange:e=>{W(e.target.files),e.target.value=``}}),(0,M.jsx)(`span`,{children:`Dateien auswählen – beliebig viele, beliebig groß`})]}),(0,M.jsx)(`p`,{className:`muted`,children:`Tipp: Während des Uploads die App offen lassen. Bei einem Abbruch einfach dieselben Dateien erneut wählen: Fertiges wird übersprungen, bereits gesendete Teile nicht noch einmal übertragen.`}),C.length>0&&(0,M.jsxs)(M.Fragment,{children:[(0,M.jsxs)(`div`,{className:`ablage__gesamt`,children:[(0,M.jsx)(`div`,{className:`ablage__balken`,children:(0,M.jsx)(`span`,{style:{width:`${q?J/q*100:0}%`}})}),(0,M.jsxs)(`span`,{className:`muted`,children:[x(J),` von `,x(q)]})]}),(0,M.jsx)(`ul`,{className:`ablage__liste`,children:C.map(e=>(0,M.jsx)(L,{a:e},e.id))}),(0,M.jsxs)(`div`,{className:`row`,children:[O&&(0,M.jsx)(`button`,{className:`danger small`,onClick:()=>F.current?.abort(),children:`Abbrechen`}),!O&&Y&&(0,M.jsx)(`button`,{className:`small`,onClick:K,children:`Fehlgeschlagene erneut versuchen`}),!O&&(0,M.jsx)(`button`,{className:`small`,onClick:()=>{I.current=[],w([])},children:`Liste leeren`})]})]})]}),z&&(0,M.jsxs)(`div`,{className:`card`,children:[(0,M.jsxs)(`div`,{className:`row`,style:{marginTop:0},children:[(0,M.jsxs)(`h3`,{children:[`Im Repo (`,g.length,`)`]}),(0,M.jsx)(`button`,{className:`small`,onClick:async()=>{try{_(await D(e))}catch(e){h(P(e))}},children:`Aktualisieren`})]}),g.length===0&&(0,M.jsx)(`p`,{className:`muted`,children:`Noch nichts hochgeladen.`}),(0,M.jsx)(`ul`,{className:`ablage__liste`,children:g.map(e=>(0,M.jsxs)(`li`,{children:[(0,M.jsx)(`div`,{className:`ablage__name`,children:e.manifest?.name??e.ordner}),(0,M.jsxs)(`div`,{className:`muted`,children:[(0,M.jsx)(`code`,{children:e.ordner}),e.manifest&&` · ${x(e.manifest.groesse)} · ${e.manifest.teile.length} Teil${e.manifest.teile.length===1?``:`e`}`,e.manifest?.kategorie&&` · ${e.manifest.kategorie}`]})]},e.ordner))}),(0,M.jsxs)(`p`,{className:`muted`,children:[`Claude findet die Dateien unter diesem Ordnernamen. Sag im Thread einfach z. B. „Lies das Buch `,(0,M.jsx)(`code`,{children:g[0]?.ordner??`pflege-heute`}),` aus der Material-Ablage“.`]})]})]})}var I={pruefen:`prüft Teil`,hochladen:`sendet Teil`,speichern:`speichert`,fertig:`fertig`,uebersprungen:`schon vorhanden`};function L({a:e}){let t=e.fortschritt,n=e.status===`fertig`||e.status===`uebersprungen`?1:t?t.bytes/Math.max(1,e.datei.size):0,r;switch(e.status){case`wartet`:r=`wartet · ${m(e.datei.size)} Teil${m(e.datei.size)===1?``:`e`}`;break;case`laeuft`:r=t?t.phase===`pruefen`||t.phase===`hochladen`?`${I[t.phase]} ${t.teil+1} von ${t.teile}`:I[t.phase]:`startet`;break;case`fertig`:r=`✓ hochgeladen nach ${e.ordner}`;break;case`uebersprungen`:r=`✓ war schon da (${e.ordner})`;break;case`abgebrochen`:r=`abgebrochen`;break;default:r=`⚠ ${e.fehler}`}return(0,M.jsxs)(`li`,{className:`ablage__auftrag ablage__auftrag--${e.status}`,children:[(0,M.jsxs)(`div`,{className:`ablage__name`,children:[e.datei.name,` `,(0,M.jsx)(`span`,{className:`muted`,children:x(e.datei.size)})]}),(0,M.jsx)(`div`,{className:`ablage__balken`,children:(0,M.jsx)(`span`,{style:{width:`${n*100}%`}})}),(0,M.jsx)(`div`,{className:`muted`,children:r})]})}export{F as default};