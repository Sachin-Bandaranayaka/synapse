import { RoyalExpressStateChecker } from '@/components/shipping/state-checker';

export const metadata = {
    title: 'Debug Royal Express States | JNEX',
    description: 'Debug tool for checking valid Royal Express state names',
};

export default function DebugRoyalExpressStatesPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6 text-center">Debug Royal Express States</h1>
            <p className="mb-6 text-center text-gray-600">
                Use this tool to check which state names are valid for Royal Express shipping.
            </p>

            <div className="max-w-xl mx-auto">
                <RoyalExpressStateChecker />
            </div>

            <div className="mt-8 text-sm text-gray-500 max-w-xl mx-auto">
                <h2 className="font-semibold mb-2">Troubleshooting Common Issues:</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>If you get an "Invalid state name" error, make sure you're using a state name from this list.</li>
                    <li>The state name must match exactly, including capitalization.</li>
                    <li>If the API returns no states, check your Royal Express API credentials.</li>
                    <li>Contact Royal Express support if you need to add specific state names to your account.</li>
                </ul>
            </div>
        </div>
    );
} 