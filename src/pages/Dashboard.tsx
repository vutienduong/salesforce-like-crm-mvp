import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CircleDollarSign, Users, CalendarDays, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading...</div>;

  const cards = [
    { name: 'Total Pipeline Value', value: `$${stats.totalPipelineValue.toLocaleString()}`, icon: CircleDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Won Value', value: `$${stats.wonValue.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Total Contacts', value: stats.totalContacts, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Pending Activities', value: stats.pendingActivities, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">{card.name}</dt>
                    <dd>
                      <div className="text-2xl font-semibold text-slate-900">{card.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">Deals by Stage</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dealsByStage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
