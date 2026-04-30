import { type FormEvent, useEffect, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { FormSheet } from '../components/FormSheet';
import { requestJson } from '../lib/api';

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  account_name: string | null;
  tags: string[];
  created_at: string;
};

type AccountOption = {
  id: string;
  name: string;
};

type ContactFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_id: string;
  tags: string;
};

const emptyContactForm: ContactFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  account_id: '',
  tags: '',
};

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor('first_name', {
    header: 'Name',
    cell: info => <span className="font-medium text-slate-900">{info.row.original.first_name} {info.row.original.last_name}</span>,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: info => <span className="text-slate-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('phone', {
    header: 'Phone',
    cell: info => <span className="text-slate-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('account_name', {
    header: 'Account',
    cell: info => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {info.getValue() || 'No account'}
      </span>
    ),
  }),
  columnHelper.accessor('tags', {
    header: 'Tags',
    cell: info => (
      <div className="flex gap-1">
        {(info.getValue() || []).map((tag: string) => (
          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {tag}
          </span>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: info => <span className="text-slate-500">{format(new Date(info.getValue()), 'MMM d, yyyy')}</span>,
  }),
];

export function Contacts() {
  const [data, setData] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<ContactFormState>(emptyContactForm);

  const loadContacts = async () => {
    const contacts = await requestJson<Contact[]>('/api/contacts');
    setData(contacts);
  };

  const loadAccounts = async () => {
    const accountList = await requestJson<AccountOption[]>('/api/accounts');
    setAccounts(accountList);
  };

  useEffect(() => {
    void Promise.all([loadContacts(), loadAccounts()]);
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setSubmitError('');
    setForm(emptyContactForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await requestJson<{ id: string }>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          account_id: form.account_id || null,
          owner_id: 'user_1',
          tags: form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      await loadContacts();
      closeForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create contact.');
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
        <h2 className="text-lg font-medium text-slate-900">All Contacts</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Contact
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
        title="Create Contact"
        description="Add a new person to an existing account and tag them for follow-up."
        onClose={closeForm}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">First name</span>
              <input
                required
                value={form.first_name}
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Taylor"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Last name</span>
              <input
                required
                value={form.last_name}
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Johnson"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="taylor@company.com"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="+1 555 0101"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Account</span>
            <select
              value={form.account_id}
              onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">No account yet</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Tags</span>
            <input
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="decision_maker, champion"
            />
          </label>

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
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </FormSheet>
    </div>
  );
}
