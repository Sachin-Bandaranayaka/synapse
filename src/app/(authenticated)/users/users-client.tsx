'use client';

import { useState } from 'react';
import { UserList } from '@/components/users/user-list';
import { AddUserButton } from '@/components/users/add-user-button';
import { UserForm } from '@/components/users/user-form'; // Import the new form
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'TEAM_MEMBER' | 'SUPER_ADMIN';
    createdAt: string;
    totalOrders: number;
    totalLeads: number;
    permissions: string[];
}

export function UsersClient({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
    
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleUserChange = async () => {
        // This function refreshes the user list from the API
        const response = await fetch('/api/users');
        if (response.ok) {
            const data = await response.json();
            // Ensure data is an array before setting
            if(Array.isArray(data)) {
                setUsers(data);
            }
        }
    };

    const openFormForEdit = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const openFormForCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user.');
            }
            
            toast.success('User deleted successfully.');
            await handleUserChange(); // Refresh the list
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred.');
        }
    };
    
    

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Users</h1>
                    <p className="mt-2 text-sm text-gray-400">Manage users and their permissions.</p>
                </div>
                {/* Update the AddUserButton to open the form */}
                <AddUserButton onAddUser={openFormForCreate} />
            </div>

            <div className="bg-gray-800 rounded-lg ring-1 ring-white/10 overflow-hidden">
                <UserList 
                    users={users} 
                    currentUserId={currentUserId}
                    onEdit={openFormForEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal for Creating/Editing Users */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg ring-1 ring-white/10">
                        <UserForm
                            user={editingUser}
                            onSuccess={() => {
                                setIsFormOpen(false);
                                handleUserChange();
                            }}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
