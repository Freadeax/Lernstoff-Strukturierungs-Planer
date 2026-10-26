import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Neue Browser-Kontexte: Diese Prüfung liest und verändert keine persönlichen Browserdaten.
const artifacts = path.resolve(process.env.UI_ARTIFACT_DIR || '.ui-check');
fs.mkdirSync(artifacts, { recursive: true });
process.chdir(artifacts);
const futureDate = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);
(async()=>{
  const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),headless:true});
  try {
  const context=await browser.newContext({viewport:{width:1440,height:1050},locale:'de-DE',timezoneId:'Europe/Berlin',colorScheme:'light'});
  const page=await context.newPage();page.setDefaultTimeout(8000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  const base=(process.env.UI_BASE_URL || 'http://127.0.0.1:5173/').replace(/\/?$/, '/');
  const go=async route=>{await page.goto(base+'#'+route,{waitUntil:'networkidle'});await page.waitForTimeout(200);};
  const audits=[];
  for(const route of ['/','/einstellungen','/material/import','/material/zusammenfassen','/material/dokumente','/material/ablage','/lernen/plan?ansicht=pruefungen&neu=1','/lernen/plan?ansicht=zeit']){
    await go(route);
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    audits.push({route,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))});
    assert(await page.locator('main').isVisible());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert(!overflow,'Desktop overflow: '+route);
    if(route==='/')await page.screenshot({path:'dashboard-desktop.png',fullPage:true});
    if(route==='/material/import')await page.screenshot({path:'import-desktop.png',fullPage:true});
    if(route==='/einstellungen')await page.screenshot({path:'settings-desktop.png',fullPage:true});
  }
  fs.writeFileSync('audit-initial.json',JSON.stringify(audits,null,2));
  await go('/einstellungen');
  const key=page.getByLabel('Claude-API-Schlüssel',{exact:true});
  await key.fill('ungueltig');await key.press('Tab');
  assert.equal(await key.getAttribute('aria-invalid'),'true');
  assert(await page.getByText('Füge den vollständigen Anthropic-Schlüssel ein.',{exact:false}).isVisible());
  await page.getByRole('button',{name:'Einstellung speichern'}).click();
  assert.equal(await key.evaluate(e=>e===document.activeElement),true);
  await key.fill('sk-ant-ui-regression-test');await key.press('Tab');assert.equal(await key.getAttribute('aria-invalid'),'false');
  await page.getByRole('button',{name:'Einstellung speichern'}).click();assert(await page.getByText('Schlüssel auf diesem Gerät gespeichert.',{exact:true}).isVisible());
  await go('/lernen/plan?ansicht=pruefungen&neu=1');
  await page.getByRole('button',{name:'Prüfung eintragen',exact:true}).click();
  const examName=page.getByLabel('Name der Prüfung');assert.equal(await examName.getAttribute('aria-invalid'),'true');assert.equal(await examName.evaluate(e=>e===document.activeElement),true);
  await examName.fill('Klausur Anatomie');await page.locator('input[name=date]').fill(futureDate);
  await page.getByPlaceholder('Themen suchen').fill('Dekubitus');
  await page.locator('.themenwahl__fach input[type=checkbox]').last().check();
  await page.getByRole('button',{name:'Prüfung eintragen',exact:true}).click();
  await page.waitForTimeout(300);assert.equal(await page.locator('.pruefung-form').count(),0);
  await go('/');assert(await page.locator('.next-exam').getByText('Klausur Anatomie').isVisible());
  await go('/lernen/plan?ansicht=zeit');
  const monday=page.getByLabel('Montag · Minuten');await monday.fill('-10');await monday.press('Tab');assert.equal(await monday.getAttribute('aria-invalid'),'true');
  await monday.fill('60');await monday.press('Tab');assert.equal(await monday.getAttribute('aria-invalid'),'false');
  const tab=page.getByRole('tab',{name:'Lernzeit',exact:true});await tab.focus();await tab.press('Home');assert.equal(await page.getByRole('tab',{name:'Heute',exact:true}).getAttribute('aria-selected'),'true');
  await go('/material/import');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();
  await page.getByRole('button',{name:'Weiter',exact:true}).click();
  assert(await page.getByText('Bitte mindestens eine Datei auswählen.',{exact:true}).isVisible());
  await page.locator('input[type=file]').setInputFiles({name:'Pflegeprozess.txt',mimeType:'text/plain',buffer:Buffer.from('Pflegeprozess\n\nDie Informationssammlung erfasst den Pflegebedarf und die Ressourcen einer Person.\n\nDie Pflegeplanung verbindet Probleme, Ziele und konkrete Maßnahmen.')});
  await page.getByRole('button',{name:'Weiter',exact:true}).click();
  await page.getByRole('button',{name:'1 Datei importieren',exact:true}).click();await page.getByText('Import fertig: 1 Dokumente verfügbar',{exact:false}).waitFor();
  assert(await page.getByText('Schritt 4 von 4',{exact:true}).isVisible());
  await go('/material/dokumente');assert(await page.getByRole('button',{name:'Pflegeprozess TEXT'}).isVisible());
  await go('/material/zusammenfassen');
  await page.getByRole('button',{name:'Zusammenfassung erstellen',exact:true}).click();assert(await page.getByText('Wähle mindestens ein Dokument als Quelle aus.',{exact:true}).isVisible());
  await page.getByRole('checkbox',{name:'Pflegeprozess TEXT'}).check();
  await page.getByRole('button',{name:/^Vergleich /}).click();
  assert(await page.getByText('Wähle mindestens zwei Dokumente, damit ihre Inhalte verglichen werden können.',{exact:true}).isVisible());
  await context.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'de-DE',timezoneId:'Europe/Berlin',colorScheme:'light'});
  const mp=await mobile.newPage();mp.on('pageerror',e=>pageErrors.push(e.message));
  for(const route of ['/','/einstellungen','/material/import','/material/zusammenfassen','/lernen/plan?ansicht=pruefungen&neu=1']){
    await mp.goto(base+'#'+route,{waitUntil:'networkidle'});await mp.waitForTimeout(200);
    assert(!(await mp.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Mobile overflow: '+route);
    const axe=await new AxeBuilder({page:mp}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({route:'mobile:'+route,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))});
    if(route==='/')await mp.screenshot({path:'dashboard-mobile.png',fullPage:true});
    if(route==='/material/import')await mp.screenshot({path:'import-mobile.png',fullPage:true});
  }
  assert.equal(await mp.locator('.shell__sidebar').evaluate(e=>getComputedStyle(e).visibility), 'hidden');
  await mp.getByRole('button',{name:'Alle Bereiche',exact:true}).click();assert(await mp.locator('.shell__sidebar.is-open').isVisible());
  assert(await mp.locator('main').evaluate(e=>e.inert));
  const close=mp.getByRole('button',{name:'Navigation schließen',exact:true});assert(await close.evaluate(e=>e===document.activeElement));await close.press('Shift+Tab');assert(await mp.locator('.shell__sidebar').evaluate(e=>e.contains(document.activeElement)));await mp.keyboard.press('Escape');assert.equal(await mp.locator('.shell__sidebar.is-open').count(),0);
  await mp.emulateMedia({colorScheme:'dark'});await mp.goto(base+'#/einstellungen',{waitUntil:'networkidle'});await mp.screenshot({path:'settings-dark-mobile.png',fullPage:true});
  const darkAxe=await new AxeBuilder({page:mp}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({route:'dark:settings',violations:darkAxe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))});
  fs.writeFileSync('audit.json',JSON.stringify({audits,pageErrors},null,2));
  console.log(JSON.stringify({flows:'completed',audits:audits.map(a=>({route:a.route,violations:a.violations.map(v=>({id:v.id,n:v.nodes.length}))})),pageErrors},null,2));
  assert.deepEqual(pageErrors, [], 'Keine Laufzeitfehler in den geprüften Abläufen');
  assert.deepEqual(audits.flatMap(a => a.violations.map(v => `${a.route}: ${v.id}`)), [], 'Automatisierte WCAG-Prüfungen');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
