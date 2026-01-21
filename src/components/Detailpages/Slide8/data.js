// Slide8 Detail Page Data
export const SLIDE8_DATA = {
  id: 'slide8',
  name: 'Slide 8 Labs',
  tagline: 'Future Technology Research',
  description: 'Pioneering research in emerging technologies with focus on practical applications.',
  foundedYear: 2022,
  origin: 'Tokyo',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-slide8.jpg',
  accentColor: '#ec4899',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2022' },
    place: { label: 'LOCATIE', value: 'Tokyo' },
    contact: { label: 'Contact', value: 'slide8' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Researchers', value: 150 },
      { label: 'Papers', value: 200 },
      { label: 'Patents', value: 45 },
      { label: 'Discoveries', value: 30 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Research', value: 135 },
      { label: 'Innov', value: 130 },
      { label: 'Collab', value: 125 },
      { label: 'Impact', value: 122 },
      { label: 'Tech', value: 128 },
      { label: 'Future', value: 118 },
    ],
  },
  gallery: [
    { title: 'Lab Facility', description: 'state-of-the-art research center', image: '/images/gallery1.jpg' },
    { title: 'Experiment In Progress', description: 'cutting-edge research', image: '/images/gallery2.jpg' },
    { title: 'Breakthrough Moment', description: 'discovery celebration', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Research Platform', description: 'collaborative lab environment', tags: ['Research', 'Collaboration'] },
    { name: 'Publication Hub', description: 'knowledge sharing platform', tags: ['Publication', 'Knowledge'] },
  ],
  tags: ['Research', 'Innovation', 'Technology', 'Science', 'Future'],
  socialLinks: [
    { platform: 'Website', url: 'https://slide8.research' },
    { platform: 'ResearchGate', url: 'https://researchgate.net' },
    { platform: 'arXiv', url: 'https://arxiv.org' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@slide8.research' },
  ],
  tabs: ['overview', 'events', 'community'],
};
