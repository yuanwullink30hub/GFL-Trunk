// Brand data configuration for the 12 Gardens
// Each brand corresponds to a slide in the Gardens slideshow

import karmanLogo from '../../images/slideshow images/karmaneventsPNG.png';
import code49Logo from '../../images/slideshow images/club49-logo.png';
import tattooshopLogo from '../../images/slideshow images/1111logo.png';
import rengiLogo from '../../images/slideshow images/Rengi-logo.png';

// Generate metrics for each brand
const generateMetrics = () => [
  { label: "Innovation", value: Math.floor(Math.random() * 50) + 50, description: "Tech score" },
  { label: "Design", value: Math.floor(Math.random() * 50) + 50, description: "Aesthetics" },
  { label: "Utility", value: Math.floor(Math.random() * 50) + 50, description: "Usability" },
  { label: "Price", value: Math.floor(Math.random() * 50) + 50, description: "Market value" },
  { label: "Sustain", value: Math.floor(Math.random() * 50) + 50, description: "Eco impact" },
  { label: "Performance", value: Math.floor(Math.random() * 50) + 50, description: "Raw output" },
];

// The 4 main garden brands (expandable to 12)
export const BRANDS = [
  {
    id: '01',
    slug: 'karman',
    name: 'KARMAN',
    tagline: 'Underground Techno Events',
    description: 'Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings. We create immersive experiences that connect people through the universal language of electronic music.',
    foundedYear: '2020',
    origin: 'Amsterdam',
    logoUrl: karmanLogo,
    heroImageUrl: '/images/landingpage/karman-hero.jpg',
    accentColor: '#8b5cf6',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/karman-1.jpg', title: 'Event View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Live Session' },
      { id: '3', type: 'image', url: '/images/detailpages/karman-2.jpg', title: 'Venue Setup' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Event Pass', price: '€ 25', image: '/images/detailpages/karman-pass.jpg', specs: ['VIP Access', 'Limited'] },
      { id: 'p2', name: 'Season Pass', price: '€ 150', image: '/images/detailpages/karman-season.jpg', specs: ['All Events', 'Priority'] },
    ],
    events: [
      { id: 'e1', date: '2026.03.15', title: 'Spring Awakening', location: 'Amsterdam' },
      { id: 'e2', date: '2026.04.20', title: 'Neon Nights', location: 'Rotterdam' },
    ],
    reviews: [
      { id: 'r1', user: 'TechnoHead_AMS', rating: 5, comment: 'Best underground events in the city. Authentic vibes only.' },
      { id: 'r2', user: 'DJ_Nova', rating: 5, comment: 'The sound system and atmosphere are unmatched.' },
    ],
    tags: ['Techno', 'Events', 'Underground'],
    email: 'contact@karmanevents.nl',
    socialLinks: [
      { platform: 'web', url: 'https://karmanevents.nl' },
      { platform: 'insta', url: 'https://instagram.com/karmanevents' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '02',
    slug: 'code49',
    name: 'CODE49',
    tagline: 'AI Solutions & Advanced Tech',
    description: 'Cutting-edge software development company specializing in AI-driven solutions and advanced technology integration. We build the future of digital experiences through innovative algorithms and intuitive interfaces.',
    foundedYear: '2023',
    origin: 'Amsterdam',
    logoUrl: code49Logo,
    heroImageUrl: '/images/landingpage/code49-hero.jpg',
    accentColor: '#06b6d4',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/code49-1.jpg', title: 'Office Space' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-city-11748-large.mp4', title: 'Tech Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/code49-2.jpg', title: 'Team Workshop' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'AI Consultation', price: '€ 500', image: '/images/detailpages/code49-consult.jpg', specs: ['Custom', '2-Week'] },
      { id: 'p2', name: 'Full Stack Dev', price: '€ 5000', image: '/images/detailpages/code49-dev.jpg', specs: ['Enterprise', 'Scalable'] },
    ],
    events: [
      { id: 'e1', date: '2026.02.10', title: 'AI Workshop', location: 'Tech Hub' },
      { id: 'e2', date: '2026.03.05', title: 'Hackathon 2026', location: 'Amsterdam' },
    ],
    reviews: [
      { id: 'r1', user: 'StartupFounder', rating: 5, comment: 'Transformed our business with their AI solutions.' },
      { id: 'r2', user: 'DevOps_Pro', rating: 4, comment: 'Excellent technical skills and communication.' },
    ],
    tags: ['AI', 'Software', 'Tech'],
    email: 'contact@code49.nl',
    socialLinks: [
      { platform: 'web', url: 'https://code49.nl' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/code49' },
    ]
  },
  {
    id: '03',
    slug: 'eleven-eleven',
    name: 'ELEVEN ELEVEN TATTOOS',
    tagline: 'Artistic Expression & Body Art',
    description: 'A premier tattoo studio specializing in custom designs, traditional and modern styles. Our artists bring your vision to life with precision, creativity, and a commitment to lasting artistry.',
    foundedYear: '2019',
    origin: 'Amsterdam',
    logoUrl: tattooshopLogo,
    heroImageUrl: '/images/landingpage/tattoo-hero.jpg',
    accentColor: '#ec4899',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/tattoo-1.jpg', title: 'Studio View' },
      { id: '2', type: 'image', url: '/images/detailpages/tattoo-2.jpg', title: 'Artwork Gallery' },
      { id: '3', type: 'image', url: '/images/detailpages/tattoo-3.jpg', title: 'Custom Design' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Small Tattoo', price: '€ 150', image: '/images/detailpages/tattoo-small.jpg', specs: ['Custom', '1-2h'] },
      { id: 'p2', name: 'Full Sleeve', price: '€ 2500', image: '/images/detailpages/tattoo-sleeve.jpg', specs: ['Multi-Session', 'Custom'] },
    ],
    events: [
      { id: 'e1', date: '2026.02.01', title: 'Flash Day', location: 'Studio' },
      { id: 'e2', date: '2026.03.20', title: 'Guest Artist Week', location: 'Amsterdam' },
    ],
    reviews: [
      { id: 'r1', user: 'InkLover_NL', rating: 5, comment: 'Incredible attention to detail. My sleeve is a masterpiece.' },
      { id: 'r2', user: 'FirstTimer', rating: 5, comment: 'Made my first tattoo experience amazing and comfortable.' },
    ],
    tags: ['Tattoo', 'Art', 'Custom'],
    email: 'booking@1111tattoos.nl',
    socialLinks: [
      { platform: 'web', url: 'https://1111tattoos.nl' },
      { platform: 'insta', url: 'https://instagram.com/1111tattoos' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '04',
    slug: 'rengi',
    name: 'RENGI FOODS',
    tagline: 'Sustainable Organic Nutrition',
    description: 'Dedicated to providing the highest quality organic and sustainably-sourced food products. From farm to table, we ensure every ingredient meets our rigorous standards for health and environmental responsibility.',
    foundedYear: '2021',
    origin: 'Netherlands',
    logoUrl: rengiLogo,
    heroImageUrl: '/images/landingpage/rengi-hero.jpg',
    accentColor: '#10b981',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/rengi-1.jpg', title: 'Organic Farm' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-picking-vegetables-from-a-garden-45162-large.mp4', title: 'Harvest Process' },
      { id: '3', type: 'image', url: '/images/detailpages/rengi-2.jpg', title: 'Product Line' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Organic Box', price: '€ 45', image: '/images/detailpages/rengi-box.jpg', specs: ['Weekly', 'Local'] },
      { id: 'p2', name: 'Premium Box', price: '€ 85', image: '/images/detailpages/rengi-premium.jpg', specs: ['Premium', 'Bi-Weekly'] },
    ],
    events: [
      { id: 'e1', date: '2026.02.15', title: 'Farm Tour', location: 'Countryside' },
      { id: 'e2', date: '2026.04.01', title: 'Cooking Workshop', location: 'Amsterdam' },
    ],
    reviews: [
      { id: 'r1', user: 'HealthyLiving', rating: 5, comment: 'Best organic produce in the Netherlands. Fresh every week!' },
      { id: 'r2', user: 'ChefMarkus', rating: 5, comment: 'Quality ingredients make all the difference. Highly recommend.' },
    ],
    tags: ['Organic', 'Food', 'Sustainable'],
    email: 'info@rengifoods.nl',
    socialLinks: [
      { platform: 'web', url: 'https://rengifoods.nl' },
      { platform: 'insta', url: 'https://instagram.com/rengifoods' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  // Placeholder brands 5-12 for future expansion
  {
    id: '05',
    slug: 'template',
    name: 'BINNENKORT',
    tagline: 'Jouw brandpagina op het platform',
    description: 'Jouw bedrijfsprofiel wordt hier weergegeven. Als partner van Garden for Life deel je hier jouw verhaal, je aanbod en je visie met de community. Neem contact met ons team op om je brandpagina te activeren en je merk zichtbaar te maken.',
    foundedYear: '——',
    origin: '——',
    logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23ffffff08' stroke='%23ffffff20' stroke-width='2'/%3E%3Ctext x='50' y='62' text-anchor='middle' fill='%23ffffff25' font-size='42' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E",
    accentColor: '#00ff9d',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Introductie' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Product / Dienst A', price: 'Op aanvraag', specs: ['Beschrijving', 'Nader te bepalen'] },
      { id: 'p2', name: 'Product / Dienst B', price: 'Op aanvraag', specs: ['Beschrijving', 'Nader te bepalen'] },
    ],
    events: [
      { id: 'e1', date: 'Nader te bepalen', title: 'Evenement / Activiteit A', location: 'Locatie volgt' },
      { id: 'e2', date: 'Nader te bepalen', title: 'Evenement / Activiteit B', location: 'Locatie volgt' },
    ],
    reviews: [
      { id: 'r1', user: 'Partner_01', rating: 5, comment: 'Reviews worden hier weergegeven zodra de pagina live is.' },
      { id: 'r2', user: 'Partner_02', rating: 5, comment: 'Jouw klanten kunnen hier hun ervaringen delen.' },
    ],
    tags: ['Jouw categorie', 'Jouw niche', 'Garden for Life'],
    email: 'contact@gardenforlife.nl',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '06',
    slug: 'brand-06',
    name: 'SECTOR F DYNAMICS',
    tagline: 'Unit 6 // Advanced Systems',
    description: 'Leading the industry in sector F development. Our primary focus is on the integration of biological and mechanical systems to produce superior medical solutions.',
    foundedYear: '2024',
    origin: 'Amsterdam',
    logoUrl: code49Logo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#6366f1',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.6 Alpha', price: 'Ξ 1.0', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.6 Beta', price: 'Ξ 1.3', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'Amsterdam' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Beta', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_88', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Medical', 'Innovation'],
    email: 'contact@sector-f.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '07',
    slug: 'brand-07',
    name: 'SECTOR G DYNAMICS',
    tagline: 'Unit 7 // Advanced Systems',
    description: 'Leading the industry in sector G development. Our primary focus is on the integration of biological and mechanical systems to produce superior transport solutions.',
    foundedYear: '2025',
    origin: 'Rotterdam',
    logoUrl: tattooshopLogo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#14b8a6',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.7 Alpha', price: 'Ξ 1.1', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.7 Beta', price: 'Ξ 1.4', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'Rotterdam' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Gamma', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_99', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Transport', 'Innovation'],
    email: 'contact@sector-g.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '08',
    slug: 'brand-08',
    name: 'SECTOR H DYNAMICS',
    tagline: 'Unit 8 // Advanced Systems',
    description: 'Leading the industry in sector H development. Our primary focus is on the integration of biological and mechanical systems to produce superior defense solutions.',
    foundedYear: '2025',
    origin: 'The Hague',
    logoUrl: rengiLogo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#f43f5e',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.8 Alpha', price: 'Ξ 1.2', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.8 Beta', price: 'Ξ 1.5', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'The Hague' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Delta', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_100', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Defense', 'Innovation'],
    email: 'contact@sector-h.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '09',
    slug: 'brand-09',
    name: 'SECTOR I DYNAMICS',
    tagline: 'Unit 9 // Advanced Systems',
    description: 'Leading the industry in sector I development. Our primary focus is on the integration of biological and mechanical systems to produce superior exploration solutions.',
    foundedYear: '2025',
    origin: 'Utrecht',
    logoUrl: karmanLogo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#a855f7',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.9 Alpha', price: 'Ξ 1.3', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.9 Beta', price: 'Ξ 1.6', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'Utrecht' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Epsilon', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_111', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Exploration', 'Innovation'],
    email: 'contact@sector-i.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '10',
    slug: 'brand-10',
    name: 'SECTOR J DYNAMICS',
    tagline: 'Unit 10 // Advanced Systems',
    description: 'Leading the industry in sector J development. Our primary focus is on the integration of biological and mechanical systems to produce superior medical solutions.',
    foundedYear: '2026',
    origin: 'Eindhoven',
    logoUrl: code49Logo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#0ea5e9',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.10 Alpha', price: 'Ξ 1.4', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.10 Beta', price: 'Ξ 1.7', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'Eindhoven' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Zeta', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_122', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Medical', 'Innovation'],
    email: 'contact@sector-j.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '11',
    slug: 'brand-11',
    name: 'SECTOR K DYNAMICS',
    tagline: 'Unit 11 // Advanced Systems',
    description: 'Leading the industry in sector K development. Our primary focus is on the integration of biological and mechanical systems to produce superior transport solutions.',
    foundedYear: '2026',
    origin: 'Groningen',
    logoUrl: tattooshopLogo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#84cc16',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.11 Alpha', price: 'Ξ 1.5', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.11 Beta', price: 'Ξ 1.8', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'Groningen' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Eta', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_133', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Transport', 'Innovation'],
    email: 'contact@sector-k.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
  {
    id: '12',
    slug: 'brand-12',
    name: 'SECTOR L DYNAMICS',
    tagline: 'Unit 12 // Advanced Systems',
    description: 'Leading the industry in sector L development. Our primary focus is on the integration of biological and mechanical systems to produce superior defense solutions.',
    foundedYear: '2026',
    origin: 'Maastricht',
    logoUrl: rengiLogo, // Placeholder
    heroImageUrl: '/images/landingpage/placeholder-hero.jpg',
    accentColor: '#eab308',
    metrics: generateMetrics(),
    gallery: [
      { id: '1', type: 'image', url: '/images/detailpages/placeholder-1.jpg', title: 'System View' },
      { id: '2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4', title: 'Demo' },
      { id: '3', type: 'image', url: '/images/detailpages/placeholder-2.jpg', title: 'Overview' },
    ],
    featuredProducts: [
      { id: 'p1', name: 'Mk.12 Alpha', price: 'Ξ 1.6', specs: ['Mil-Spec', 'Proto'] },
      { id: 'p2', name: 'Mk.12 Beta', price: 'Ξ 1.9', specs: ['Civ-Grade', 'Stable'] },
    ],
    events: [
      { id: 'e1', date: '2026.12.01', title: 'Tech Expo', location: 'Maastricht' },
      { id: 'e2', date: '2027.01.15', title: 'Product Launch', location: 'Online' },
    ],
    reviews: [
      { id: 'r1', user: 'User_Theta', rating: 5, comment: 'Exceptional build quality.' },
      { id: 'r2', user: 'Anon_144', rating: 4, comment: 'Good performance.' },
    ],
    tags: ['Tech', 'Defense', 'Innovation'],
    email: 'contact@sector-l.net',
    socialLinks: [
      { platform: 'web', url: '#' },
      { platform: 'insta', url: '#' },
      { platform: 'linkedin', url: '#' },
    ]
  },
];

// Get brand by index (0-11)
export const getBrandByIndex = (index) => {
  return BRANDS[index % BRANDS.length];
};

// Get brand by slug
export const getBrandBySlug = (slug) => {
  return BRANDS.find(brand => brand.slug === slug);
};

// Get brand by ID
export const getBrandById = (id) => {
  return BRANDS.find(brand => brand.id === id);
};

export default BRANDS;
