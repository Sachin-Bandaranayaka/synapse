'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RoyalExpressStateChecker() {
    const [states, setStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStates = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/shipping/royal-express/states');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch states');
            }

            setStates(data.states || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error fetching states:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Royal Express State Checker</CardTitle>
                <CardDescription>
                    Verify valid state names for Royal Express shipping
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Button
                        onClick={fetchStates}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Loading...' : 'Check Valid States'}
                    </Button>

                    {error && (
                        <div className="p-3 bg-red-900/50 text-red-400 rounded-md">
                            <p className="font-medium">Error:</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {states.length > 0 && (
                        <div className="p-3 bg-gray-800 rounded-md">
                            <p className="font-medium mb-2">Valid State Names:</p>
                            <ul className="list-disc pl-5 text-sm text-gray-300">
                                {states.map((state) => (
                                    <li key={state}>{state}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 