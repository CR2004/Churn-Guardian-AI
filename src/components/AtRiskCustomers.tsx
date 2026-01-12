import { useMemo, useState } from 'react';
import { AlertTriangle, Mail, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import type { Customer } from '../types';

interface AtRiskCustomersProps {
  customers: Customer[];
  onGenerateCampaign: (customer: Customer) => void;
}

export function AtRiskCustomers({ customers, onGenerateCampaign }: AtRiskCustomersProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const sortedCustomers = useMemo(() => {
    let filtered = [...customers];

    if (filter === 'high') {
      filtered = filtered.filter(c => c.riskScore >= 70);
    } else if (filter === 'medium') {
      filtered = filtered.filter(c => c.riskScore >= 40 && c.riskScore < 70);
    } else if (filter === 'low') {
      filtered = filtered.filter(c => c.riskScore < 40);
    }

    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  }, [customers, filter]);

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 70) return 'bg-red-500/20 border-red-500/30';
    if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">At-Risk Customers</h2>
          <p className="text-white/60 mt-1">{sortedCustomers.length} customers found</p>
        </div>

        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors capitalize
                ${
                  filter === level
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {sortedCustomers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No customers found with this filter</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedCustomers.map(customer => (
            <Card key={customer.id} hover>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                    <p className="text-white/60 text-sm">{customer.email}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full border ${getRiskBgColor(customer.riskScore)}`}>
                    <span className={`font-bold ${getRiskColor(customer.riskScore)}`}>
                      {customer.riskScore}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-white/60 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-white/50">Email Engagement</p>
                    <div className="mt-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${customer.emailEngagementRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      {customer.emailEngagementRate.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/50 mb-2">Churn Signals</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.churnSignals.map((signal, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-200"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => onGenerateCampaign(customer)}
                  className="w-full"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Campaign
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
