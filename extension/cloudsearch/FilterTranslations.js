module.exports = {
  getTranslation: (word, language) => {
    if (!module.exports[word]) return word
    return module.exports[word][language] || module.exports[word].default
  },
  price: {
    default: 'Price',
    'de-de': 'Preis',
    'fr-fr': 'Prix',
    'pl-pl': 'Cena'
  },
  category: {
    default: 'Category',
    'de-de': 'Kategorie',
    'fr-fr': 'Catégorie',
    'pl-pl': 'Kategoria'
  },
  manufacturer: {
    default: 'Brand',
    'de-de': 'Marke',
    'fr-fr': 'Marque',
    'pl-pl': 'Producent'
  }
}
