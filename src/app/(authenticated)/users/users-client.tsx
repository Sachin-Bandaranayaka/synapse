// src/app/(authenticated)/users/users-client.tsx

'use client';

import { useState } from 'react';
import { UserList } from '@/components/users/user-list';
import { AddUserButton } from '@/components/users/add-user-button';

// This is the user type we receive from the server
interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'TEAM_MEMBER' | 'SUPER_ADMIN'; // Added SUPER_ADMIN
    createdAt: string;
    totalOrders: number;
    totalLeads: number;
}

// The component now accepts the initial user list as a prop
export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);

    // This function can be used to refresh the list after a user is added/edited
    const handleUserChange = async () => {
        // Note: The '/api/users' route this calls is not yet secure. We will fix it next.
        const response = await fetch('/api/users');
        if (response.ok) {
            const data = await response.json();
            setUsers(data);
        }
    };

    return (
        <div className="space-y-6 bg-gray-900">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Users</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Manage users and their permissions in the system.
                    </p>
                </div>
                <AddUserButton onUserAdded={handleUserChange} />
            </div>

            <div className="bg-gray-800 rounded-lg ring-1 ring-white/10 overflow-hidden">
                <UserList users={users} />
            </div>
        </div>
    );
}
