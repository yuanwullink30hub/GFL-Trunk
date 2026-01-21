// Karman Detail Page Data
import karmanLogo from '../../../images/slideshow images/karmaneventsPNG.png';

export const KARMAN_DATA = {
  id: 'karman',
  name: 'Karman',
  tagline: 'Space Technology & Innovation',
  description: 'Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings. Nights defined by music, energy, and togetherness. ',
  foundedYear: 2025,
  origin: 'Amsterdam, NL',
  logoUrl: karmanLogo,
  heroImageUrl: '/videos/hero-karman.jpg',
  accentColor: '#8b5cf6',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2025' },
    place: { label: 'LOCATIE', value: 'Amsterdam, NL' },
    contact: { label: 'CONTACT', value: 'Casper' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Satellites', value: 12 },
      { label: 'Missions', value: 28 },
      { label: 'Partners', value: 45 },
      { label: 'Funding', value: 200 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Tech', value: 120 },
      { label: 'Safety', value: 115 },
      { label: 'Innov', value: 125 },
      { label: 'Reliab', value: 118 },
      { label: 'Speed', value: 105 },
      { label: 'Scale', value: 110 },
    ],
  },
  gallery: [
    { title: 'Rocket Launch', description: 'Latest satellite deployment', image: '/images/gallery1.jpg' },
    { title: 'Space Station', description: 'orbital facility views', image: '/images/gallery2.jpg' },
    { title: 'Control Center', description: 'mission control operations', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Orbit Tracker', description: 'Real-time satellite tracking', tags: ['Space', 'Tracking'] },
    { name: 'PropelX Engine', description: 'Next-gen propulsion system', tags: ['Propulsion', 'Hardware'] },
  ],
  tags: ['Space', 'Technology', 'Satellites', 'Innovation', 'Aerospace'],
  socialLinks: [
    { platform: 'Website', url: 'https://karmanevents.nl/' },
    { platform: 'Twitter', url: 'https://twitter.com' },
    { platform: 'Instagram', url: 'https://www.instagram.com/karman.events_/' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@karmanevents.nl' },
  ],
  tabs: ['overview', 'events', 'community'],
};
