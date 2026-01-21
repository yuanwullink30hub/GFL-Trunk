// Slide6 Detail Page Data
export const SLIDE6_DATA = {
  id: 'slide6',
  name: 'Slide 6 Initiative',
  tagline: 'Community-Driven Innovation',
  description: 'Building tools and platforms that empower communities to create and collaborate.',
  foundedYear: 2021,
  origin: 'Berlin',
  logoUrl: '/images/logo.png',
  heroImageUrl: '/videos/hero-slide6.jpg',
  accentColor: '#8b5cf6',
  // Editable info labels for date/place/contact
  infoLabels: {
    date: { label: 'Opgericht', value: '2021' },
    place: { label: 'LOCATIE', value: 'Berlin' },
    contact: { label: 'Contact', value: 'slide6' }
  },
  metrics: {
    // Editable 4 metric labels with values
    dataPoints: [
      { label: 'Communities', value: 500 },
      { label: 'Members', value: 50000 },
      { label: 'Collaborations', value: 1000 },
      { label: 'Impact', value: 5000 },
    ],
    // Editable radar chart data points and labels (6 points)
    radarData: [
      { label: 'Commun', value: 130 },
      { label: 'Engage', value: 122 },
      { label: 'Growth', value: 118 },
      { label: 'Impact', value: 128 },
      { label: 'Collab', value: 125 },
      { label: 'Reach', value: 115 },
    ],
  },
  gallery: [
    { title: 'Community Meetup', description: 'members networking', image: '/images/gallery1.jpg' },
    { title: 'Workshop Session', description: 'skill-sharing event', image: '/images/gallery2.jpg' },
    { title: 'Celebration', description: 'community success', image: '/images/gallery3.jpg' },
  ],
  slideshowImages: ['/images/slide1.jpg', '/images/slide2.jpg', '/images/slide3.jpg'],
  featuredProducts: [
    { name: 'Community Platform', description: 'Social collaboration hub', tags: ['Community', 'Social'] },
    { name: 'Event Manager', description: 'Meeting organization tools', tags: ['Events', 'Management'] },
  ],
  tags: ['Community', 'Collaboration', 'Social', 'Open Source', 'Empowerment'],
  socialLinks: [
    { platform: 'Website', url: 'https://slide6.com' },
    { platform: 'Discord', url: 'https://discord.com' },
    { platform: 'GitHub', url: 'https://github.com' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
    { platform: 'Email', url: 'mailto:info@slide6.com' },
  ],
  tabs: ['overview', 'events', 'community'],
};
