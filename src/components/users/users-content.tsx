'use client';

import { UserList } from './user-list';
import { AddUserButton } from './add-user-button';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'TEAM_MEMBER';
    createdAt: string;
    totalOrders: number;
    totalLeads: number;
}

interface UsersContentProps {
    users: User[];
}

export function UsersContent({ users }: UsersContentProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Users</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Manage users and their permissions in the system
                    </p>
                </div>
                <AddUserButton />
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden ring-1 ring-gray-700">
                <UserList users={users} />
            </div>
        </div>
    );
} 