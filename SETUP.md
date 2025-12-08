# Garden For Life - React Website

A modern React website built with tab-based navigation and JSON content loading.

## Features

- **Tab-Based Navigation**: Easily switch between different sections
- **JSON Content Loading**: Manage all page content from `public/content.json`
- **Responsive Design**: Mobile-friendly layout
- **Easy to Extend**: Simple structure to add new tabs and content

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd c:\Users\Jelmer\GitHub\GFL-Trunk
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
GFL-Trunk/
├── public/
│   ├── index.html
│   └── content.json          # Content configuration
├── src/
│   ├── components/
│   │   ├── TabNavigation.js  # Tab button navigation
│   │   └── ContentPanel.js   # Content display component
│   ├── App.js                # Main app component
│   ├── App.css               # Styling
│   └── index.js              # Entry point
├── package.json
└── README.md
```

## Adding New Tabs

To add a new tab, simply add an object to the `tabs` array in `public/content.json`:

```json
{
  "tabs": [
    {
      "id": "home",
      "label": "Homepage",
      "title": "Welcome",
      "content": "Page content here..."
    },
    {
      "id": "about",
      "label": "About",
      "title": "About Us",
      "content": "About content..."
    }
  ]
}
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app (cannot be undone)

## Styling

The app uses CSS for styling with:
- Garden-themed green color scheme (#2d5016)
- Gradient backgrounds
- Responsive design for mobile devices
- Smooth animations and transitions

## License

This project is part of GFL-Trunk repository.
