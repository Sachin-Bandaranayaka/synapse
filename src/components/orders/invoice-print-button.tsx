import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Printer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface InvoicePrintButtonProps {
    orderId: string;
    isPrinted: boolean;
}

export function InvoicePrintButton({ orderId, isPrinted }: InvoicePrintButtonProps) {
    const [loading, setLoading] = useState(false);
    const [printed, setPrinted] = useState(isPrinted);

    const handleTogglePrintStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/orders/${orderId}/invoice-print`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ printed: !printed }),
            });

            if (!response.ok) {
                throw new Error('Failed to update invoice print status');
            }

            setPrinted(!printed);
            toast.success(`Invoice marked as ${!printed ? 'printed' : 'not printed'}`);
        } catch (error) {
            console.error('Error updating invoice print status:', error);
            toast.error('Failed to update invoice print status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={printed ? "outline" : "default"}
            className={`${printed ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' : ''} flex items-center space-x-2`}
            onClick={handleTogglePrintStatus}
            disabled={loading}
        >
            {loading ? (
                <span className="animate-spin mr-1">
                    <RotateCcw className="h-4 w-4" />
                </span>
            ) : printed ? (
                <Check className="h-4 w-4 mr-1" />
            ) : (
                <Printer className="h-4 w-4 mr-1" />
            )}
            <span>{printed ? 'Invoice Printed' : 'Mark as Printed'}</span>
        </Button>
    );
} 