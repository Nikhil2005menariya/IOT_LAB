import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Edit,
  Package,
  MapPin,
  Loader2,
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

const AdminInventory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  
  // Add item form
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    description: '',
    location: '',
    total_quantity: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getAll,
  });

  const items: Item[] = itemsData?.data || [];

  const addMutation = useMutation({
    mutationFn: itemsApi.addItem,
    onSuccess: () => {
      toast({ title: 'Item added successfully' });
      setShowAddDialog(false);
      setNewItem({ name: '', sku: '', description: '', location: '', total_quantity: 0 });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to add item',
        description: err.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, change }: { id: string; change: number }) =>
      itemsApi.updateQuantity(id, change),
    onSuccess: () => {
      toast({ title: 'Quantity updated successfully' });
      setShowEditDialog(false);
      setSelectedItem(null);
      setNewQuantity(0);
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to update quantity',
        description: err.response?.data?.error || 'An error occurred',
        variant: 'destructive',
      });
    },
  });
const filteredItems = items.filter((item) => {
  const q = searchQuery.toLowerCase();

  return (
    item.name?.toLowerCase().includes(q) ||
    item.sku?.toLowerCase().includes(q) ||
    item.location?.toLowerCase().includes(q)
  );
});


  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      toast({
        title: 'Missing required fields',
        description: 'Name and SKU are required',
        variant: 'destructive',
      });
      return;
    }
    addMutation.mutate(newItem);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setNewQuantity(0); // This now represents the change amount
    setShowEditDialog(true);
  };

  const handleUpdateQuantity = () => {
    if (!selectedItem || newQuantity === 0) return;
    updateMutation.mutate({ id: selectedItem._id, change: newQuantity });
  };

  const getStockStatus = (item: Item) => {
    const ratio = item.available_quantity / item.total_quantity;
    if (ratio === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (ratio < 0.3) return { label: 'Low Stock', variant: 'outline' as const, className: 'border-warning text-warning' };
    return { label: 'In Stock', variant: 'outline' as const, className: 'border-success text-success' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Manage lab components and stock levels</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {items.filter((i) => i.available_quantity / i.total_quantity < 0.3 && i.available_quantity > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Package className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {items.filter((i) => i.available_quantity === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Items Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <TableRow key={item._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{item.sku}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {item.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{item.available_quantity}</span>
                            <span className="text-muted-foreground"> / {item.total_quantity}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Add a new component to the inventory</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ESP32 Board"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={newItem.sku}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    placeholder="e.g., ESP32"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the item"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newItem.location}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Shelf A1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Initial Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    value={newItem.total_quantity}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, total_quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Item'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Quantity Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                Add or remove stock for {selectedItem?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Total:</span>
                  <span className="font-medium">{selectedItem?.total_quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">{selectedItem?.available_quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Borrowed:</span>
                  <span className="font-medium">
                    {(selectedItem?.total_quantity || 0) - (selectedItem?.available_quantity || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newQuantity">Stock Change (positive to add, negative to remove)</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 5 or -3"
                />
                {newQuantity !== 0 && (
                  <p className="text-sm text-muted-foreground">
                    New total will be: <span className="font-medium">{(selectedItem?.total_quantity || 0) + newQuantity}</span>
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateQuantity} disabled={updateMutation.isPending || newQuantity === 0}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  newQuantity > 0 ? `Add ${newQuantity}` : newQuantity < 0 ? `Remove ${Math.abs(newQuantity)}` : 'Update'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminInventory;
