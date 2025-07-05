// src/components/leads/lead-details-client.tsx

'use client';

import { useState } from 'react';
import { User } from 'next-auth';
import { Product } from '@prisma/client';
import { LeadDetails, type Lead as LeadDetailsType } from './lead-details';
import { LeadEditForm, type Lead } from './lead-edit-form';
import type { LeadWithRelations } from '@/app/(authenticated)/leads/[leadId]/page';
import { LeadData } from '@/types/leads';

interface LeadDetailsClientProps {
    initialLead: LeadWithRelations;
    products: Product[];
    user: User;
}

export function LeadDetailsClient({ initialLead, products, user }: LeadDetailsClientProps) {
    const [lead, setLead] = useState(initialLead);
    const [isEditing, setIsEditing] = useState(false);

    // --- PERMISSION CHECK ---
    const canEdit = user.role === 'ADMIN' || user.permissions?.includes('EDIT_LEADS');

    const handleSuccess = () => {
        setIsEditing(false);
        // We can optionally refresh data here if needed
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-white">
                        {isEditing ? 'Edit Lead' : 'Lead Details'}
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        {isEditing ? 'Update the lead information below.' : `Viewing lead for ${(lead.csvData as unknown as LeadData).name}`}
                    </p>
                </div>
                {/* --- PERMISSION-BASED UI --- */}
                {canEdit && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-indigo-700"
                    >
                        Edit Lead
                    </button>
                )}
            </div>

            <div className="rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10 p-6">
                {isEditing ? (
                    <LeadEditForm
                        lead={lead as unknown as Lead}
                        products={products}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    // Assuming LeadDetails is primarily for display. If it needs the user object, pass it down.
                    <LeadDetails lead={lead as unknown as LeadDetailsType} />
                )}
            </div>
        </div>
    );
}