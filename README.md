# Churn Guardian AI

An AI-powered customer churn prediction dashboard for e-commerce businesses, built for the Klaviyo Winter Challenge hackathon.

## Features

- **Customer Churn Prediction**: Automatically calculates risk scores for customers based on purchase history, email engagement, and behavioral patterns
- **AI-Powered Campaign Generator**: Uses Mistral AI to generate personalized win-back email campaigns
- **Real-time Klaviyo Integration**: Fetches customer data and events from Klaviyo's REST API
- **Interactive Dashboard**: Visualizes churn metrics, risk distribution, and campaign performance
- **Customizable Settings**: Adjust churn thresholds, AI model selection, and campaign tone

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom gradient design
- **Data Visualization**: Recharts
- **API Integration**: Axios
- **AI**: Mistral AI (free tier)
- **Customer Data**: Klaviyo REST API

## Getting Started

### Prerequisites

1. **Klaviyo API Key**: Get your API key from [Klaviyo Settings](https://www.klaviyo.com/settings/account/api-keys)
2. **Mistral AI API Key**: Get a free API key from [Mistral Console](https://console.mistral.ai)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to the `.env` file (or enter them directly in the app)

### Development

Run the development server:
```bash
npm run dev
```

### Build

Build for production:
```bash
npm run build
```

## How It Works

### Churn Risk Calculation

The app calculates a risk score (0-100) for each customer based on:

- **Days Since Last Purchase**:
  - 0-30 days = 0 points
  - 31-60 days = 30 points
  - 61-90 days = 60 points
  - 90+ days = 90 points

- **Email Engagement**:
  - >50% opens = 0 points
  - 20-50% opens = 20 points
  - <20% opens = 40 points

- **Purchase Frequency**:
  - Below expected frequency = +20 points

- **Customer Value**:
  - LTV > $1000 = -10 points

### AI Campaign Generation

Uses Mistral AI's `mistral-small-latest` model to generate:
- Compelling subject lines (under 60 characters)
- Preview text (under 100 characters)
- Personalized email body with 20% discount offer
- Strong call-to-action with 48-hour urgency

## Key Components

- **Dashboard**: Overview of high-risk customers, revenue at risk, and campaign performance
- **At-Risk Customers**: Detailed list of customers sorted by risk score
- **Campaign Generator**: AI-powered tool to create personalized win-back campaigns
- **Settings**: Configure churn thresholds, AI model, and campaign tone

## API Integration

### Klaviyo API
- Endpoint: `https://a.klaviyo.com/api`
- Revision: `2024-10-15`
- Features: Profile fetching, event tracking, campaign creation

### Mistral AI
- Endpoint: `https://api.mistral.ai/v1/chat/completions`
- Model: `mistral-small-latest` (free tier)
- Use: Campaign content generation

## Deployment

This app is ready to deploy to Vercel, Netlify, or any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables in your hosting platform

## License

MIT

## Built For

Klaviyo Winter Challenge - Showcasing the power of AI-driven customer retention strategies
