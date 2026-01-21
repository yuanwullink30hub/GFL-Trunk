// Slide7 Detail Page Data
export const SLIDE7_DATA = {
  id: 'slide7',
  name: 'Slide 7 Foundation',
  tagline: 'Sustainable Future Building',
  description: 'Focused on creating sustainable solutions for environmental and social challenges.',
  foundedYear: 2017,
  origin: 'Copenhagen',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-slide7.jpg',
  accentColor: '#10b981',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2017' },
    place: { label: 'LOCATIE', value: 'Copenhagen' },
    contact: { label: 'Contact', value: 'slide7' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Projects', value: 75 },
      { label: 'Impact', value: 1000000 },
      { label: 'Partners', value: 200 },
      { label: 'Funding', value: 500 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Sustain', value: 140 },
      { label: 'Impact', value: 128 },
      { label: 'Innov', value: 118 },
      { label: 'Collab', value: 122 },
      { label: 'Green', value: 135 },
      { label: 'Social', value: 125 },
    ],
  },
  gallery: [
    { title: 'Environmental Project', description: 'green initiative', image: '/images/gallery1.jpg' },
    { title: 'Social Impact', description: 'community development', image: '/images/gallery2.jpg' },
    { title: 'Global Reach', description: 'worldwide operations', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Green Energy Solutions', description: 'renewable technology', tags: ['Energy', 'Green'] },
    { name: 'Impact Tracking', description: 'measurement platform', tags: ['Analytics', 'Impact'] },
  ],
  tags: ['Sustainability', 'Environment', 'Social', 'Impact', 'Green'],
  socialLinks: [
    { platform: 'Website', url: 'https://foundation.org' },
    { platform: 'Twitter', url: 'https://twitter.com' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@foundation.org' },
  ],
  tabs: ['overview', 'events', 'community'],
};
