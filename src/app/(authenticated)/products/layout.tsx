import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Products',
    description: 'Manage your product catalog and inventory'
};

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
} 