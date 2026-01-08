import { useMemo } from 'react';
import { AlertTriangle, DollarSign, TrendingUp, Mail, Lightbulb } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from './MetricCard';
import { Card } from './Card';
import type { Customer, DashboardMetrics, ChurnData, RiskDistribution } from '../types';

interface DashboardProps {
  customers: Customer[];
}

export function Dashboard({ customers }: DashboardProps) {
  const metrics = useMemo<DashboardMetrics>(() => {
    const highRiskCustomers = customers.filter(c => c.riskScore >= 60).length;
    const revenueAtRisk = customers
      .filter(c => c.riskScore >= 60)
      .reduce((sum, c) => sum + c.totalSpent, 0);

    return {
      highRiskCustomers,
      revenueAtRisk,
      revenueRecovered: 12450,
      activeCampaigns: 3,
    };
  }, [customers]);

  const churnData = useMemo<ChurnData[]>(() => {
    return [
      { month: 'Aug', predicted: 12, actual: 10 },
      { month: 'Sep', predicted: 15, actual: 13 },
      { month: 'Oct', predicted: 18, actual: 14 },
      { month: 'Nov', predicted: 22, actual: 16 },
      { month: 'Dec', predicted: 25, actual: 18 },
      { month: 'Jan', predicted: 20, actual: 15 },
    ];
  }, []);

  const riskDistribution = useMemo<RiskDistribution[]>(() => {
    const high = customers.filter(c => c.riskScore >= 70).length;
    const medium = customers.filter(c => c.riskScore >= 40 && c.riskScore < 70).length;
    const low = customers.filter(c => c.riskScore < 40).length;

    return [
      { name: 'High Risk', value: high, color: '#ef4444' },
      { name: 'Medium Risk', value: medium, color: '#f59e0b' },
      { name: 'Low Risk', value: low, color: '#10b981' },
    ];
  }, [customers]);

  const insights = useMemo(() => {
    const avgRiskScore = customers.length > 0
      ? customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length
      : 0;

    const highValueAtRisk = customers.filter(c => c.riskScore >= 60 && c.totalSpent > 1000).length;

    return [
      `${metrics.highRiskCustomers} customers are at high risk of churning this month`,
      `$${metrics.revenueAtRisk.toFixed(0)} in potential revenue loss if no action taken`,
      `Average churn risk score: ${avgRiskScore.toFixed(0)}/100`,
      `${highValueAtRisk} high-value customers need immediate attention`,
      `Win-back campaigns have recovered $${metrics.revenueRecovered} in the last 30 days`,
    ];
  }, [customers, metrics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="High Risk Customers"
          value={metrics.highRiskCustomers}
          icon={<AlertTriangle className="w-6 h-6 text-red-300" />}
        />
        <MetricCard
          title="Revenue at Risk"
          value={`$${metrics.revenueAtRisk.toFixed(0)}`}
          icon={<DollarSign className="w-6 h-6 text-yellow-300" />}
        />
        <MetricCard
          title="Revenue Recovered"
          value={`$${metrics.revenueRecovered}`}
          icon={<TrendingUp className="w-6 h-6 text-green-300" />}
          trend={{ value: 23, isPositive: true }}
        />
        <MetricCard
          title="Active Campaigns"
          value={metrics.activeCampaigns}
          icon={<Mail className="w-6 h-6 text-blue-300" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-bold text-white mb-4">Churn Prevention Impact</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={churnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#a855f7"
                strokeWidth={2}
                name="Predicted Churn"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#ec4899"
                strokeWidth={2}
                name="Actual Churn"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-white mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-300" />
          </div>
          <h3 className="text-xl font-bold text-white">AI Insights</h3>
        </div>
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-3 text-white/80">
              <span className="text-pink-400 font-bold">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
