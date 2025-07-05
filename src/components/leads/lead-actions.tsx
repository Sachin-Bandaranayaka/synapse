// src/components/leads/lead-actions.tsx

'use client';

import { useRouter } from 'next/navigation';
import { User } from 'next-auth';
import type { LeadWithDetails } from '@/app/(authenticated)/leads/page';
import Link from 'next/link';

export function LeadActions({ 
    lead, 
    user, 
    onAction 
}: { 
    lead: LeadWithDetails, 
    user: User, 
    onAction: () => void 
}) {
  const router = useRouter();

  // --- PERMISSION CHECKS ---
  const canEdit = user.role === 'ADMIN' || user.permissions?.includes('EDIT_LEADS');
  const canDelete = user.role === 'ADMIN' || user.permissions?.includes('DELETE_LEADS');

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/leads/${lead.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete lead');
        }
        onAction(); // Refresh the list of leads in the parent component
      } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred.');
      }
    }
  };

  // Only render actions if user has permission or lead is pending
  if (lead.status !== 'PENDING') {
      return null;
  }

  return (
    <div className="flex items-center space-x-3">
      {canEdit && (
        <Link 
          href={`/leads/${lead.id}`} 
          className="text-sm font-medium text-indigo-400 hover:text-indigo-200"
        >
            Edit
        </Link>
      )}

      {canDelete && (
        <button
          onClick={handleDelete}
          className="text-sm font-medium text-red-500 hover:text-red-400"
        >
          Delete
        </button>
      )}
    </div>
  );
}