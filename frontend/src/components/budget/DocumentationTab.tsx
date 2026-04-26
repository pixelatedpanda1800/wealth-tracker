import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const DocumentationTab: React.FC = () => {
  const [notes, setNotes] = useState<string>(
    '### Transfer Instructions\n\n- Transfer £500 to Savings Account on the 1st\n- Pay Credit Card in full by the 15th\n\n### Budget Pot Allocations\n- Holiday Fund: £200/mo\n- Car Maintainance: £50/mo',
  );

  return (
    <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Budget Logic & Notes</h3>
        <button className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <Save size={16} />
          Save Notes
        </button>
      </div>
      <p className="text-sm text-slate-500">
        Document where incomes are transferred, which accounts are used, and how the monthly budget
        is distributed across pots.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="h-96 w-full resize-none rounded-lg border border-slate-200 p-4 font-mono text-sm leading-relaxed text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        placeholder="Type your budget documentation here..."
      />
    </div>
  );
};
