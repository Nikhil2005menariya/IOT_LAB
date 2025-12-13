import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionsApi } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, RotateCcw, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ReturnItems = () => {
  const [studentRegNo, setStudentRegNo] = useState('');
  const [searchedRegNo, setSearchedRegNo] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [returnQty, setReturnQty] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { toast } = useToast();

  // Fetch sessions
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sessions', searchedRegNo],
    queryFn: () => sessionsApi.getByStudent(searchedRegNo),
    enabled: !!searchedRegNo,
  });

  // IMPORTANT: backend returns { data: [...] }
  const sessions = Array.isArray(data?.data)
    ? data.data.filter(s => s.status === 'active' || s.status === 'partial')
    : [];

  // Return mutation
  const returnMutation = useMutation({
    mutationFn: ({ sessionId, items }) =>
      sessionsApi.returnItems(sessionId, items, 'system'),
    onSuccess: () => {
      toast({ title: 'Items returned successfully' });
      setSelectedSession(null);
      setReturnQty({});
      setConfirmOpen(false);
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Return failed',
        description: err?.response?.data?.error || 'Error',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (studentRegNo.trim()) {
      setSearchedRegNo(studentRegNo.trim());
    }
  };

  const handleOpenSession = (session) => {
    setSelectedSession(session);
    const init = {};
    session.items.forEach(it => {
      init[it.item_id] = it.qty;
    });
    setReturnQty(init);
  };

  const changeQty = (itemId, delta, max) => {
    setReturnQty(prev => ({
      ...prev,
      [itemId]: Math.min(Math.max(0, (prev[itemId] || 0) + delta), max),
    }));
  };

  const confirmReturn = () => {
    const items = Object.entries(returnQty)
      .filter(([, q]) => q > 0)
      .map(([item_id, qty]) => ({ item_id, qty }));

    if (items.length === 0) {
      toast({ title: 'No items selected', variant: 'destructive' });
      return;
    }

    returnMutation.mutate({
      sessionId: selectedSession._id,
      items,
    });
  };

  const total = Object.values(returnQty).reduce((a, b) => a + b, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Return Items</h1>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Student Reg No"
                value={studentRegNo}
                onChange={(e) => setStudentRegNo(e.target.value)}
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sessions */}
        {searchedRegNo && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p>No active or partial sessions found</p>
            ) : (
              sessions.map(session => (
                <Card key={session._id}>
                  <CardHeader>
                    <CardTitle>
                      Borrowed at {format(new Date(session.borrowed_at), 'PPp')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.items.map(it => (
                      <div key={it.item_id} className="flex justify-between text-sm">
                        <span>{it.name}</span>
                        <span>{it.qty} held</span>
                      </div>
                    ))}
                    <Button onClick={() => handleOpenSession(session)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Process Return
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}

        {/* Return Dialog */}
        <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Items</DialogTitle>
            </DialogHeader>

            {selectedSession?.items.map(it => (
              <div key={it.item_id} className="flex justify-between items-center py-2">
                <span>{it.name}</span>
                <div className="flex items-center gap-2">
                  <Button size="icon" onClick={() => changeQty(it.item_id, -1, it.qty)}>
                    <Minus size={14} />
                  </Button>
                  <span>{returnQty[it.item_id] || 0}</span>
                  <Button size="icon" onClick={() => changeQty(it.item_id, 1, it.qty)}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            ))}

            <DialogFooter className="flex justify-between">
              <span>Total: {total}</span>
              <Button disabled={total === 0} onClick={() => setConfirmOpen(true)}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Return</DialogTitle>
            </DialogHeader>
            <p>Return {total} items?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmReturn} disabled={returnMutation.isPending}>
                {returnMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ReturnItems;
