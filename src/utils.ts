export const getBrowserLanguage = (): 'EN' | 'FR' => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const code = navigator.language.toLowerCase();
    if (code.startsWith('fr') || (navigator.languages && navigator.languages.some(l => l.toLowerCase().startsWith('fr')))) {
      return 'FR';
    }
  }
  return 'EN';
};

export const getBrowserLanguageLabel = (): 'English' | 'French' => {
  return getBrowserLanguage() === 'FR' ? 'French' : 'English';
};
