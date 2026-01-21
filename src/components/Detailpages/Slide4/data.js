// Slide4 Detail Page Data
export const SLIDE4_DATA = {
  id: 'slide4',
  name: 'Slide 4 Project',
  tagline: 'Next Generation Solutions',
  description: 'Innovative project combining cutting-edge technology with creative vision.',
  foundedYear: 2020,
  origin: 'Silicon Valley',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-slide4.jpg',
  accentColor: '#f59e0b',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2020' },
    place: { label: 'LOCATIE', value: 'Silicon Valley' },
    contact: { label: 'Contact', value: 'slide4' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Features', value: 50 },
      { label: 'Users', value: 100 },
      { label: 'Growth', value: 300 },
      { label: 'Uptime', value: 99.9 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Perform', value: 120 },
      { label: 'Reliab', value: 125 },
      { label: 'Scale', value: 115 },
      { label: 'Secure', value: 130 },
      { label: 'Speed', value: 118 },
      { label: 'Stable', value: 122 },
    ],
  },
  gallery: [
    { title: 'Dashboard Interface', description: 'intuitive user experience', image: '/images/gallery1.jpg' },
    { title: 'Architecture Diagram', description: 'system design overview', image: '/images/gallery2.jpg' },
    { title: 'Live Demo', description: 'product in action', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Core Platform', description: 'Main application suite', tags: ['Platform', 'SaaS'] },
    { name: 'API Integration', description: 'Third-party connectivity', tags: ['API', 'Integration'] },
  ],
  tags: ['Technology', 'Innovation', 'SaaS', 'Platform', 'Future'],
  socialLinks: [
    { platform: 'Website', url: 'https://slide4.tech' },
    { platform: 'Blog', url: 'https://blog.slide4.tech' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@slide4.tech' },
  ],
  tabs: ['overview', 'events', 'community'],
};
