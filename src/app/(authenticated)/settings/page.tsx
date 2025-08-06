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
        <SettingsForm tenant={tenant} />
    );
}