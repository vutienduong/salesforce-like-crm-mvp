import { type FormEvent, useEffect, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, Building2 } from 'lucide-react';
import { FormSheet } from '../components/FormSheet';
import { requestJson } from '../lib/api';

type Account = {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  created_at: string;
};

type AccountFormState = {
  name: string;
  industry: string;
  size: string;
};

const emptyAccountForm: AccountFormState = {
  name: '',
  industry: '',
  size: 'Mid-Market',
};

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Account Name',
    cell: info => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-indigo-600" />
        </div>
        <span className="font-medium text-slate-900">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('industry', {
    header: 'Industry',
    cell: info => <span className="text-slate-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('size', {
    header: 'Company Size',
    cell: info => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{info.getValue()}</span>,
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: info => <span className="text-slate-500">{format(new Date(info.getValue()), 'MMM d, yyyy')}</span>,
  }),
];

export function Accounts() {
  const [data, setData] = useState<Account[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<AccountFormState>(emptyAccountForm);

  const loadAccounts = async () => {
    const accounts = await requestJson<Account[]>('/api/accounts');
    setData(accounts);
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setSubmitError('');
    setForm(emptyAccountForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await requestJson<{ id: string }>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          owner_id: 'user_1',
        }),
      });

      await loadAccounts();
      closeForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-900">All Accounts</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Account
        </button>
      </div>
      
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormSheet
        open={isFormOpen}
        title="Create Account"
        description="Create a company record before you start linking contacts and deals."
        onClose={closeForm}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Account name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Northstar Health"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Industry</span>
              <input
                value={form.industry}
                onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Healthcare"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Company size</span>
              <select
                value={form.size}
                onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>SMB</option>
                <option>Mid-Market</option>
                <option>Enterprise</option>
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
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </FormSheet>
    </div>
  );
}
