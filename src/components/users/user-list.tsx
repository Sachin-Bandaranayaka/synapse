'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalLeads: number;
}

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Orders
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Leads
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Joined
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
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-white">{user.name || 'No name'}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRoleBadgeColor(user.role)}`}>
                  {user.role === 'TEAM_MEMBER' ? 'Team Member' : 'Admin'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                {user.totalOrders}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                {user.totalLeads}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                {format(new Date(user.createdAt), 'MMM d, yyyy')}
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
