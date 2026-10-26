import{n as e,t}from"./jsx-runtime-BjLx7v8f.js";import{Mt as n,o as r,s as i}from"./index-CKO2ee1G.js";var a=e(),o=`#!/usr/bin/env python3\r
"""Setzt Dateien aus der Material-Ablage wieder zusammen und prüft sie.\r
\r
Die Lernstoff-App lädt große Dateien in Teilen (je höchstens 15 MiB) in ein privates\r
GitHub-Repo. Jede Datei hat einen eigenen Ordner unter dateien/ mit manifest.json.\r
\r
Aufruf im geklonten Material-Repo:\r
    python3 abholen.py                      # alle Dateien auflisten\r
    python3 abholen.py pflege-heute         # Ordner dateien/pflege-heute zusammensetzen\r
    python3 abholen.py --alle               # alle zusammensetzen\r
    python3 abholen.py pflege-heute -z /tmp/buecher\r
\r
Ausgabe: standardmäßig nach ausgabe/<Originalname>. Bricht ab, wenn ein Teil fehlt\r
oder seine Prüfsumme (SHA-256) nicht zum Manifest passt.\r
"""\r
import argparse\r
import hashlib\r
import json\r
import sys\r
from pathlib import Path\r
\r
FORMAT = "lernstoff-ablage/1"\r
\r
\r
def manifeste(wurzel: Path):\r
    for m in sorted((wurzel / "dateien").glob("*/manifest.json")):\r
        daten = json.loads(m.read_text(encoding="utf-8"))\r
        if daten.get("format") == FORMAT:\r
            yield m.parent, daten\r
\r
\r
def zusammensetzen(ordner: Path, daten: dict, ziel: Path) -> Path:\r
    ziel.mkdir(parents=True, exist_ok=True)\r
    ausgabe = ziel / Path(daten["name"]).name\r
    gesamt = 0\r
    with open(ausgabe, "wb") as out:\r
        for teil in daten["teile"]:\r
            pfad = ordner / teil["datei"]\r
            if not pfad.exists():\r
                raise SystemExit(\r
                    f"Teil fehlt: {pfad}. Bei einem Sparse-Klon zuerst "\r
                    f"'git sparse-checkout add /dateien/{ordner.name}/' ausführen."\r
                )\r
            inhalt = pfad.read_bytes()\r
            if hashlib.sha256(inhalt).hexdigest() != teil["sha256"]:\r
                raise SystemExit(f"Prüfsumme stimmt nicht: {pfad}")\r
            out.write(inhalt)\r
            gesamt += len(inhalt)\r
    if gesamt != daten["groesse"]:\r
        raise SystemExit(f"Größe stimmt nicht: {ausgabe} hat {gesamt} statt {daten['groesse']} Bytes")\r
    return ausgabe\r
\r
\r
def main():\r
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)\r
    p.add_argument("ordner", nargs="*", help="Ordnernamen unter dateien/")\r
    p.add_argument("--alle", action="store_true", help="alle Dateien zusammensetzen")\r
    p.add_argument("-z", "--ziel", default="ausgabe", help="Zielordner (Standard: ausgabe)")\r
    p.add_argument("-r", "--repo", default=".", help="Pfad zum Material-Repo (Standard: .)")\r
    a = p.parse_args()\r
\r
    wurzel = Path(a.repo)\r
    alle = list(manifeste(wurzel))\r
    if not a.ordner and not a.alle:\r
        if not alle:\r
            print("Keine Dateien gefunden (dateien/*/manifest.json).")\r
        for ordner, d in alle:\r
            mb = d["groesse"] / 1024 / 1024\r
            info = " · ".join(x for x in (d.get("kategorie"), d.get("notiz")) if x)\r
            print(f"{ordner.name}\\t{d['name']}\\t{mb:.1f} MB\\t{len(d['teile'])} Teil(e)" + (f"\\t{info}" if info else ""))\r
        return\r
\r
    gewuenscht = None if a.alle else set(a.ordner)\r
    gefunden = [(o, d) for o, d in alle if gewuenscht is None or o.name in gewuenscht]\r
    fehlend = (gewuenscht or set()) - {o.name for o, _ in gefunden}\r
    if fehlend:\r
        sys.exit(f"Nicht gefunden: {', '.join(sorted(fehlend))}")\r
    for ordner, d in gefunden:\r
        print(zusammensetzen(ordner, d, Path(a.ziel)))\r
\r
\r
if __name__ == "__main__":\r
    main()\r
`,s=`lernstoff-ablage/1`,c=15728640,l=`https://api.github.com`,u=class extends Error{status;constructor(e,t){super(e),this.status=t}},d=`lernstoff.ablage`;function f(){try{return{owner:``,repo:``,token:``,...JSON.parse(localStorage.getItem(d)??`{}`)}}catch{return{owner:``,repo:``,token:``}}}function p(e){try{e?localStorage.setItem(d,JSON.stringify({owner:e.owner.trim(),repo:e.repo.trim(),token:e.token.trim()})):localStorage.removeItem(d)}catch{}}function m(e){let t=e.trim().replace(/\.git$/,``).match(/^(?:https?:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/i);return t?{owner:t[1],repo:t[2]}:null}function h(e){return e.replace(/\.[^.]+$/,``).normalize(`NFC`).toLowerCase().replace(/ä/g,`ae`).replace(/ö/g,`oe`).replace(/ü/g,`ue`).replace(/ß/g,`ss`).normalize(`NFKD`).replace(/[̀-ͯ]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,60).replace(/-+$/,``)||`datei`}function g(e){let t=(e.match(/\.([A-Za-z0-9]{1,8})$/)?.[1]??``).toLowerCase();return h(e)+(t?`.${t}`:``)}function _(e,t=c){return Math.max(1,Math.ceil(e/t))}function v(e,t,n){return t===1?g(n):`teil-${String(e+1).padStart(3,`0`)}`}function y(e){return Array.from(new Uint8Array(e),e=>e.toString(16).padStart(2,`0`)).join(``)}async function b(e){return y(await crypto.subtle.digest(`SHA-256`,e))}async function x(e){let t=new TextEncoder().encode(`blob ${e.length}\0`),n=new Uint8Array(t.length+e.length);return n.set(t),n.set(e,t.length),y(await crypto.subtle.digest(`SHA-1`,n))}function S(e){let t=``;for(let n=0;n<e.length;n+=32768)t+=String.fromCharCode(...e.subarray(n,n+32768));return btoa(t)}function C(e){return S(new TextEncoder().encode(e))}function w(e){return e<1048576?`${Math.max(1,Math.round(e/1024))} KB`:e<1024**3?`${(e/1024/1024).toFixed(1).replace(`.`,`,`)} MB`:`${(e/1024**3).toFixed(2).replace(`.`,`,`)} GB`}async function T(e,t,n={},r=fetch){let i;try{i=await r(`${l}/repos/${e.owner}/${e.repo}${t}`,{...n,headers:{Accept:`application/vnd.github+json`,Authorization:`Bearer ${e.token}`,"X-GitHub-Api-Version":`2022-11-28`,...n.body?{"Content-Type":`application/json`}:{},...n.headers}})}catch{throw new u(`Keine Verbindung zu GitHub. Internet prüfen und erneut versuchen.`)}if(!i.ok){let e=``;try{e=(await i.json()).message??``}catch{}throw new u(E(i.status,e),i.status)}if(n.method!==`HEAD`&&i.status!==204)return await i.json()}function E(e,t){return e===401?`Der Token ist ungültig oder abgelaufen.`:e===403?`GitHub verweigert den Zugriff${t?` (${t})`:``}. Hat der Token „Contents: Read and write“ für dieses Repo?`:e===404?`Repo nicht gefunden. Name prüfen und ob der Token Zugriff auf genau dieses Repo hat.`:`GitHub-Fehler ${e}${t?`: ${t}`:``}`}async function D(e,t,n){try{return await T(e,t,{method:`HEAD`},n),!0}catch(e){if(e instanceof u&&e.status===404)return!1;throw e}}async function O(e,t=fetch){let n=await T(e,``,{},t),r=!1;try{await T(e,`/git/ref/heads/${n.default_branch}`,{},t)}catch(e){if(e instanceof u&&(e.status===409||e.status===404))r=!0;else throw e}let i=!r&&await D(e,`/contents/abholen.py?ref=${n.default_branch}`,t);return{privat:n.private,branch:n.default_branch,schreiben:n.permissions?.push!==!1,leer:r,eingerichtet:i,vollerName:n.full_name}}async function k(e,t,n,r,i=fetch){for(let[a,o]of[[`README.md`,n],[`abholen.py`,r]]){let n;if(!t.leer)try{n=(await T(e,`/contents/${a}?ref=${t.branch}`,{},i)).sha}catch(e){if(!(e instanceof u&&e.status===404))throw e}await T(e,`/contents/${a}`,{method:`PUT`,body:JSON.stringify({message:`Ablage: ${a} aktualisieren`,content:C(o),branch:t.branch,...n?{sha:n}:{}})},i),t.leer=!1}t.eingerichtet=!0}async function A(e,t=fetch){let n;try{n=await T(e,`/contents/dateien`,{},t)}catch(e){if(e instanceof u&&e.status===404)return[];throw e}let r=n.filter(e=>e.type===`dir`);return Promise.all(r.map(async n=>({ordner:n.name,manifest:await j(e,n.name,t)})))}async function j(e,t,n){try{let r=await T(e,`/contents/dateien/${t}/manifest.json`,{headers:{Accept:`application/vnd.github.raw+json`}},n);return r?.format===`lernstoff-ablage/1`?r:void 0}catch{return}}function M(e,t){let n=t.find(t=>t.manifest&&t.manifest.name.normalize(`NFC`)===e.name.normalize(`NFC`)&&t.manifest.groesse===e.size);if(n)return{ordner:n.ordner,schonDa:!0};let r=h(e.name),i=new Set(t.map(e=>e.ordner));for(let e=1;;e++){let t=e===1?r:`${r}-${e}`;if(!i.has(t))return{ordner:t,schonDa:!1}}}async function N(e,t,n){let r=n.fetch??fetch,i=n.teilGroesse??15728640,a=_(t.size,i),o=(e,t,r)=>n.onFortschritt?.({phase:e,bytes:t,teil:r,teile:a}),{ordner:c,schonDa:l}=M(t,n.vorhanden);if(l)return o(`uebersprungen`,t.size,a),{ordner:c,manifest:n.vorhanden.find(e=>e.ordner===c).manifest,uebersprungen:!0};let d=[];for(let s=0;s<a;s++){n.signal?.throwIfAborted();let c=s*i;o(`pruefen`,c,s);let l=new Uint8Array(await t.slice(c,Math.min(t.size,c+i)).arrayBuffer()),[f,p]=await Promise.all([x(l),b(l)]);if(n.signal?.throwIfAborted(),!await D(e,`/git/blobs/${f}`,r)&&(o(`hochladen`,c,s),(await T(e,`/git/blobs`,{method:`POST`,body:JSON.stringify({content:S(l),encoding:`base64`}),signal:n.signal},r)).sha!==f))throw new u(`Teil ${s+1} kam beschädigt bei GitHub an. Bitte erneut versuchen.`);d.push({datei:v(s,a,t.name),groesse:l.length,sha256:p,git:f})}let f={format:s,name:t.name,groesse:t.size,typ:t.type||`application/octet-stream`,hochgeladen:new Date().toISOString(),...n.kategorie?{kategorie:n.kategorie}:{},...n.notiz?{notiz:n.notiz}:{},teile:d.map(({git:e,...t})=>t)};o(`speichern`,t.size,a);let p=[...d.map(e=>({path:`dateien/${c}/${e.datei}`,mode:`100644`,type:`blob`,sha:e.git})),{path:`dateien/${c}/manifest.json`,mode:`100644`,type:`blob`,content:JSON.stringify(f,null,2)+`
`}];for(let i=1;;i++){let o=await T(e,`/git/ref/heads/${n.branch}`,{},r),s=await T(e,`/git/commits/${o.object.sha}`,{},r),c=await T(e,`/git/trees`,{method:`POST`,body:JSON.stringify({base_tree:s.tree.sha,tree:p})},r),l=await T(e,`/git/commits`,{method:`POST`,body:JSON.stringify({message:`Ablage: ${t.name} (${w(t.size)}, ${a} Teil${a===1?``:`e`})`,tree:c.sha,parents:[o.object.sha]})},r);try{await T(e,`/git/refs/heads/${n.branch}`,{method:`PATCH`,body:JSON.stringify({sha:l.sha})},r);break}catch(e){if(!(e instanceof u&&e.status===422)||i>=3)throw e}}return o(`fertig`,t.size,a),{ordner:c,manifest:f,uebersprungen:!1}}function P(e){return`# Material-Ablage (privat)

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
`}var F=t(),I=1;function L(e){return e instanceof u||e instanceof Error?e.message:String(e)}function R(){let[e,t]=(0,a.useState)(f),[s,c]=(0,a.useState)(()=>{let e=f();return e.owner?`${e.owner}/${e.repo}`:``}),[l,d]=(0,a.useState)(null),[h,g]=(0,a.useState)(``),[_,v]=(0,a.useState)(``),[y,b]=(0,a.useState)([]),[x,S]=(0,a.useState)(``),[C,T]=(0,a.useState)(``),[E,D]=(0,a.useState)([]),[j,M]=(0,a.useState)(!1),R=(0,a.useRef)(null),z=(0,a.useRef)([]),V=(0,a.useRef)(!1),H=!!l?.privat,U=i({repo:m(s)?``:`Gib das Repository als „Name/Repository“ oder als vollständige GitHub-Adresse ein.`,token:e.token.trim()?``:`Füge einen GitHub-Token mit „Contents: Read and write“ für dieses private Repository ein.`});async function W(e){v(``),g(`Prüfe Zugriff …`);try{let t=await O(e);if(!t.privat){d(null),v(`${t.vollerName} ist öffentlich. Bücher dürfen dort nicht hin. Bitte ein privates Repo verwenden oder dieses unter Settings → Danger Zone auf „Private“ stellen.`);return}if(!t.schreiben)throw new u(`Der Token darf in diesem Repo nicht schreiben. Bei „Contents“ „Read and write“ wählen.`);t.eingerichtet||(g(`Richte Repo ein …`),await k(e,t,P(e),o)),d(t),g(`Lade Liste …`),b(await A(e))}catch(e){d(null),v(L(e))}finally{g(``)}}(0,a.useEffect)(()=>{e.owner&&e.repo&&e.token&&W(e)},[]);function G(){let n=m(s);if(!n){v(`Repo bitte als „name/repo“ angeben, z. B. Freadeax/lernstoff-material.`);return}if(!e.token.trim()){v(`Bitte den Token einfügen.`);return}let r={...n,token:e.token.trim()};t(r),p(r),W(r)}function K(){confirm(`Token von diesem Gerät entfernen?`)&&(p(null),t({owner:``,repo:``,token:``}),c(``),d(null),b([]))}function q(e,t){D(n=>n.map(n=>n.id===e?{...n,...t}:n));let n=z.current.find(t=>t.id===e);n&&Object.assign(n,t)}function J(e){if(!e?.length)return;let t=Array.from(e).map(e=>({id:I++,datei:e,status:`wartet`}));z.current.push(...t),D(e=>[...e,...t]),V.current||Y()}async function Y(){if(!l||V.current)return;V.current=!0,M(!0);let t=new AbortController;R.current=t;let n;try{n=await navigator.wakeLock?.request(`screen`)}catch{}let r=y;try{for(let n=z.current.find(e=>e.status===`wartet`);n&&!t.signal.aborted;n=z.current.find(e=>e.status===`wartet`)){let i=n.id;q(i,{status:`laeuft`});try{let a=await N(e,n.datei,{branch:l.branch,vorhanden:r,kategorie:x.trim(),notiz:C.trim(),signal:t.signal,onFortschritt:e=>q(i,{fortschritt:e})});q(i,{status:a.uebersprungen?`uebersprungen`:`fertig`,ordner:a.ordner}),a.uebersprungen||(r=[...r.filter(e=>e.ordner!==a.ordner),{ordner:a.ordner,manifest:a.manifest}]),b(r)}catch(e){if(t.signal.aborted){q(i,{status:`abgebrochen`});break}q(i,{status:`fehler`,fehler:L(e)})}}}finally{for(let e of z.current)e.status===`wartet`&&t.signal.aborted&&q(e.id,{status:`abgebrochen`});try{await n?.release()}catch{}R.current=null,V.current=!1,M(!1)}}function X(){for(let e of z.current)(e.status===`fehler`||e.status===`abgebrochen`)&&q(e.id,{status:`wartet`,fehler:void 0});V.current||setTimeout(Y,0)}let Z=E.reduce((e,t)=>e+t.datei.size,0),Q=E.reduce((e,t)=>e+(t.status===`fertig`||t.status===`uebersprungen`?t.datei.size:t.status===`laeuft`?t.fortschritt?.bytes??0:0),0),$=E.some(e=>e.status===`fehler`||e.status===`abgebrochen`);return(0,F.jsxs)(`section`,{className:`page ablage`,children:[(0,F.jsx)(n,{eyebrow:`Deine Materialablage`,title:`Auch große Quellen haben ihren Platz.`,description:`Lege Bücher und Skripte in deinem privaten GitHub-Repository ab. Große Dateien werden automatisch in Teile zerlegt.`}),(0,F.jsxs)(`div`,{className:`card`,children:[(0,F.jsx)(`h3`,{children:`Verbindung`}),H?(0,F.jsxs)(F.Fragment,{children:[(0,F.jsxs)(`p`,{children:[`Verbunden mit `,(0,F.jsx)(`strong`,{children:l.vollerName}),` `,(0,F.jsx)(`span`,{className:`badge`,children:`privat`})]}),(0,F.jsxs)(`div`,{className:`row`,children:[(0,F.jsx)(`span`,{className:`muted`,children:`Token liegt nur auf diesem Gerät.`}),(0,F.jsx)(`button`,{className:`small`,onClick:K,children:`Trennen`})]})]}):(0,F.jsxs)(`form`,{className:`form-stack`,noValidate:!0,onSubmit:e=>{e.preventDefault(),U.validate(e.currentTarget)&&G()},children:[(0,F.jsxs)(`p`,{className:`required-note`,children:[`Mit `,(0,F.jsx)(`span`,{className:`required-mark`,children:`*`}),` markierte Felder sind erforderlich.`]}),(0,F.jsx)(r,{label:`Privates GitHub-Repository`,name:`repo`,required:!0,hint:`Das Repository muss privat sein. Beispiel: Freadeax/lernstoff-Material-.`,error:U.error(`repo`),children:e=>(0,F.jsx)(`input`,{...e,disabled:!!h,autoCapitalize:`off`,autoCorrect:`off`,spellCheck:!1,placeholder:`Name/Repository`,value:s,onBlur:()=>U.touch(`repo`),onChange:e=>c(e.target.value)})}),(0,F.jsx)(r,{label:`GitHub-Zugriffstoken`,name:`token`,required:!0,hint:`Verwende einen Fine-grained Token nur für dieses Repository mit „Contents: Read and write“. Er bleibt auf diesem Gerät.`,error:U.error(`token`),children:n=>(0,F.jsx)(`input`,{...n,disabled:!!h,type:`password`,autoComplete:`off`,autoCapitalize:`none`,spellCheck:!1,placeholder:`github_pat_…`,value:e.token,onBlur:()=>U.touch(`token`),onChange:n=>t({...e,token:n.target.value})})}),(0,F.jsxs)(`div`,{className:`row`,children:[(0,F.jsx)(`button`,{type:`submit`,className:`primary`,disabled:!!h,children:`Repository verbinden`}),h&&(0,F.jsx)(`span`,{className:`muted`,role:`status`,children:h})]}),(0,F.jsxs)(`details`,{className:`ablage__hilfe`,children:[(0,F.jsx)(`summary`,{children:`So richtest du es ein (einmalig, ca. 3 Minuten)`}),(0,F.jsxs)(`ol`,{children:[(0,F.jsxs)(`li`,{children:[`Auf github.com: `,(0,F.jsx)(`strong`,{children:`+ → New repository`}),`. Name z. B. `,(0,F.jsx)(`code`,{children:`lernstoff-material`}),`, `,(0,F.jsx)(`strong`,{children:`Private`}),` wählen, „Add a README file“ ankreuzen, Create.`]}),(0,F.jsxs)(`li`,{children:[`Profilbild → `,(0,F.jsx)(`strong`,{children:`Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token`}),`.`]}),(0,F.jsxs)(`li`,{children:[`Repository access: `,(0,F.jsx)(`strong`,{children:`Only select repositories`}),` → nur `,(0,F.jsx)(`code`,{children:`lernstoff-material`}),`. Permissions → Repository permissions → `,(0,F.jsx)(`strong`,{children:`Contents: Read and write`}),`. Generate, Token kopieren.`]}),(0,F.jsx)(`li`,{children:`Hier Repo und Token eintragen und verbinden.`}),(0,F.jsx)(`li`,{children:`Damit Claude die Dateien abholen kann, das Repo in den Projekteinstellungen unter Repositories hinzufügen.`})]})]})]}),_&&(0,F.jsx)(`div`,{className:`note warn`,role:`alert`,children:_})]}),H&&(0,F.jsxs)(`div`,{className:`card`,children:[(0,F.jsx)(`h3`,{children:`Hochladen`}),(0,F.jsxs)(`div`,{className:`ablage__felder`,children:[(0,F.jsxs)(`label`,{className:`field`,children:[`Kategorie (optional)`,(0,F.jsx)(`input`,{placeholder:`z. B. Pflege Heute, Anatomie`,value:x,onChange:e=>S(e.target.value)})]}),(0,F.jsxs)(`label`,{className:`field`,children:[`Notiz (optional)`,(0,F.jsx)(`input`,{placeholder:`z. B. Auflage 8, Kapitel 1–12`,value:C,onChange:e=>T(e.target.value)})]})]}),(0,F.jsxs)(`label`,{className:`upload`,children:[(0,F.jsx)(`input`,{type:`file`,multiple:!0,onChange:e=>{J(e.target.files),e.target.value=``}}),(0,F.jsx)(`span`,{children:`Dateien auswählen – beliebig viele, beliebig groß`})]}),(0,F.jsx)(`p`,{className:`muted`,children:`Tipp: Während des Uploads die App offen lassen. Bei einem Abbruch einfach dieselben Dateien erneut wählen: Fertiges wird übersprungen, bereits gesendete Teile nicht noch einmal übertragen.`}),E.length>0&&(0,F.jsxs)(F.Fragment,{children:[(0,F.jsxs)(`div`,{className:`ablage__gesamt`,children:[(0,F.jsx)(`div`,{className:`ablage__balken`,children:(0,F.jsx)(`span`,{style:{width:`${Z?Q/Z*100:0}%`}})}),(0,F.jsxs)(`span`,{className:`muted`,children:[w(Q),` von `,w(Z)]})]}),(0,F.jsx)(`ul`,{className:`ablage__liste`,children:E.map(e=>(0,F.jsx)(B,{a:e},e.id))}),(0,F.jsxs)(`div`,{className:`row`,children:[j&&(0,F.jsx)(`button`,{className:`danger small`,onClick:()=>R.current?.abort(),children:`Abbrechen`}),!j&&$&&(0,F.jsx)(`button`,{className:`small`,onClick:X,children:`Fehlgeschlagene erneut versuchen`}),!j&&(0,F.jsx)(`button`,{className:`small`,onClick:()=>{z.current=[],D([])},children:`Liste leeren`})]})]})]}),H&&(0,F.jsxs)(`div`,{className:`card`,children:[(0,F.jsxs)(`div`,{className:`row`,style:{marginTop:0},children:[(0,F.jsxs)(`h3`,{children:[`Im Repo (`,y.length,`)`]}),(0,F.jsx)(`button`,{className:`small`,onClick:async()=>{try{b(await A(e))}catch(e){v(L(e))}},children:`Aktualisieren`})]}),y.length===0&&(0,F.jsx)(`p`,{className:`muted`,children:`Noch nichts hochgeladen.`}),(0,F.jsx)(`ul`,{className:`ablage__liste`,children:y.map(e=>(0,F.jsxs)(`li`,{children:[(0,F.jsx)(`div`,{className:`ablage__name`,children:e.manifest?.name??e.ordner}),(0,F.jsxs)(`div`,{className:`muted`,children:[(0,F.jsx)(`code`,{children:e.ordner}),e.manifest&&` · ${w(e.manifest.groesse)} · ${e.manifest.teile.length} Teil${e.manifest.teile.length===1?``:`e`}`,e.manifest?.kategorie&&` · ${e.manifest.kategorie}`]})]},e.ordner))}),(0,F.jsxs)(`p`,{className:`muted`,children:[`Claude findet die Dateien unter diesem Ordnernamen. Sag im Thread einfach z. B. „Lies das Buch `,(0,F.jsx)(`code`,{children:y[0]?.ordner??`pflege-heute`}),` aus der Material-Ablage“.`]})]})]})}var z={pruefen:`prüft Teil`,hochladen:`sendet Teil`,speichern:`speichert`,fertig:`fertig`,uebersprungen:`schon vorhanden`};function B({a:e}){let t=e.fortschritt,n=e.status===`fertig`||e.status===`uebersprungen`?1:t?t.bytes/Math.max(1,e.datei.size):0,r;switch(e.status){case`wartet`:r=`wartet · ${_(e.datei.size)} Teil${_(e.datei.size)===1?``:`e`}`;break;case`laeuft`:r=t?t.phase===`pruefen`||t.phase===`hochladen`?`${z[t.phase]} ${t.teil+1} von ${t.teile}`:z[t.phase]:`startet`;break;case`fertig`:r=`✓ hochgeladen nach ${e.ordner}`;break;case`uebersprungen`:r=`✓ war schon da (${e.ordner})`;break;case`abgebrochen`:r=`abgebrochen`;break;default:r=`⚠ ${e.fehler}`}return(0,F.jsxs)(`li`,{className:`ablage__auftrag ablage__auftrag--${e.status}`,children:[(0,F.jsxs)(`div`,{className:`ablage__name`,children:[e.datei.name,` `,(0,F.jsx)(`span`,{className:`muted`,children:w(e.datei.size)})]}),(0,F.jsx)(`div`,{className:`ablage__balken`,children:(0,F.jsx)(`span`,{style:{width:`${n*100}%`}})}),(0,F.jsx)(`div`,{className:`muted`,children:r})]})}export{R as default};