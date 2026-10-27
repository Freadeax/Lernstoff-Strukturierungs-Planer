// Nur im Browser: pdf.js parst PDFs in einem Web Worker. extractPdf lädt diese Datei beim ersten PDF.
// In Node/Vitest läuft pdf.js ohne diese Datei mit einem Fake-Worker im Hauptthread.
import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;
