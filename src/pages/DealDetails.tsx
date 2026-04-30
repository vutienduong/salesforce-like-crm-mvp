import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Calendar, Clock, User, ArrowRight } from 'lucide-react';

export function DealDetails() {
  const { id } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch(`/api/deals/${id}`).then(res => res.json()).then(setDeal);
    fetch(`/api/deals/${id}/history`).then(res => res.json()).then(setHistory);
  }, [id]);

  if (!deal) return <div className="p-8 text-center text-slate-500">Loading deal details...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link to="/deals" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{deal.name}</h2>
          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center"><Building2 className="h-4 w-4 mr-1" /> {deal.account_name}</span>
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> Close: {format(new Date(deal.close_date), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Stage History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Deal Information</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Value</dt>
                    <dd className="mt-1 text-2xl font-semibold text-slate-900">${deal.value.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Current Stage</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {deal.stage_name}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Probability</dt>
                    <dd className="mt-1 text-sm text-slate-900">{deal.probability}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Status</dt>
                    <dd className="mt-1 text-sm text-slate-900 capitalize">{deal.status}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-6">Stage Change History</h3>
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No stage changes recorded yet.</p>
              ) : (
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {history.map((event, eventIdx) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== history.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white">
                                <Clock className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-slate-500">
                                  Stage changed from{' '}
                                  <span className="font-medium text-slate-900">{event.old_stage_name || 'Unknown'}</span>
                                  {' '}to{' '}
                                  <span className="font-medium text-slate-900">{event.new_stage_name}</span>
                                </p>
                                <div className="mt-2 flex items-center text-xs text-slate-500">
                                  <User className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                  {event.changed_by_name || 'System'}
                                </div>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-slate-500">
                                <time dateTime={event.changed_at}>{format(new Date(event.changed_at), 'MMM d, yyyy h:mm a')}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
