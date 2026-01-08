import type { Customer, KlaviyoProfile, KlaviyoEvent, Settings } from '../types';

export function calculateChurnRisk(
  profile: KlaviyoProfile,
  events: KlaviyoEvent[],
  metrics: Map<string, string>,
  settings?: Settings
): Customer {
  const daysSinceLastPurchase = calculateDaysSinceLastPurchase(events, metrics);
  const emailEngagementRate = calculateEmailEngagementRate(events, metrics);
  const totalSpent = calculateTotalSpent(events, metrics);
  const purchaseCount = calculatePurchaseCount(events, metrics);
  const topProducts = extractTopProducts(events, metrics);

  const thresholds = settings?.churnThresholds || {
    daysSinceLastPurchase: 90,
    minEngagementRate: 20,
    minPurchaseFrequency: 60,
  };

  let riskScore = 0;

  if (daysSinceLastPurchase <= 30) {
    riskScore += 0;
  } else if (daysSinceLastPurchase <= 60) {
    riskScore += 30;
  } else if (daysSinceLastPurchase <= 90) {
    riskScore += 60;
  } else {
    riskScore += 90;
  }

  if (emailEngagementRate > 50) {
    riskScore += 0;
  } else if (emailEngagementRate >= 20) {
    riskScore += 20;
  } else {
    riskScore += 40;
  }

  const accountAgeDays = profile.attributes.created
    ? Math.floor((Date.now() - new Date(profile.attributes.created).getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  const expectedPurchases = Math.floor(accountAgeDays / thresholds.minPurchaseFrequency);
  if (purchaseCount < expectedPurchases) {
    riskScore += 20;
  }

  if (totalSpent > 1000) {
    riskScore -= 10;
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  const churnSignals = generateChurnSignals(
    daysSinceLastPurchase,
    emailEngagementRate,
    purchaseCount,
    expectedPurchases
  );

  const firstName = profile.attributes.first_name || '';
  const lastName = profile.attributes.last_name || '';
  const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || profile.attributes.email || 'Unknown';

  const lastPurchaseDate = getLastPurchaseDate(events, metrics);

  return {
    id: profile.id,
    email: profile.attributes.email || 'No email',
    name,
    firstName,
    lastName,
    lastPurchaseDate,
    totalSpent,
    riskScore,
    churnSignals,
    emailEngagementRate,
    daysSinceLastPurchase,
    purchaseCount,
    topProducts,
  };
}

function calculateDaysSinceLastPurchase(events: KlaviyoEvent[], metrics: Map<string, string>): number {
  const purchaseEvents = events.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Placed Order' || metricName?.toLowerCase().includes('order') || metricName?.toLowerCase().includes('purchase');
  });

  if (purchaseEvents.length === 0) {
    return 999;
  }

  const lastPurchase = purchaseEvents.reduce((latest, event) => {
    const eventDate = new Date(event.attributes.timestamp);
    return eventDate > latest ? eventDate : latest;
  }, new Date(0));

  const daysSince = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
  return daysSince;
}

function calculateEmailEngagementRate(events: KlaviyoEvent[], metrics: Map<string, string>): number {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recentEvents = events.filter(event => new Date(event.attributes.timestamp).getTime() > thirtyDaysAgo);

  const emailSentEvents = recentEvents.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Received Email' || metricName?.toLowerCase().includes('received');
  });

  const emailOpenEvents = recentEvents.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Opened Email' || metricName?.toLowerCase().includes('opened');
  });

  const emailClickEvents = recentEvents.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Clicked Email' || metricName?.toLowerCase().includes('clicked');
  });

  if (emailSentEvents.length === 0) {
    return 0;
  }

  const engagementRate = ((emailOpenEvents.length + emailClickEvents.length) / emailSentEvents.length) * 100;
  return Math.min(100, engagementRate);
}

function calculateTotalSpent(events: KlaviyoEvent[], metrics: Map<string, string>): number {
  const purchaseEvents = events.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Placed Order' || metricName?.toLowerCase().includes('order') || metricName?.toLowerCase().includes('purchase');
  });

  const total = purchaseEvents.reduce((sum, event) => {
    const value = event.attributes.event_properties?.value || event.attributes.event_properties?.total || 0;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  return total;
}

function calculatePurchaseCount(events: KlaviyoEvent[], metrics: Map<string, string>): number {
  const purchaseEvents = events.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Placed Order' || metricName?.toLowerCase().includes('order') || metricName?.toLowerCase().includes('purchase');
  });

  return purchaseEvents.length;
}

function extractTopProducts(events: KlaviyoEvent[], metrics: Map<string, string>): string[] {
  const purchaseEvents = events.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Placed Order' || metricName?.toLowerCase().includes('order') || metricName?.toLowerCase().includes('purchase');
  });

  const products: string[] = [];
  purchaseEvents.forEach(event => {
    const items = event.attributes.event_properties?.items || event.attributes.event_properties?.line_items || [];
    if (Array.isArray(items)) {
      items.forEach((item: { product_name?: string; name?: string }) => {
        const productName = item.product_name || item.name;
        if (productName && typeof productName === 'string') {
          products.push(productName);
        }
      });
    }
  });

  const uniqueProducts = [...new Set(products)];
  return uniqueProducts.slice(0, 5);
}

function getLastPurchaseDate(events: KlaviyoEvent[], metrics: Map<string, string>): string | null {
  const purchaseEvents = events.filter(event => {
    const metricId = event.relationships?.metric?.data?.id;
    if (!metricId) return false;
    const metricName = metrics.get(metricId);
    return metricName === 'Placed Order' || metricName?.toLowerCase().includes('order') || metricName?.toLowerCase().includes('purchase');
  });

  if (purchaseEvents.length === 0) {
    return null;
  }

  const lastPurchase = purchaseEvents.reduce((latest, event) => {
    const eventDate = new Date(event.attributes.timestamp);
    return eventDate > latest ? eventDate : latest;
  }, new Date(0));

  return lastPurchase.toISOString();
}

function generateChurnSignals(
  daysSinceLastPurchase: number,
  emailEngagementRate: number,
  purchaseCount: number,
  expectedPurchases: number
): string[] {
  const signals: string[] = [];

  if (daysSinceLastPurchase > 90) {
    signals.push('No purchase in 90+ days');
  } else if (daysSinceLastPurchase > 60) {
    signals.push('No purchase in 60+ days');
  } else if (daysSinceLastPurchase > 30) {
    signals.push('No purchase in 30+ days');
  }

  if (emailEngagementRate < 20) {
    signals.push('Very low email engagement');
  } else if (emailEngagementRate < 50) {
    signals.push('Declining email engagement');
  }

  if (purchaseCount < expectedPurchases) {
    signals.push('Below expected purchase frequency');
  }

  if (signals.length === 0) {
    signals.push('At risk of churning');
  }

  return signals;
}
