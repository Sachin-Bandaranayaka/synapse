'use client';

import { format } from 'date-fns';

interface TrackingUpdate {
    id: string;
    status: string;
    location?: string | null;
    description?: string | null;
    timestamp: Date;
}

interface TrackingHistoryProps {
    updates: TrackingUpdate[];
    trackingNumber: string;
    provider: string;
}

export function TrackingHistory({ updates, trackingNumber, provider }: TrackingHistoryProps) {
    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'IN_TRANSIT': 'bg-blue-100 text-blue-800',
            'OUT_FOR_DELIVERY': 'bg-purple-100 text-purple-800',
            'DELIVERED': 'bg-green-100 text-green-800',
            'FAILED': 'bg-red-100 text-red-800',
            'RETURNED': 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getTrackingUrl = () => {
        switch (provider) {
            case 'FARDA_EXPRESS':
                return `https://www.fdedomestic.com/track/${trackingNumber}`;
            case 'TRANS_EXPRESS':
                return `https://transexpress.lk/track-shipment/${trackingNumber}`;
            case 'SL_POST':
                return `http://www.slpost.gov.lk/track-trace/${trackingNumber}`;
            default:
                return null;
        }
    };

    return (
        <div className="flow-root">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-base font-medium text-white">Tracking Updates</h4>
                {getTrackingUrl() && (
                    <a
                        href={getTrackingUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        Track on {provider.split('_')[0]} →
                    </a>
                )}
            </div>
            <ul role="list" className="-mb-8">
                {updates.map((update, idx) => (
                    <li key={update.id}>
                        <div className="relative pb-8">
                            {idx !== updates.length - 1 && (
                                <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-700"
                                    aria-hidden="true"
                                />
                            )}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-gray-900 ${idx === 0 ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                        <svg
                                            className={`h-5 w-5 ${idx === 0 ? 'text-white' : 'text-gray-400'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                                            />
                                        </svg>
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-white">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mr-2 ${getStatusColor(update.status)}`}>
                                                {update.status.replace('_', ' ')}
                                            </span>
                                            {update.description || update.location || 'Status updated'}
                                        </p>
                                        {update.location && (
                                            <p className="mt-0.5 text-sm text-gray-400">
                                                Location: {update.location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-400">
                                        <time dateTime={update.timestamp.toISOString()}>
                                            {format(new Date(update.timestamp), 'PPp')}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
} 