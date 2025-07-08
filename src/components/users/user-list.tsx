'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalLeads: number;
}

// --- FIX: Update props to handle actions ---
interface UserListProps {
  users: User[];
  currentUserId: string;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function UserList({ users, currentUserId, onEdit, onDelete }: UserListProps) {
  const getRoleBadgeColor = (role: string) => {
    return role === 'ADMIN'
      ? 'bg-indigo-900/50 text-indigo-300 ring-indigo-900/50'
      : 'bg-green-900/50 text-green-300 ring-green-900/50';
  };

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Activity</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
            {/* --- FIX: Add Actions column --- */}
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {users.map((user, index) => (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="hover:bg-gray-700/50"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">{user.name || 'No name'}</div>
                <div className="text-sm text-gray-400">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRoleBadgeColor(user.role)}`}>
                  {user.role === 'TEAM_MEMBER' ? 'Team Member' : 'Admin'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                {user.totalOrders} orders, {user.totalLeads} leads
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                {format(new Date(user.createdAt), 'MMM d, yyyy')}
              </td>
              {/* --- FIX: Add Actions cell with buttons --- */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-4">
                  <button onClick={() => onEdit(user)} className="text-indigo-400 hover:text-indigo-300">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {/* Disable delete button for the current user to prevent self-deletion */}
                  <button 
                    onClick={() => onDelete(user.id)} 
                    disabled={user.id === currentUserId}
                    className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
