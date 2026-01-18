# 🚀 Supply & Market Analysis - Frontend

## 📋 Overview

Professional and stunning web interface for the Supply & Market Analysis API project. Built with modern web technologies and integrated with 5 production-ready APIs.

## ✨ Features

- 🎨 **Modern Design**: Stunning dark theme with glassmorphism effects
- 📊 **Interactive Charts**: Real-time data visualization with Chart.js
- ⚡ **Responsive**: Works perfectly on all devices
- 🔒 **Secure**: Bearer token authentication
- 📈 **6 Pages**: Dashboard, Forecast, Alerts, Production, Market, Strategy
- 🌙 **Dark Theme**: Beautiful dark mode by default
- ✨ **Animations**: Smooth transitions and micro-interactions

## 🛠️ Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern features (Grid, Flexbox, Variables, Animations)
- **JavaScript ES6+**: Fetch API, async/await
- **Chart.js**: Interactive charts
- **Font Awesome**: Icons
- **Google Fonts**: Inter & Poppins typography

## 📁 Structure

```
frontend/
├── index.html              # Dashboard
├── assets/
│   ├── css/
│   │   ├── main.css       # Design system
│   │   └── dashboard.css  # Dashboard styles
│   └── js/
│       ├── api.js         # API client
│       └── dashboard.js   # Dashboard logic
└── pages/
    ├── forecast.html      # Cost Forecast
    ├── alerts.html        # Early Warnings
    ├── production.html    # Production Outlook
    ├── competitive.html   # Market Health
    └── strategy.html      # Strategic Summary
```

## 🚀 Getting Started

### Prerequisites

1. Make sure the FastAPI backend is running:
   ```bash
   cd "f:\All Projects\Haeel Saeed Model"
   python main.py
   ```

2. The API should be available at `http://localhost:8000`

### Running the Frontend

#### Option 1: Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 2: Python HTTP Server

```bash
cd "f:\All Projects\Haeel Saeed Model\frontend"
python -m http.server 3000
```

Then open: `http://localhost:3000`

#### Option 3: Direct File

Simply open `index.html` in your browser (some features may not work due to CORS)

## 🎨 Pages Overview

### 1. Dashboard (index.html)
- KPI cards for all commodities
- Price trends chart
- Risk distribution chart
- Recent alerts
- Quick actions
- Real-time updates

### 2. Cost Forecast (pages/forecast.html)
- Interactive form with market indicators
- Date range selection
- Forecast results with charts
- Detailed predictions table
- Export functionality

### 3. Strategic Summary (pages/strategy.html)
- Decision-ready recommendations
- Risk breakdown analysis
- Action items with priorities
- Confidence metrics
- Visual risk distribution

###4. Early Warning Alerts (pages/alerts.html)
- Alert monitoring dashboard
- Level-based filtering (Low, Medium, High)
- Historical alert trends

### 5. Local Production (pages/production.html)
- Regional production analysis
- Environmental indicators
- Yield predictions

### 6. Competitive Market (pages/competitive.html)
- Pricing analysis
- Margin calculations
- Market positioning

## 🔐 Authentication

All API endpoints use Bearer token authentication:

```javascript
const AUTH_TOKEN = 'sk-haeel-prod-2024';
```

Available tokens:
- `sk-haeel-prod-2024` - Production (100 req/min)
- `sk-haeel-test-2024` - Testing (200 req/min)
- `sk-haeel-admin-2024` - Admin (500 req/min)

## 📊 API Integration

The frontend integrates with these APIs:

1. **Cost Forecast** - `/v1/supply-market/forecast/cost`
2. **Early Warning** - `/v1/supply-market/alerts/early-warning`
3. **Local Production** - `/v1/supply-market/outlook/local-production`
4. **Competitive Health** - `/v1/supply-market/market/competitive-health`
5. **Strategic Summary** - `/v1/supply-market/strategy/summary`

## 🎯 Key Features

### Design System

Custom CSS variables for consistent theming:
- Primary colors (Indigo/Purple)
- Success (Green), Warning (Amber), Danger (Red)
- Dark theme backgrounds
- Smooth animations and transitions

### Components

- Cards with glassmorphism
- Buttons with ripple effects
- Forms with validation
- Badges and alerts
- Loading spinners
- Charts and graphs

### Utilities

- `api.js`: API client with authentication
- Helper functions for formatting
- Error handling
- Loading states

## 🌟 Highlights

- **Stunning Visuals**: Modern gradient backgrounds, glassmorphism effects
- **Smooth Animations**: Fade-in, slide-up, hover effects
- **User-Friendly**: Intuitive navigation and clear CTAs
- **Professional**: Production-ready code quality
- **Responsive**: Mobile-first design approach

## 🔧 Configuration

Edit `assets/js/api.js` to change API settings:

```javascript
const API_CONFIG = {
    baseUrl: 'http://localhost:8000',
    apiVersion: 'v1',
    // ...
};
```

## 📝 Notes

- Charts require Chart.js CDN
- Icons require Font Awesome CDN
- Fonts use Google Fonts CDN
- Internet connection needed for CDN resources

## 🎨 Customization

### Change Colors

Edit CSS variables in `assets/css/main.css`:

```css
:root {
  --primary-500: #6366f1;  /* Change primary color */
  --bg-primary: #0f172a;    /* Change background */
  /* ... */
}
```

### Add New Pages

1. Create new HTML file in `pages/`
2. Copy structure from existing page
3. Add navigation link
4. Implement page logic

## 🚀 Deployment

For production deployment:

1. Build optimized assets
2. Configure CORS on backend
3. Use CDN for static files
4. Enable HTTPS
5. Set production API URL

## 📄 License

© 2026 Supply & Market Analysis. All rights reserved.

## 🤝 Support

For issues or questions:
- Check API documentation: `/docs`
- Review backend logs
- Inspect browser console

---

**Built with ❤️ for impressive client demonstrations!**
