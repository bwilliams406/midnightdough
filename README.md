# Midnight Dough 🍪

A modern, beautiful cookie ordering website built with React, TypeScript, and Tailwind CSS.

## Features

- **Beautiful Hero Page** - Eye-catching landing page with elegant design
- **Product Showcase** - Display of 4 premium cookie varieties with descriptions and pricing
- **Shopping Cart** - Add/remove items with quantity management
- **Checkout Flow** - Multi-step checkout process (cart → shipping → payment → confirmation)
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **State Management** - Context API for cart management
- **Smooth Navigation** - React Router for seamless page transitions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/midnight-dough.git
cd midnight-dough
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

The site will open at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

This generates optimized files in the `dist` directory.

## Project Structure

```
src/
├── components/        # Reusable React components
│   └── NavigationBar.tsx
├── context/          # State management
│   └── CartContext.tsx
├── data/             # Static data
│   └── cookies.ts
├── pages/            # Page components
│   ├── Hero.tsx
│   ├── Products.tsx
│   └── Checkout.tsx
├── types.ts          # TypeScript types
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Cookie Menu

The site features 4 signature cookies:

1. **Midnight Classic** - Rich dark chocolate cookie
2. **Salted Caramel Dream** - Buttery with gooey caramel
3. **Double Chocolate Chunk** - White and dark chocolate chips
4. **Cookie Dough Bliss** - Vanilla with cookie dough chunks

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Lucide React** - Icon library
- **Vite** - Build tool

## Design Features

- **Color Scheme**: Midnight (#1a1625), Gold (#d4af37), Cream (#f5f1e8)
- **Typography**: Mix of serif headers and sans-serif body text
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Semantic HTML and ARIA labels

## License

MIT

## Contact

For questions or collaboration, reach out to the team!

