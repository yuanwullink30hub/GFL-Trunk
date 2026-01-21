// Slide5 Detail Page Data
export const SLIDE5_DATA = {
  id: 'slide5',
  name: 'Slide 5 Venture',
  tagline: 'Digital Transformation Leaders',
  description: 'Helping enterprises navigate the digital revolution with strategic solutions.',
  foundedYear: 2019,
  origin: 'New York',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-slide5.jpg',
  accentColor: '#06b6d4',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2019' },
    place: { label: 'LOCATIE', value: 'New York' },
    contact: { label: 'Contact', value: 'slide5' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Clients', value: 200 },
      { label: 'Projects', value: 350 },
      { label: 'ROI', value: 450 },
      { label: 'Satisfaction', value: 98 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Strategy', value: 125 },
      { label: 'Execute', value: 118 },
      { label: 'Support', value: 128 },
      { label: 'Innov', value: 115 },
      { label: 'Quality', value: 122 },
      { label: 'Growth', value: 120 },
    ],
  },
  gallery: [
    { title: 'Strategy Session', description: 'collaborative planning', image: '/images/gallery1.jpg' },
    { title: 'Team Meeting', description: 'expert consultation', image: '/images/gallery2.jpg' },
    { title: 'Results Presentation', description: 'client success stories', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Digital Strategy Consulting', description: 'Enterprise transformation', tags: ['Consulting', 'Strategy'] },
    { name: 'Implementation Services', description: 'End-to-end deployment', tags: ['Implementation', 'Support'] },
  ],
  tags: ['Consulting', 'Digital', 'Enterprise', 'Strategy', 'Transformation'],
  socialLinks: [
    { platform: 'Website', url: 'https://slide5.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Medium', url: 'https://medium.com' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'Email', url: 'mailto:info@slide5.com' },
  ],
  tabs: ['overview', 'events', 'community'],
};
