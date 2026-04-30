import { useEffect, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Plus, CheckCircle2, Circle, Phone, Mail, Users, CheckSquare } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'call': return <Phone className="h-4 w-4 text-blue-500" />;
    case 'email': return <Mail className="h-4 w-4 text-emerald-500" />;
    case 'meeting': return <Users className="h-4 w-4 text-purple-500" />;
    case 'task': return <CheckSquare className="h-4 w-4 text-amber-500" />;
    default: return <Circle className="h-4 w-4 text-slate-500" />;
  }
};

const columns = [
  columnHelper.accessor('status', {
    header: '',
    cell: info => (
      <button 
        onClick={() => {
          const newStatus = info.getValue() === 'Completed' ? 'Pending' : 'Completed';
          fetch(`/api/activities/${info.row.original.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          }).then(() => window.location.reload());
        }}
        className="text-slate-400 hover:text-indigo-600 transition-colors"
      >
        {info.getValue() === 'Completed' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
    ),
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: info => (
      <div className="flex items-center space-x-2">
        {getActivityIcon(info.getValue())}
        <span className="text-sm text-slate-700">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: info => <span className={`font-medium ${info.row.original.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{info.getValue()}</span>,
  }),
  columnHelper.accessor('due_date', {
    header: 'Due Date',
    cell: info => <span className={`text-sm ${new Date(info.getValue()) < new Date() && info.row.original.status !== 'Completed' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>{format(new Date(info.getValue()), 'MMM d, yyyy h:mm a')}</span>,
  }),
  columnHelper.accessor('related_to_type', {
    header: 'Related To',
    cell: info => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">{info.getValue()}</span>,
  }),
];

export function Activities() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/activities').then(res => res.json()).then(setData);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-900">Activities & Tasks</h2>
        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Log Activity
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
    </div>
  );
}
