// Rengi Foods Detail Page Data
export const RENGIFOODS_DATA = {
  id: 'rengifoods',
  name: 'Rengi Foods',
  tagline: 'Sustainable Organic Nutrition',
  description: 'Rengi Foods is dedicated to providing the highest quality organic and sustainably-sourced food products.',
  foundedYear: 2010,
  origin: 'Portland, Oregon',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-rengifoods.jpg',
  accentColor: '#10b981',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2010' },
    place: { label: 'LOCATIE', value: 'Portland, Oregon' },
    contact: { label: 'Contact', value: 'rengifoods' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Farms', value: 50 },
      { label: 'Products', value: 120 },
      { label: 'Customers', value: 500 },
      { label: 'Impact', value: 1000 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Sustain', value: 130 },
      { label: 'Quality', value: 125 },
      { label: 'Taste', value: 118 },
      { label: 'Nutrit', value: 122 },
      { label: 'Fresh', value: 115 },
      { label: 'Organic', value: 128 },
    ],
  },
  gallery: [
    { title: 'Organic Farms', description: 'Sustainable farming practices', image: '/images/gallery1.jpg' },
    { title: 'Fresh Harvest', description: 'Hand-picked quality produce', image: '/images/gallery2.jpg' },
    { title: 'Product Range', description: 'Diverse organic offerings', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Organic Super Blend', description: 'Premium nutrient mix', tags: ['Organic', 'Superfoods'] },
    { name: 'Farm Fresh Box', description: 'Seasonal produce delivery', tags: ['Fresh', 'Delivery'] },
  ],
  tags: ['Organic', 'Food', 'Sustainable', 'Health', 'Nature'],
  socialLinks: [
    { platform: 'Website', url: 'https://rengifoods.nl' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'Facebook', url: 'https://facebook.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@rengifoods.nl' },
  ],
  tabs: ['overview', 'events', 'community'],
};
