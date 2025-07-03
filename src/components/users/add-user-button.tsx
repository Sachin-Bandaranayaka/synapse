'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';

interface AddUserButtonProps {
    onUserAdded?: () => void;
}

const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'TEAM_MEMBER']),
    permissions: z.array(z.string()),
});

type UserFormData = z.infer<typeof userSchema>;

const PERMISSIONS = {
    DASHBOARD: {
        label: 'Dashboard',
        options: [
            { id: 'VIEW_DASHBOARD', label: 'View Dashboard' },
        ],
    },
    INVENTORY: {
        label: 'Inventory Management',
        options: [
            { id: 'VIEW_PRODUCTS', label: 'View Products' },
            { id: 'EDIT_PRODUCTS', label: 'Edit Products' },
            { id: 'EDIT_STOCK', label: 'Edit Stock Levels' },
            { id: 'DELETE_PRODUCTS', label: 'Delete Products' },
        ],
    },
    LEADS: {
        label: 'Lead Management',
        options: [
            { id: 'VIEW_LEADS', label: 'View Leads' },
            { id: 'CREATE_LEADS', label: 'Create Leads' },
            { id: 'EDIT_LEADS', label: 'Edit Leads' },
            { id: 'DELETE_LEADS', label: 'Delete Leads' },
        ],
    },
    ORDERS: {
        label: 'Order Management',
        options: [
            { id: 'VIEW_ORDERS', label: 'View Orders' },
            { id: 'CREATE_ORDERS', label: 'Create Orders' },
            { id: 'EDIT_ORDERS', label: 'Edit Orders' },
            { id: 'DELETE_ORDERS', label: 'Delete Orders' },
        ],
    },
    SHIPPING: {
        label: 'Shipping Management',
        options: [
            { id: 'VIEW_SHIPPING', label: 'View Shipping' },
            { id: 'UPDATE_SHIPPING', label: 'Update Shipping Status' },
        ],
    },
    REPORTS: {
        label: 'Reports',
        options: [
            { id: 'VIEW_REPORTS', label: 'View Reports' },
            { id: 'EXPORT_REPORTS', label: 'Export Reports' },
        ],
    },
};

export function AddUserButton({ onUserAdded }: AddUserButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        role: 'TEAM_MEMBER',
        permissions: [],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Validate form data
            const validatedData = userSchema.parse(formData);

            // Send request to create user
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(validatedData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create user');
            }

            // Close modal and reset form
            setShowModal(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'TEAM_MEMBER',
                permissions: [],
            });

            // Call the callback if provided
            onUserAdded?.();
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePermissionChange = (permissionId: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(p => p !== permissionId)
                : [...prev.permissions, permissionId],
        }));
    };

    const handleRoleChange = (role: 'ADMIN' | 'TEAM_MEMBER') => {
        setFormData(prev => ({
            ...prev,
            role,
            // If admin, grant all permissions, otherwise keep existing
            permissions: role === 'ADMIN'
                ? Object.values(PERMISSIONS).flatMap(group => group.options.map(opt => opt.id))
                : prev.permissions,
        }));
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                Add User
            </motion.button>

            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-gray-900/75 transition-opacity"
                            onClick={() => setShowModal(false)}
                        ></div>

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Add New User</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-100"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-md bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-400">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-400">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => handleRoleChange(e.target.value as 'ADMIN' | 'TEAM_MEMBER')}
                                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option key="team-member" value="TEAM_MEMBER">Team Member</option>
                                        <option key="admin" value="ADMIN">Admin</option>
                                    </select>
                                </div>

                                {formData.role === 'TEAM_MEMBER' && (
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-gray-400">
                                            Permissions
                                        </label>
                                        {Object.entries(PERMISSIONS).map(([key, group]) => (
                                            <div key={key} className="space-y-2">
                                                <h3 className="text-sm font-medium text-gray-400">{group.label}</h3>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {group.options.map((permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex items-center space-x-2 text-sm text-gray-100"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(permission.id)}
                                                                onChange={() => handlePermissionChange(permission.id)}
                                                                className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span>{permission.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            )}
        </>
    );
} 