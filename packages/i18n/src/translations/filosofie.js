/**
 * filosofie — UI chrome for the Filosofie hypercube page.
 *
 * The five Universal-Constants symbols and the quotes carry their own inline
 * { nl, en } pairs in apps/platform/src/hypercube-content/filosofie/constants.jsx
 * (they live next to the shape/colour data they belong to). Everything that is
 * plain page chrome — headers and tooltip templates — lives here.
 */
export default {
  filosofie: {
    ui: {
      symbolInsight: { nl: 'SYMBOL INSIGHT', en: 'SYMBOL INSIGHT' },
      musicHeader: { nl: 'MUZIEK / FOOD FOR THOUGHT', en: 'MUSIC / FOOD FOR THOUGHT' },
      inPlaygroundTitle: {
        nl: (name) => `${name} staat in de playground`,
        en: (name) => `${name} is in playground`,
      },
      dragToPlaygroundTitle: {
        nl: (name) => `Sleep ${name} naar de playground`,
        en: (name) => `Drag ${name} to playground`,
      },
      returnToConstantsTitle: {
        nl: (name) => `Klik om ${name} terug te zetten bij de constanten`,
        en: (name) => `Click to return ${name} to constants`,
      },
      removeSymbolTitle: {
        nl: (name) => `${name} — klik om te verwijderen`,
        en: (name) => `${name} - Click to remove`,
      },
    },
  },
};
