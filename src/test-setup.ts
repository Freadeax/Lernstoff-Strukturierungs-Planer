import { fachmodulBereit } from './modules/registry';

// Glossar und Steckbriefe kommen in der App per import() nach (siehe modules/registry.ts); Tests brauchen sie sofort.
await fachmodulBereit();
