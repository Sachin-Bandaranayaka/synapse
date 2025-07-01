import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { importProductsFromExcel, importProductsFromCSV } from '@/lib/bulk-operations';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.name.split('.').pop()?.toLowerCase();

    let result;
    if (fileType === 'xlsx' || fileType === 'xls') {
      result = await importProductsFromExcel(buffer, session.user.tenantId);
    } else if (fileType === 'csv') {
      const content = buffer.toString('utf-8');
      result = await importProductsFromCSV(content, session.user.tenantId);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please use Excel (.xlsx) or CSV (.csv)' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
