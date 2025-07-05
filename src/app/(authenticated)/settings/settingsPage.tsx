// src/app/(authenticated)/settings/page.tsx

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function TenantSettingsPage() {
    const session = await getSession();
    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    // Only Admins can access the settings page
    if (session.user.role !== 'ADMIN') {
        return redirect('/unauthorized');
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
    });

    if (!tenant) {
        return notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-sm text-gray-600">Manage your business profile and integration settings.</p>
            </div>
            <div className="bg-gray-800 p-6 sm:p-8 rounded-lg ring-1 ring-white/10">
                <SettingsForm tenant={tenant} />
            </div>
        </div>
    );
}