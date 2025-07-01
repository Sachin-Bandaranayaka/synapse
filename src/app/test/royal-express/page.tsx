'use client';

import { useState, useEffect } from 'react';

interface State {
    id: number;
    name: string;
    ref_no: string;
    country_id: number;
    has_child: boolean;
}

interface City {
    id: number;
    name: string;
    state_id: number;
    state?: {
        id: number;
        name: string;
    };
}

export default function RoyalExpressTestPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [tenant, setTenant] = useState<string>('');
    const [availableTenants] = useState<string[]>(['developers', 'royal', 'curfox', 'merchant', 'royalexpress']);
    const [testShipment, setTestShipment] = useState<boolean>(false);

    // State management
    const [states, setStates] = useState<State[]>([]);
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [statesLoading, setStatesLoading] = useState<boolean>(false);
    const [stateSearchTerm, setStateSearchTerm] = useState<string>('');

    // City management
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const [citiesLoading, setCitiesLoading] = useState<boolean>(false);
    const [citySearchTerm, setCitySearchTerm] = useState<string>('');

    // Fetch states from the API
    const fetchStates = async () => {
        setStatesLoading(true);
        setError(null);

        try {
            // Build query params
            let queryParams = new URLSearchParams();
            if (tenant) queryParams.append('tenant', tenant);
            if (stateSearchTerm) queryParams.append('search', stateSearchTerm);

            const response = await fetch(`/api/test/royal-express/states?${queryParams.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setStates(data.states || []);
            } else {
                setError(data.message || 'Failed to fetch states');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred fetching states');
        } finally {
            setStatesLoading(false);
        }
    };

    // Fetch cities from the API
    const fetchCities = async (forceRefresh = false) => {
        setCitiesLoading(true);
        setError(null);

        try {
            // Build query params
            let queryParams = new URLSearchParams();
            if (tenant) queryParams.append('tenant', tenant);

            // If a state is selected, filter cities by state
            if (selectedStateId) {
                queryParams.append('state_id', selectedStateId.toString());
            } else if (citySearchTerm) {
                // Only use search term if no state is selected
                queryParams.append('search', citySearchTerm);
            }

            const response = await fetch(`/api/test/royal-express/cities?${queryParams.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setCities(data.cities || []);

                // Reset selected city if force refreshing or state changed
                if (forceRefresh) {
                    setSelectedCityId(null);
                }
            } else {
                setError(data.message || 'Failed to fetch cities');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred fetching cities');
        } finally {
            setCitiesLoading(false);
        }
    };

    // Fetch states when tenant changes or search term changes
    useEffect(() => {
        if (tenant) {
            fetchStates();
        }
    }, [tenant, stateSearchTerm]);

    // Fetch cities when state selection changes
    useEffect(() => {
        if (tenant) {
            fetchCities(true);
        }
    }, [tenant, selectedStateId]);

    // Fetch cities when search term changes and no state is selected
    useEffect(() => {
        if (tenant && !selectedStateId && citySearchTerm) {
            fetchCities(false);
        }
    }, [tenant, citySearchTerm]);

    // Handle state selection change
    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStateId = e.target.value ? Number(e.target.value) : null;
        setSelectedStateId(newStateId);
    };

    async function runTest() {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Add parameters to query string
            let queryString = '';
            if (tenant) queryString += `tenant=${tenant}`;
            if (testShipment) {
                queryString += queryString ? '&' : '';
                queryString += 'testShipment=true';
            }
            if (selectedCityId) {
                queryString += queryString ? '&' : '';
                queryString += `cityId=${selectedCityId}`;
            }
            if (selectedStateId) {
                queryString += queryString ? '&' : '';
                queryString += `stateId=${selectedStateId}`;
            }

            const url = `/api/test/royal-express${queryString ? `?${queryString}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                setError(data.message || 'Test failed');
                setResult(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Royal Express (Curfox) Integration Test</h1>

            <div className="mb-6">
                <p className="mb-4">
                    This page tests the integration with Royal Express (Curfox) using the credentials configured in your environment.
                </p>

                <div className="p-4 mb-4 border border-blue-400 bg-blue-50 text-blue-800 rounded">
                    <h3 className="font-semibold mb-2">Testing Notes</h3>
                    <ul className="list-disc ml-4 space-y-1">
                        <li>Currently using tenant: <strong>{tenant || 'developers (default)'}</strong></li>
                        <li>Valid state name for shipments: <strong>Colombo</strong></li>
                        <li>The test uses <strong>Nugegoda</strong> (city) in <strong>Colombo</strong> (state) as origin, and <strong>{selectedCityId ? cities.find(c => c.id === selectedCityId)?.name || 'Kandy' : 'Kandy'}</strong> (city) as destination.</li>
                        <li><strong>Rate Card Required:</strong> For successful shipment creation, the merchant account needs to have rate cards configured in the Royal Express merchant portal.</li>
                        <li><strong>Note:</strong> Authentication testing can proceed without rate cards, but shipment creation will fail without proper rate card setup.</li>
                    </ul>
                </div>

                {/* Tenant selector */}
                <div className="mb-4">
                    <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-2">
                        Tenant Name:
                    </label>
                    <div className="flex gap-2 flex-wrap mb-2">
                        <input
                            type="text"
                            id="tenant"
                            value={tenant}
                            onChange={(e) => setTenant(e.target.value)}
                            placeholder="Tenant name (e.g., developers)"
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {availableTenants.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTenant(t)}
                                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Current tenant: <strong>{tenant || 'developers (default)'}</strong>
                    </p>
                </div>

                {/* State selector */}
                <div className="mb-4">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State Selection:
                    </label>
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="stateSearch"
                                value={stateSearchTerm}
                                onChange={(e) => setStateSearchTerm(e.target.value)}
                                placeholder="Search for a state"
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 flex-grow"
                            />
                            <button
                                onClick={fetchStates}
                                disabled={statesLoading || !tenant}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {statesLoading ? 'Loading...' : 'Search'}
                            </button>
                        </div>

                        <select
                            id="state"
                            value={selectedStateId || ''}
                            onChange={handleStateChange}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full"
                            disabled={states.length === 0}
                        >
                            <option value="">Select a state</option>
                            {states.map((state) => (
                                <option key={state.id} value={state.id}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {statesLoading && (
                        <p className="text-xs text-blue-500">Loading states...</p>
                    )}
                    {states.length > 0 && (
                        <p className="text-xs text-gray-500">
                            Found {states.length} states. {selectedStateId ? `Selected state: ${states.find(s => s.id === selectedStateId)?.name || ''}` : 'No state selected'}
                        </p>
                    )}
                    {states.length === 0 && tenant && !statesLoading && (
                        <p className="text-xs text-gray-500">
                            No states found. Try selecting a valid tenant first or searching with different terms.
                        </p>
                    )}
                </div>

                {/* City selector */}
                <div className="mb-4">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City Selection:
                    </label>
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="citySearch"
                                value={citySearchTerm}
                                onChange={(e) => setCitySearchTerm(e.target.value)}
                                placeholder="Search for a city"
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 flex-grow"
                                disabled={!!selectedStateId} // Disable search when state is selected
                            />
                            <button
                                onClick={() => fetchCities(false)}
                                disabled={citiesLoading || !tenant || !!selectedStateId}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {citiesLoading ? 'Loading...' : 'Search'}
                            </button>
                        </div>

                        <select
                            id="city"
                            value={selectedCityId || ''}
                            onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : null)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full"
                            disabled={cities.length === 0}
                        >
                            <option value="">Select a city</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name} {city.state && !selectedStateId ? `(${city.state.name})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    {citiesLoading && (
                        <p className="text-xs text-blue-500">Loading cities...</p>
                    )}
                    {cities.length > 0 && (
                        <p className="text-xs text-gray-500">
                            Found {cities.length} cities{selectedStateId ? ` in ${states.find(s => s.id === selectedStateId)?.name || 'selected state'}` : ''}.
                            {selectedCityId ? ` Selected city: ${cities.find(c => c.id === selectedCityId)?.name || ''}` : ' No city selected'}
                        </p>
                    )}
                    {cities.length === 0 && tenant && !citiesLoading && (
                        <p className="text-xs text-gray-500">
                            No cities found. {selectedStateId ? 'Selected state has no cities.' : 'Try searching with different terms.'}
                        </p>
                    )}
                </div>

                {/* Test options */}
                <div className="mb-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={testShipment}
                            onChange={(e) => setTestShipment(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span>Test Shipment Creation</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        This will attempt to create a test shipment with the Curfox API
                    </p>
                </div>

                <button
                    onClick={runTest}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Run Test'}
                </button>
            </div>

            {error && (
                <div className="p-4 mb-4 border border-red-500 bg-red-100 text-red-700 rounded">
                    <h2 className="font-bold mb-2">Error</h2>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className={`p-4 mb-4 border rounded ${result.status === 'success' ? 'border-green-500 bg-green-100 text-green-700' : 'border-red-500 bg-red-100 text-red-700'}`}>
                    <h2 className="font-bold mb-2">Result</h2>
                    <p className="mb-4">{result.message}</p>

                    {result.data && (
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">User Information</h3>
                            <pre className="bg-slate-800 text-white p-4 rounded overflow-auto max-h-96">
                                {JSON.stringify(result.data, null, 2)}
                            </pre>
                        </div>
                    )}

                    {result.shipment && (
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Shipment Details</h3>
                            <pre className="bg-slate-800 text-white p-4 rounded overflow-auto max-h-96">
                                {JSON.stringify(result.shipment, null, 2)}
                            </pre>
                        </div>
                    )}

                    {result.shipmentError && (
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Shipment Creation Error</h3>
                            <div className="p-3 border border-yellow-400 bg-yellow-50 text-yellow-800 rounded">
                                <p className="mb-2">Note: Shipment creation failed, but this doesn't necessarily mean the integration is broken.</p>
                                <p>The most common reason is that your merchant account needs rate cards configured in the Royal Express merchant portal.</p>
                            </div>
                            <pre className="mt-2 bg-slate-800 text-white p-4 rounded overflow-auto max-h-96">
                                {result.shipmentError}
                            </pre>
                        </div>
                    )}

                    {result.error && (
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Error Details</h3>
                            <pre className="bg-slate-800 text-white p-4 rounded overflow-auto max-h-96">
                                {typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 