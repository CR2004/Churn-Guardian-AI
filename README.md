# Churn Guardian AI

An AI-powered customer churn prediction dashboard for e-commerce businesses, built for the Klaviyo Winter Challenge hackathon.

## Features

- **Advanced Churn Prediction**: Multi-factor risk scoring algorithm analyzing email engagement, product interactions, and behavioral trends
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

1. **Klaviyo Account**: Create an account at [Klaviyo](https://www.klaviyo.com)
2. **Klaviyo Private API Key**: 
   - Go to [Klaviyo Settings → API Keys](https://www.klaviyo.com/settings/account/api-keys)
   - Create a new Private API Key with "Full Access" permissions
   - Copy the key (starts with `pk_`)
3. **Klaviyo Email List ID**:
bash     curl -X GET "https://a.klaviyo.com/api/lists" \
       -H "Authorization: Klaviyo-API-Key YOUR_PRIVATE_KEY_HERE" \
       -H "revision: 2024-10-15" \
       -H "Content-Type: application/json"

 - Run this command in your terminal (replace `YOUR_PRIVATE_KEY_HERE` with your actual key)
 - Find name email list in the response
 - Copy the `id` field from the email list

4. **Mistral AI API Key**: Get a free API key from [Mistral Console](https://console.mistral.ai)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CR2004/Churn-Guardian-AI.git
   cd churn-guardian-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your credentials:
   ```env
   VITE_KLAVIYO_API_KEY=pk_your_private_api_key_here
   VITE_KLAVIYO_API_REVISION=2024-10-15
   VITE_KLAVIYO_BASE_URL=/api/klaviyo
   VITE_KLAVIYO_EMAIL_LIST_ID=your_list_id_here
   ```

   **Important**: Replace the placeholder values with your actual API keys and List ID.

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

## How It Works

### Advanced Churn Risk Calculation

The app calculates a comprehensive risk score (0-100) for each customer using a weighted multi-factor algorithm:

#### Scoring Components (Total: 100 points)

**1. Email Open Rate (20 points)**
- Penalizes customers who don't open emails
- Formula: `(1 - open_rate) × 0.20`
- Lower open rates = higher risk

**2. Click-Through Rate (20 points)**
- Measures engagement with email content
- Formula: `(1 - click_rate) × 0.20`
- No clicks despite opens indicates declining interest

**3. Email Recency (20 points)**
- Days since last email open
- Formula: `min(days_since_last_open / 30, 1) × 0.20`
- Capped at 30 days for maximum penalty

**4. Product View Recency (20 points)**
- Days since last product browsing activity
- Formula: `min(days_since_last_product_view / 30, 1) × 0.20`
- Indicates interest in inventory

**5. Engagement Trend (10 points)**
- Compares last 30 days vs previous 30 days
- Formula: `(trend < 0 ? min(|trend|, 1) : 0) × 0.10`
- Only negative trends contribute to risk

**6. Email Open Frequency (-5 points bonus)**
- Rewards customers who repeatedly open campaigns
- Formula: `-min(avg_opens_per_campaign / 5, 1) × 0.05`
- Frequent openers are less likely to churn

**7. Negative Email Actions (5 points penalty)**
- Unsubscribes and spam reports
- Formula: `min(negative_actions / emails_delivered, 1) × 0.05`
- Strong indicator of dissatisfaction

#### Risk Categories
- **High Risk (60-100)**: Immediate attention required
- **Medium Risk (30-59)**: Monitor closely
- **Low Risk (0-29)**: Healthy engagement

### Engagement Signals

The system generates contextual alerts based on customer behavior:

- **Email Behavior**: Open rates, click patterns, engagement trends
- **Product Interest**: View recency
- **Negative Actions**: Unsubscribes, spam reports
- **Positive Indicators**: Strong engagement, active browsing

### AI Campaign Generation

Uses Mistral AI's `mistral-small-latest` model to generate:
- Compelling subject lines (under 60 characters)
- Preview text (under 100 characters)
- Personalized email body with special offers
- Strong call-to-action with time-sensitive incentives

## Current Limitations

Due to time constraints in the hackathon, the following limitations exist:

1. **Manual Campaign Review Required**: 
   - Campaigns are created in Klaviyo as drafts
   - Must be reviewed and sent from the Klaviyo dashboard
   - Cannot send directly from the app

2. **List-Based Sending**:
   - Campaigns send to entire lists rather than individual recipients
   - Workaround: manually choose the recipients
   - Not ideal for production use at scale

3. **Basic Product Data**:
   - Currently only tracks product view events
   - No purchase history integration yet
   - Limited product-level insights

## Future Directions

### Short Term
- **Direct Email Sending**: Implement proper single-recipient email delivery
- **Segment-Based Targeting**: Use Klaviyo segments instead of lists for more precise targeting
- **Enhanced Product Analytics**: 
  - Track add-to-cart events
  - Monitor product category preferences
  - Analyze purchase patterns

### Medium Term
- **Machine Learning Model**: 
  - Train supervised ML models on historical churn data
  - Use features: purchase frequency, average order value, seasonality
  - Improve prediction accuracy beyond rule-based scoring

- **A/B Testing Framework**:
  - Test different campaign strategies
  - Measure win-back success rates
  - Optimize subject lines and offers

- **Multi-Channel Support**:
  - SMS campaigns for high-value customers
  - Push notifications for mobile app users
  - Coordinated cross-channel strategies

### Long Term
- **Predictive Lifetime Value**:
  - Forecast customer LTV using historical data
  - Prioritize high-value retention efforts
  - ROI-optimized intervention timing

- **Advanced Personalization**:
  - Product recommendations based on browse history
  - Dynamic discount amounts based on customer value
  - Personalized content using purchase history

- **Automated Workflows**:
  - Trigger campaigns automatically when risk thresholds are crossed
  - Multi-touch nurture sequences
  - Post-win-back engagement monitoring

## Key Components

- **Dashboard**: Overview of high-risk customers, revenue at risk, and campaign performance
- **At-Risk Customers**: Detailed list of customers sorted by risk score with engagement signals
- **Campaign Generator**: AI-powered tool to create personalized win-back campaigns
- **Settings**: Configure churn thresholds, AI model selection, and campaign parameters

## API Integration

### Klaviyo API
- Endpoint: `https://a.klaviyo.com/api`
- Revision: `2024-10-15`
- Required Scopes: 
  - Profiles (read)
  - Events (read)
  - Campaigns (write)
  - Lists (read/write)

### Mistral AI
- Endpoint: `https://api.mistral.ai/v1/chat/completions`
- Model: `mistral-small-latest` (free tier)
- Use: Campaign content generation




## License

MIT

## Built For

Klaviyo Winter Challenge - Showcasing the power of AI-driven customer retention strategies with advanced behavioral analytics and machine learning-ready architecture.