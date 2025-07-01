'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ReturnsPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders?orderNumber=${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      
      // Navigate to the return form with the order details
      router.push(`/returns/process?orderId=${orderId}`);
    } catch (error) {
      toast.error('Order not found. Please check the order number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Returns Management</h1>
      </div>
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Process New Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="orderId">Order ID</Label>
              <div className="flex gap-2">
                <Input
                  id="orderId"
                  placeholder="Enter order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}