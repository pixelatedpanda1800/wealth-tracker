import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PERIOD_TO_TV, type Period } from '../../utils/investmentUtils';

interface TradingViewWidgetProps {
    ticker: string;
    period: Period;
}

let widgetCounter = 0;

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ ticker, period }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string>(`tv_widget_${++widgetCounter}`);
    const [error, setError] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear any previous widget
        container.innerHTML = '';
        setError(false);

        const widgetDiv = document.createElement('div');
        widgetDiv.id = widgetIdRef.current;
        container.appendChild(widgetDiv);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol: ticker,
            width: '100%',
            height: 200,
            locale: 'en',
            dateRange: PERIOD_TO_TV[period],
            colorTheme: 'light',
            trendLineColor: 'rgba(99, 102, 241, 1)',
            underLineColor: 'rgba(99, 102, 241, 0.15)',
            underLineBottomColor: 'rgba(99, 102, 241, 0)',
            isTransparent: true,
            autosize: false,
            largeChartUrl: `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}`,
        });

        script.onerror = () => setError(true);
        container.appendChild(script);

        return () => {
            if (container) container.innerHTML = '';
        };
    }, [ticker, period]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm flex-col gap-2">
                <span>Chart unavailable</span>
                <a
                    href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-xs"
                >
                    <ExternalLink size={12} /> View on TradingView
                </a>
            </div>
        );
    }

    return (
        <div className="relative">
            <div ref={containerRef} className="rounded-xl overflow-hidden" />
            <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm transition-colors"
            >
                <ExternalLink size={10} /> TradingView
            </a>
        </div>
    );
};
