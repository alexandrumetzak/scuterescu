// Single source of truth for business facts checked by the tests.
export const FACTS = {
  brand: 'Scuterescu',
  company: 'METZ CARS SRL',
  cui: 'RO42088025',
  baseUrl: 'https://scuterescu.ro/',
  enUrl: 'https://scuterescu.ro/en/',
  phoneE164: '+40756205206',
  phoneDisplay: '+40 756 205 206',
  waBase: 'https://wa.me/40756205206',
  street: 'Str. Al. O. Teodoreanu nr. 49',
  city: 'Iași',
  postalCode: '700154',
  lat: 47.1456874,
  lng: 27.6050934,
  hours: { weekdays: ['09:00', '19:00'], weekend: ['12:00', '19:00'] },
  models: ['SYM Jet 4 RX 50', 'SYM Jet 4 RX 125', 'Voge SR125 ADV'],
  prices: {
    '50': { day: 70, week: 300, deposit: 300 },
    '125': { day: 80, week: 350, deposit: 350 },
  },
  helmetDay: 10,
  minAge: 18,
};
