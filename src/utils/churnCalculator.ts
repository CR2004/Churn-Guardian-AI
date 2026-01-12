import type { Customer, KlaviyoProfile, KlaviyoEvent } from '../types';

function logEngagementMetrics(
  email: string,
  engagementMetrics: EngagementMetrics,
  productMetrics: ProductMetrics,
  openRate: number,
  clickRate: number,
  engagementTrend: number,
  daysSinceLastOpen: number,
  daysSinceLastClick: number,
  daysSinceLastProductView: number,
  riskScore: number
) {
  console.group(`📧 ${email}`);
  console.log('📊 Raw Engagement Data:');
  console.log(`  • Emails Sent (30d): ${engagementMetrics.emailsDelivered}`);
  console.log(`  • Unique Opens: ${engagementMetrics.uniqueOpens}`);
  console.log(`  • Unique Clicks: ${engagementMetrics.uniqueClicks}`);
  console.log(`  • Product Views (30d): ${productMetrics.productViews}`);
  console.log(`  • Last Open: ${engagementMetrics.lastOpenTimestamp ? new Date(engagementMetrics.lastOpenTimestamp).toLocaleDateString() : 'Never'}`);
  console.log(`  • Last Click: ${engagementMetrics.lastClickTimestamp ? new Date(engagementMetrics.lastClickTimestamp).toLocaleDateString() : 'Never'}`);
  console.log(`  • Last Product View: ${productMetrics.lastViewTimestamp ? new Date(productMetrics.lastViewTimestamp).toLocaleDateString() : 'Never'}`);
  
  console.log('');
  console.log('📈 Calculated Metrics:');
  console.log(`  • Open Rate: ${(openRate * 100).toFixed(1)}%`);
  console.log(`  • Click Rate: ${(clickRate * 100).toFixed(1)}%`);
  console.log(`  • Engagement Trend: ${engagementTrend > 0 ? '📈' : '📉'} ${(engagementTrend * 100).toFixed(1)}%`);
  console.log(`  • Days Since Last Open: ${daysSinceLastOpen}`);
  console.log(`  • Days Since Last Click: ${daysSinceLastClick}`);
  console.log(`  • Days Since Last Product View: ${daysSinceLastProductView}`);
  
  console.log('');
  console.log('🎯 Risk Calculation:');
  console.log(`  • (1 - Open Rate) × 0.30 = ${((1 - openRate) * 0.30 * 100).toFixed(1)} points`);
  console.log(`  • (1 - Click Rate) × 0.25 = ${((1 - clickRate) * 0.25 * 100).toFixed(1)} points`);
  console.log(`  • Email Recency × 0.20 = ${(Math.min(daysSinceLastOpen / 30, 1) * 0.20 * 100).toFixed(1)} points`);
  console.log(`  • Product View Recency × 0.15 = ${(Math.min(daysSinceLastProductView / 30, 1) * 0.15 * 100).toFixed(1)} points`);
  console.log(`  • Trend Score × 0.10 = ${((engagementTrend < 0 ? Math.min(Math.abs(engagementTrend), 1) : 0) * 0.10 * 100).toFixed(1)} points`);
  console.log(`  • TOTAL RISK SCORE: ${riskScore}/100 ${riskScore >= 60 ? '🔴 HIGH' : riskScore >= 30 ? '🟡 MEDIUM' : '🟢 LOW'}`);
  console.groupEnd();
}

export function calculateChurnRisk(
  profile: KlaviyoProfile,
  events: KlaviyoEvent[],
  metrics: Map<string, string>
): Customer {
  // Calculate engagement metrics
  const engagementMetrics = calculateEngagementMetrics(events);

    // Calculate product view metrics
  const productMetrics = calculateProductMetrics(events, metrics);

    // Derived features
  const openRate = engagementMetrics.emailsDelivered > 0
      ? Math.min(engagementMetrics.uniqueOpens,1) / engagementMetrics.emailsDelivered
      : 0;
  const clickRate = engagementMetrics.emailsDelivered > 0
      ? Math.min(engagementMetrics.uniqueClicks,1) / engagementMetrics.emailsDelivered
      : 0;
  const now = Date.now();
    // Last 30 days
  const last30Start = now - 30 * 24 * 60 * 60 * 1000;
  const last30Events = filterEventsByDateRange(events, last30Start, now);
  const last30Metrics = calculateEngagementMetrics(last30Events);
  const openRate30 = last30Metrics.emailsDelivered > 0 
      ? Math.min(last30Metrics.uniqueOpens, 1) / last30Metrics.emailsDelivered
      : 0;

    // Previous 30 days (31-60 days ago)
  const prev30Start = now - 60 * 24 * 60 * 60 * 1000;
  const prev30End = last30Start;
  const prev30Events = filterEventsByDateRange(events, prev30Start, prev30End);
  const prev30Metrics = calculateEngagementMetrics(prev30Events);
  const openRatePrev30 = prev30Metrics.emailsDelivered > 0
      ? Math.min(prev30Metrics.uniqueOpens, 1) / prev30Metrics.emailsDelivered
      : 0;

  // Engagement trend
  const engagementTrend = openRate30 - openRatePrev30;
  console.log(`Open Rate 30d: ${(openRate30 * 100).toFixed(1)}%`);
  console.log(`Open Rate 60d: ${(openRatePrev30 * 100).toFixed(1)}%`);

  // Recency calculations
  const daysSinceLastOpen = engagementMetrics.lastOpenTimestamp
    ? Math.floor((Date.now() - engagementMetrics.lastOpenTimestamp) / (1000 * 60 * 60 * 24))
    : 999;

  const daysSinceLastClick = engagementMetrics.lastClickTimestamp
    ? Math.floor((Date.now() - engagementMetrics.lastClickTimestamp) / (1000 * 60 * 60 * 24))
    : 999;

  const daysSinceLastProductView = productMetrics.lastViewTimestamp
    ? Math.floor((Date.now() - productMetrics.lastViewTimestamp) / (1000 * 60 * 60 * 24))
    : 999;

  const emailRecencyScore = Math.min(daysSinceLastOpen / 30, 1);
  const productRecencyScore = Math.min(daysSinceLastProductView / 30, 1);
  const negativeTrendScore = engagementTrend < 0 ? Math.min(Math.abs(engagementTrend), 1) : 0;

  // ------------------ NEW: Negative Email Events ------------------
  const negativeEvents = events.filter(e => {
    const id = e.relationships?.metric?.data?.id;
    return id === 'Tn2r9f' || id === 'VasiDJ'; // unsubscribe or marked spam
  });
  const negativeCount = engagementMetrics.emailsDelivered > 0 ? negativeEvents.length/engagementMetrics.emailsDelivered : 0; // Normalize by emails delivered
  const negativePenalty = Math.min(negativeCount, 1); 

  const campaignOpens = calculateEmailOpenFrequency(events);

  // Average opens per campaign
  const avgOpens = campaignOpens.size > 0 ? [...campaignOpens.values()].reduce((a, b) => a + b, 0) / campaignOpens.size : 0;

  const MAX_EXPECTED_OPENS = 5; 

  const normalizedFrequencyScore = Math.min(avgOpens / MAX_EXPECTED_OPENS, 1);
  console.log(`Average Opens per Campaign: ${avgOpens.toFixed(2)}, Normalized Frequency Score: ${(normalizedFrequencyScore * 100).toFixed(1)}%`);

  //CHURN SCORE CALCULATION 
  const churnScore =
    0.20 * (1 - openRate) +       // penalize low open rates
    0.20 * (1 - clickRate) +      // penalize low engagement rates
    0.20 * emailRecencyScore +    // reward recent engagement with emails
    0.20 * productRecencyScore +  // reward recent engagement with products
    0.10 * negativeTrendScore -   // penalize declining engagement
    0.05 * normalizedFrequencyScore +   // reward frequent opening of email
    0.05 * negativePenalty / 100;        // penalize negative email action

  const riskScore = Math.round(Math.max(0, Math.min(100, churnScore * 100)));
  console.log(`Calculated Risk Score: ${riskScore}/100`);
  console.log(normalizedFrequencyScore, negativePenalty);

  logEngagementMetrics(
    profile.attributes.email || 'Unknown',
    engagementMetrics,
    productMetrics,
    openRate,
    clickRate,
    engagementTrend,
    daysSinceLastOpen,
    daysSinceLastClick,
    daysSinceLastProductView,
    riskScore
  );

  const churnSignals = generateEngagementSignals(
    openRate,
    clickRate,
    engagementTrend,
    daysSinceLastOpen,
    daysSinceLastClick,
    daysSinceLastProductView,
    productMetrics.productViews,
    negativeCount
  );




  const firstName = profile.attributes.first_name || '';
  const lastName = profile.attributes.last_name || '';
  const name = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || profile.attributes.email || 'Unknown';

  return {
    id: profile.id,
    email: profile.attributes.email || 'No email',
    name,
    firstName,
    lastName,
    riskScore,
    churnSignals,
    emailEngagementRate: Math.round(openRate * 100),
    openRate: Math.round(openRate * 100),
    clickRate: Math.round(clickRate * 100),
    daysSinceLastOpen,
    daysSinceLastClick,
    engagementTrend: Math.round(engagementTrend * 100),
    productViews: productMetrics.productViews,
    daysSinceLastProductView,
  };
}

// ==================== ENGAGEMENT METRICS ====================

interface EngagementMetrics {
  emailsDelivered: number;
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  lastOpenTimestamp: number | null;
  lastClickTimestamp: number | null;
}

interface ProductMetrics {
  productViews: number;
  lastViewTimestamp: number | null;
}

function calculateEmailOpenFrequency(openEvents: KlaviyoEvent[]): Map<string, number> {
  const campaignOpens = new Map<string, number>();

  openEvents.forEach(event => {
    const rawCampaign = event.attributes.event_properties?.campaign_id ?? event.id;
    const campaign = String(rawCampaign);
    campaignOpens.set(campaign, (campaignOpens.get(campaign) || 0) + 1);
  });

  return campaignOpens;
}

function calculateEngagementMetrics(
  events: KlaviyoEvent[]
): EngagementMetrics {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recentEvents = events.filter(event => {
    const ts = parseEventTimestamp(event.attributes.timestamp);
    return !Number.isNaN(ts) && ts > thirtyDaysAgo;
  });

  const receivedEvents = recentEvents.filter(
    e => e.relationships?.metric?.data?.id === 'TZ3tKS'
  );

  const openEvents = recentEvents.filter(
    e => e.relationships?.metric?.data?.id === 'VMtmgm'
  );

  const clickEvents = recentEvents.filter(
    e => e.relationships?.metric?.data?.id === 'XzTeLQ'
  );

  const uniqueOpens = new Set(
    openEvents.map(e => e.attributes.event_properties?.campaign_id ?? e.id)
  ).size;

  const uniqueClicks = new Set(
    clickEvents.map(e => e.attributes.event_properties?.campaign_id ?? e.id)
  ).size;

  const lastOpenTimestamp =
    openEvents.length > 0
      ? Math.max(...openEvents.map(e => parseEventTimestamp(e.attributes.timestamp)))
      : null;

  const lastClickTimestamp =
    clickEvents.length > 0
      ? Math.max(...clickEvents.map(e => parseEventTimestamp(e.attributes.timestamp)))
      : null;

  const openRate =
    receivedEvents.length > 0 ? Math.min(uniqueOpens, 1) / receivedEvents.length : 0;

  const clickRate =
    receivedEvents.length > 0 ? Math.min(uniqueClicks, 1) / receivedEvents.length : 0;

    

  return {
    emailsDelivered: receivedEvents.length,
    uniqueOpens,
    uniqueClicks,
    openRate,
    clickRate,
    lastOpenTimestamp,
    lastClickTimestamp,
  };
}


function calculateProductMetrics(
  events: KlaviyoEvent[],
  metrics: Map<string, string>
): ProductMetrics {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  // Filter to last 30 days
  const recentEvents = events.filter(
    event => new Date(event.attributes.timestamp).getTime() > thirtyDaysAgo
  );
  
  // Get product view events using exact metric ID
  const viewEvents = filterByMetricId(recentEvents, metrics, 'RQwDmd'); // Viewed Product
  
  // Get last timestamp
  const lastViewTimestamp = viewEvents.length > 0
    ? Math.max(...viewEvents.map(e => new Date(e.attributes.timestamp).getTime()))
    : null;
  console.log(`Product Views in last 30 days: ${viewEvents.length}, Last View Timestamp: ${lastViewTimestamp ? new Date(lastViewTimestamp).toLocaleDateString() : 'Never'}`);
  return {
    productViews: viewEvents.length,
    lastViewTimestamp,
  };
}

// ==================== HELPER FUNCTIONS ====================

function parseEventTimestamp(ts: string | number): number {
  // If already a number
  if (typeof ts === 'number') {
    return ts < 1e12 ? ts * 1000 : ts;
  }

  // If numeric string (unix timestamp)
  if (/^\d+$/.test(ts)) {
    const num = Number(ts);
    return num < 1e12 ? num * 1000 : num;
  }

  // ISO string
  return Date.parse(ts);
}

function filterEventsByDateRange(
  events: KlaviyoEvent[],
  start: number,
  end: number
): KlaviyoEvent[] {
  return events.filter(event => {
    const ts = parseEventTimestamp(event.attributes.timestamp);
    return !Number.isNaN(ts) && ts >= start && ts <= end;
  });
}




// Filter by exact metric ID
function filterByMetricId(
  events: KlaviyoEvent[],
  metrics: Map<string, string>,
  metricId: string
): KlaviyoEvent[] {
  return events.filter(event => {
    const eventMetricId = event.relationships?.metric?.data?.id;
    return eventMetricId === metricId;
  });
}

function generateEngagementSignals(
  openRate: number,
  clickRate: number,
  trend: number,
  daysSinceLastOpen: number,
  daysSinceLastClick: number,
  daysSinceLastProductView: number,
  productViews: number,
  negativeCount: number = 0
): string[] {
  const signals: string[] = [];

  // Negative email signals
  if (negativeCount > 0) {
    signals.push(`⚠️ ${negativeCount} negative email actions (unsubscribe/spam)`);
  }

  // Existing engagement signals
  if (openRate === 0) signals.push('❌ No email opens detected in past 30 days');
  else if (openRate < 0.1) signals.push('⚠️ Very low email open rate (under 10%)');
  else if (openRate < 0.2) signals.push('📉 Below average email open rate');

  if (clickRate === 0 && openRate > 0) signals.push('👆 Opening emails but not clicking through');
  else if (clickRate < 0.05) signals.push('🔗 Minimal email click activity');

  if (trend < -0.25) signals.push('📉 Email engagement declining sharply (-25%+)');
  else if (trend < -0.1) signals.push('📊 Email engagement trending downward');
  else if (trend > 0.15) signals.push('✨ Email engagement improving');

  if (daysSinceLastOpen > 90) signals.push(`📭 No email opens in ${daysSinceLastOpen} days`);
  else if (daysSinceLastOpen > 60) signals.push(`⏰ Last email opened ${daysSinceLastOpen} days ago`);
  else if (daysSinceLastOpen > 30) signals.push(`📅 Last email opened ${daysSinceLastOpen} days ago`);

  if (daysSinceLastClick > 120) signals.push(`🖱️ No email clicks in ${daysSinceLastClick}+ days`);
  else if (daysSinceLastClick > 60) signals.push(`🔗 Last clicked email ${daysSinceLastClick} days ago`);

  if (productViews === 0) signals.push('🛍️ No product views in past 30 days');
  else if (daysSinceLastProductView > 60) signals.push(`👀 Last viewed product ${daysSinceLastProductView} days ago`);
  else if (daysSinceLastProductView > 30) signals.push(`🔍 Product view ${daysSinceLastProductView} days ago`);

  // Positive signals
  if (openRate > 0.4 && clickRate > 0.15) signals.push('✅ Strong email engagement');
  if (productViews > 5 && daysSinceLastProductView < 7) signals.push('🔥 Actively browsing products');

  if (signals.length === 0) signals.push('📊 Moderate engagement patterns detected');

  return signals;
}
