// Tattoo Shop Detail Page Data
export const TATTOOSHOP_DATA = {
  id: 'tattooshop',
  name: 'Tattoo Shop',
  tagline: 'Artistic Expression & Body Art',
  description: 'A premier tattoo studio specializing in custom designs, traditional and modern styles.',
  foundedYear: 2008,
  origin: 'Los Angeles',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-tattooshop.jpg',
  accentColor: '#ec4899',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2008' },
    place: { label: 'LOCATIE', value: 'Los Angeles' },
    contact: { label: 'Contact', value: 'tattooshop' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Artists', value: 12 },
      { label: 'Designs', value: 5000 },
      { label: 'Clients', value: 3000 },
      { label: 'Experience', value: 150 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Artistry', value: 135 },
      { label: 'Hygiene', value: 140 },
      { label: 'Creative', value: 128 },
      { label: 'Experie', value: 125 },
      { label: 'Custom', value: 130 },
      { label: 'Style', value: 122 },
    ],
  },
  gallery: [
    { title: 'Traditional Art', description: 'Classic tattoo styles', image: '/images/gallery1.jpg' },
    { title: 'Modern Designs', description: 'Contemporary artwork', image: '/images/gallery2.jpg' },
    { title: 'Custom Creations', description: 'Client-commissioned pieces', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Custom Design Service', description: 'Personalized tattoo creation', tags: ['Custom', 'Art'] },
    { name: 'Cover-up Specialists', description: 'Expert transformation work', tags: ['Cover-up', 'Restoration'] },
  ],
  tags: ['Art', 'Tattoo', 'Custom', 'Creative', 'Studio'],
  socialLinks: [
    { platform: 'Website', url: 'https://tattooshop.nl' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'TikTok', url: 'https://tiktok.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@tattooshop.nl' },
  ],
  tabs: ['overview', 'events', 'community'],
};
