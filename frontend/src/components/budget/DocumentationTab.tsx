import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const DocumentationTab: React.FC = () => {
    const [notes, setNotes] = useState<string>(
        "### Transfer Instructions\n\n- Transfer £500 to Savings Account on the 1st\n- Pay Credit Card in full by the 15th\n\n### Budget Pot Allocations\n- Holiday Fund: £200/mo\n- Car Maintainance: £50/mo"
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Budget Logic & Notes</h3>
                <button className="text-sm flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
                    <Save size={16} />
                    Save Notes
                </button>
            </div>
            <p className="text-sm text-slate-500">
                Document where incomes are transferred, which accounts are used, and how the monthly budget is distributed across pots.
            </p>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-96 p-4 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm text-slate-700 leading-relaxed resize-none"
                placeholder="Type your budget documentation here..."
            />
        </div>
    );
};
