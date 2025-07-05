import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AuthenticatedUI from "./authenticated-ui";
import { Tenant } from "@prisma/client";

// This function's props interface might need to be updated if you are passing
// the tenant to it from a higher-level layout. For now, this is a safe assumption.
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.tenantId) {
    return redirect('/auth/signin');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });
  
  if (!tenant || !tenant.isActive) {
    // This is a more robust way to handle redirects with errors
    const redirectUrl = new URL('/auth/signin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('error', 'Your account has been deactivated.');
    return redirect(redirectUrl.toString());
  }

  // --- FIX: Pass the corrected tenant type to AuthenticatedUI ---
  // This ensures type safety and that all expected fields are present.
  return <AuthenticatedUI tenant={tenant as Tenant}>{children}</AuthenticatedUI>;
}