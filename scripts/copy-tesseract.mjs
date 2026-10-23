// Kopiert Tesseract-Worker, WASM-Kern und das deutsche Sprachmodell nach public/tesseract,
// damit die Texterkennung ohne CDN und nach dem ersten Laden auch offline funktioniert.
import { copyFileSync, mkdirSync } from 'node:fs';

const out = 'public/tesseract';
mkdirSync(`${out}/core`, { recursive: true });
mkdirSync(`${out}/lang`, { recursive: true });
copyFileSync('node_modules/tesseract.js/dist/worker.min.js', `${out}/worker.min.js`);
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  copyFileSync(`node_modules/tesseract.js-core/${f}`, `${out}/core/${f}`);
}
copyFileSync('node_modules/@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz', `${out}/lang/deu.traineddata.gz`);
console.log('Tesseract-Dateien nach public/tesseract kopiert.');
