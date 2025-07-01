import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ReturnFormProps {
  onSubmit: (data: ReturnFormData) => void;
  initialData?: ReturnFormData;
  isLoading?: boolean;
}

interface ReturnFormData {
  orderNumber: string;
  reason: string;
  description: string;
}

export function ReturnForm({ onSubmit, initialData, isLoading }: ReturnFormProps) {
  const [formData, setFormData] = useState<ReturnFormData>(initialData || {
    orderNumber: "",
    reason: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Return" : "Create Return"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              value={formData.orderNumber}
              onChange={(e) =>
                setFormData({ ...formData, orderNumber: e.target.value })
              }
              placeholder="Enter order number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Return Reason</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter return reason"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter detailed description"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Implement cancel functionality
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}