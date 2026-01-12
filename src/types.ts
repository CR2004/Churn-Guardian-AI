export interface Customer {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  riskScore: number;
  churnSignals: string[];
  emailEngagementRate: number;
  productViews: number;
  daysSinceLastProductView: number;
  openRate?: number; // 0-100
  clickRate?: number; // 0-100
  daysSinceLastOpen?: number;
  daysSinceLastClick?: number;
  engagementTrend?: number; // Negative = declining
}

export interface DashboardMetrics {
  highRiskCustomers: number;
  activeCampaigns: number;
}

export interface ChurnData {
  month: string;
  predicted: number;
  actual: number;
}

export interface RiskDistribution {
  name: string;
  value: number;
  color: string;
}

export interface GeneratedCampaign {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  expectedMetrics: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
}

export interface Settings {
  churnThresholds: {
    daysSinceLastPurchase: number;
    minEngagementRate: number;
    minPurchaseFrequency: number;
  };
  mistralModel: 'mistral-small-latest' | 'mistral-medium-latest' | 'mistral-large-latest';
  campaignTone: 'Friendly' | 'Professional' | 'Casual' | 'Luxury';
}

export interface KlaviyoProfile {
  type: string;
  id: string;
  attributes: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    anonymous_id?: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    title?: string;
    image?: string;
    created?: string;
    updated?: string;
    last_event_date?: string;
    location?: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      latitude?: string;
      longitude?: string;
      region?: string;
      zip?: string;
      timezone?: string;
    };
    properties?: Record<string, unknown>;
    predicted_lifetime_value?: number;
  };
}

export interface KlaviyoEvent {
  type: string;
  id: string;
  attributes: {
    timestamp: string;
    event_properties: Record<string, unknown>;
    datetime: string;
    uuid: string;
  };
  relationships?: {
    metric?: {
      data: {
        type: string;
        id: string;
      };
    };
    profile?: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

export interface KlaviyoMetric {
  type: string;
  id: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
    integration?: {
      object?: string;
      category?: string;
    };
  };
}

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  temperature: number;
  max_tokens: number;
}

export interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
