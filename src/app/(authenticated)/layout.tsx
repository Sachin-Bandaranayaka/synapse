// src/app/(authenticated)/layout.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AuthenticatedUI from "./authenticated-ui"; // Import our new client UI component

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.tenantId) {
    return redirect('/auth/signin');
  }

  // Fetch the full tenant details, including our new customization fields
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });
  
  // This real-time check remains for security
  if (!tenant || !tenant.isActive) {
    const redirectUrl = new URL('/auth/signin', 'http://localhost:3000'); // Base URL needed
    redirectUrl.searchParams.set('error', 'Your account has been deactivated.');
    return redirect(redirectUrl.toString());
  }

  // If the check passes, render the UI, passing the tenant data and children
  return <AuthenticatedUI tenant={tenant}>{children}</AuthenticatedUI>;
}