import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { itemsApi, sessionsApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Package,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Item {
  _id: string;
  sku: string;
  name: string;
  description: string;
  location: string;
  total_quantity: number;
  available_quantity: number;
}

const BorrowItems: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const { items: cartItems, studentRegNo, setStudentRegNo, addToCart, removeFromCart, updateQuantity, clearCart, totalItems } = useCart();
  const { toast } = useToast();

  const { data: itemsData, isLoading, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getAll,
  });

  const items: Item[] = itemsData?.data || [];

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuantityChange = (itemId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));
  };

  const handleAddToCart = (item: Item) => {
    const qty = quantities[item._id] || 1;
    if (qty > item.available_quantity) {
      toast({
        title: 'Invalid quantity',
        description: `Only ${item.available_quantity} available`,
        variant: 'destructive',
      });
      return;
    }
    addToCart({
      item_id: item._id,
      sku: item.sku,
      name: item.name,
      qty,
      available_quantity: item.available_quantity,
    });
    setQuantities((prev) => ({ ...prev, [item._id]: 1 }));
    toast({
      title: 'Added to cart',
      description: `${qty}x ${item.name}`,
    });
  };

  const handleConfirmBorrow = async () => {
    if (!studentRegNo.trim()) {
      toast({
        title: 'Student ID required',
        description: 'Please enter the student registration number',
        variant: 'destructive',
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to the cart before borrowing',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await sessionsApi.borrow({
        student_reg_no: studentRegNo,
        items: cartItems.map((item) => ({
          item_id: item.item_id,
          sku: item.sku,
          name: item.name,
          qty: item.qty,
        })),
        createdBy: 'system',
      });

      toast({
        title: 'Borrow successful',
        description: `${totalItems} items borrowed for ${studentRegNo}`,
      });

      clearCart();
      setShowConfirm(false);
      setShowCart(false);
      refetch();
    } catch (err: any) {
      toast({
        title: 'Borrow failed',
        description: err.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailabilityStatus = (item: Item) => {
    const ratio = item.available_quantity / item.total_quantity;
    if (ratio === 0) return { label: 'Out of Stock', className: 'status-out bg-destructive/10' };
    if (ratio < 0.3) return { label: 'Low Stock', className: 'status-low bg-warning/10' };
    return { label: 'Available', className: 'status-available bg-success/10' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Borrow Items</h1>
            <p className="text-muted-foreground">Select components for student borrowing</p>
          </div>
          <Button onClick={() => setShowCart(true)} className="gap-2 relative">
            <ShoppingCart className="h-4 w-4" />
            View Cart
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary-foreground text-primary">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const status = getAvailabilityStatus(item);
              const currentQty = quantities[item._id] || 1;
              const isInCart = cartItems.some((c) => c.item_id === item._id);

              return (
                <Card key={item._id} className={cn("glass-card transition-all hover:border-primary/50", isInCart && "border-primary ring-1 ring-primary/20")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{item.sku}</CardDescription>
                      </div>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.available_quantity}</span>
                        <span className="text-muted-foreground">/ {item.total_quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                      </div>
                    </div>

                    {item.available_quantity > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item._id, currentQty - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={item.available_quantity}
                            value={currentQty}
                            onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item._id, currentQty + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToCart(item)}
                          disabled={currentQty > item.available_quantity}
                        >
                          {isInCart ? 'Update Cart' : 'Add to Cart'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cart Dialog */}
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Borrow Cart
              </DialogTitle>
              <DialogDescription>Review items before confirming the borrow</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentRegNo">Student Registration Number *</Label>
                <Input
                  id="studentRegNo"
                  placeholder="e.g., 21BCS001"
                  value={studentRegNo}
                  onChange={(e) => setStudentRegNo(e.target.value.toUpperCase())}
                />
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.item_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.item_id, item.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.item_id, item.qty + 1)}
                          disabled={item.qty >= item.available_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.item_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowCart(false)}>
                Continue Shopping
              </Button>
              <Button
                onClick={() => {
                  setShowCart(false);
                  setShowConfirm(true);
                }}
                disabled={cartItems.length === 0 || !studentRegNo.trim()}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Borrow ({totalItems} items)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Borrow</DialogTitle>
              <DialogDescription>
                Are you sure you want to borrow these items for student {studentRegNo}?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Items to borrow:</p>
              <ul className="text-sm space-y-1">
                {cartItems.map((item) => (
                  <li key={item.item_id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-mono">x{item.qty}</span>
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleConfirmBorrow} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Borrow'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BorrowItems;
