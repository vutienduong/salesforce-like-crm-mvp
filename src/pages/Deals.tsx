import { type FormEvent, useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, ExternalLink } from 'lucide-react';
import { FormSheet } from '../components/FormSheet';
import { requestJson } from '../lib/api';

type Stage = {
  id: string;
  name: string;
  probability: number;
};

type AccountOption = {
  id: string;
  name: string;
};

type Deal = {
  id: string;
  name: string;
  value: number;
  stage_id: string;
  account_name: string | null;
  account_id: string;
  close_date: string | null;
};

type DealFormState = {
  name: string;
  value: string;
  account_id: string;
  stage_id: string;
  close_date: string;
};

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-slate-900 truncate">{deal.name}</h4>
        <Link to={`/deals/${deal.id}`} className="text-slate-400 hover:text-indigo-600 z-10" onPointerDown={(e) => e.stopPropagation()}>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <div className="text-lg font-semibold text-slate-700 mb-2">${deal.value.toLocaleString()}</div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{deal.account_name || 'No account'}</span>
        <span>{deal.close_date ? format(new Date(deal.close_date), 'MMM d') : 'No close date'}</span>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const { setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div className="flex-shrink-0 w-80 bg-slate-100 rounded-xl flex flex-col max-h-full">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h3 className="font-semibold text-slate-700">{stage.name}</h3>
        <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs font-medium">
          {deals.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            // @ts-ignore
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {deals.length === 0 && (
          <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-sm text-slate-400">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
}

export function Deals() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<DealFormState>({
    name: '',
    value: '',
    account_id: '',
    stage_id: '',
    close_date: '',
  });

  const loadPipeline = async () => {
    const [stagesData, dealsData, accountData] = await Promise.all([
      requestJson<Stage[]>('/api/pipeline-stages'),
      requestJson<Deal[]>('/api/deals'),
      requestJson<AccountOption[]>('/api/accounts'),
    ]);

    setStages(stagesData);
    setDeals(dealsData);
    setAccounts(accountData);
    setForm((prev) => ({
      ...prev,
      account_id: prev.account_id || accountData[0]?.id || '',
      stage_id: prev.stage_id || stagesData[0]?.id || '',
    }));
  };

  useEffect(() => {
    void loadPipeline();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeDeal = deals.find(d => d.id === active.id);
    if (!activeDeal) return;
    const overId = over.id;
    
    // Find stage of over item or if over is a stage
    const overDeal = deals.find(d => d.id === overId);
    const overStageId = overDeal ? overDeal.stage_id : stages.find(s => s.id === overId)?.id;

    if (!overStageId || activeDeal.stage_id === overStageId) return;

    setDeals(prev => prev.map(d => d.id === active.id ? { ...d, stage_id: overStageId } : d));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeDeal = deals.find(d => d.id === active.id);
    if (!activeDeal) return;
    const overDeal = deals.find(d => d.id === over.id);
    const targetStageId = overDeal ? overDeal.stage_id : stages.find(s => s.id === over.id)?.id;

    if (targetStageId && activeDeal.stage_id !== targetStageId) {
      void requestJson(`/api/deals/${active.id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage_id: targetStageId })
      });
    }
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  const closeForm = () => {
    setIsFormOpen(false);
    setSubmitError('');
    setForm({
      name: '',
      value: '',
      account_id: accounts[0]?.id || '',
      stage_id: stages[0]?.id || '',
      close_date: '',
    });
  };

  const handleCreateDeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await requestJson<{ id: string }>('/api/deals', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          owner_id: 'user_1',
          value: Number(form.value),
        }),
      });

      await loadPipeline();
      closeForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-medium text-slate-900">Sales Pipeline</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Deal
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex space-x-4 h-full items-start">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {stages.map(stage => (
              // @ts-ignore
              <SortableContext key={stage.id} items={[stage.id, ...deals.filter(d => d.stage_id === stage.id).map(d => d.id)]} strategy={verticalListSortingStrategy}>
                <PipelineColumn 
                  stage={stage} 
                  deals={deals.filter(d => d.stage_id === stage.id)} 
                />
              </SortableContext>
            ))}
            <DragOverlay>
              {activeDeal ? <DealCard deal={activeDeal} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <FormSheet
        open={isFormOpen}
        title="Create Deal"
        description="Create an opportunity and drop it directly into your pipeline."
        onClose={closeForm}
      >
        <form className="space-y-5" onSubmit={handleCreateDeal}>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Deal name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Northstar Expansion 2026"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Value</span>
              <input
                required
                type="number"
                min="1"
                value={form.value}
                onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="25000"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Close date</span>
              <input
                type="date"
                value={form.close_date}
                onChange={(event) => setForm((prev) => ({ ...prev, close_date: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Account</span>
              <select
                required
                value={form.account_id}
                onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Stage</span>
              <select
                required
                value={form.stage_id}
                onChange={(event) => setForm((prev) => ({ ...prev, stage_id: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} ({stage.probability}%)
                  </option>
                ))}
              </select>
            </label>
          </div>

          {submitError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !accounts.length || !stages.length}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </FormSheet>
    </div>
  );
}
