// Fachinhalte fürs Examen kommen aus dem gewählten Fachmodul der Registry, nicht fest aus dem Pflege-Modul.
import { useMemo } from 'react';
import type { CatalogModule } from '../../modules/catalog-types';
import { getModule, modules } from '../../modules/registry';
import { useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { katalog, pruefungsTeile } from './radar';

export function useExamensModul() {
  const moduleId = useStore(session, (s) => s.moduleId);
  return useMemo(() => {
    const modul = (getModule(moduleId) ?? modules[0]!) as CatalogModule;
    return { modul, K: katalog(modul), teile: pruefungsTeile(modul) };
  }, [moduleId]);
}
