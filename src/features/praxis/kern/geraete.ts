// Praxissimulator neu – lesbare Namen der Messgeräte (Pflegetasche, E9). Eine Liste für Kern-Texte und Oberfläche.

export const GERAET_NAME: Record<string, string> = {
  pulsoxy: 'Pulsoxymeter', 'rr-geraet': 'Blutdruckgerät', thermometer: 'Ohrthermometer', 'bz-geraet': 'Blutzuckergerät',
};
export const geraetName = (id: string) => GERAET_NAME[id] ?? id;
