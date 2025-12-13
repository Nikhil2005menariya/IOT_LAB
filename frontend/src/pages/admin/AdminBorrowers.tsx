import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowersApi, sessionsApi } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  User,
  Package,
  Clock,
  Loader2,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface Borrower {
  _id: string;
  reg_no: string;
  name?: string;
  email?: string;
  department?: string;
  total_borrowed?: number;
  active_sessions?: number;
}

interface Session {
  _id: string;
  student_reg_no: string;
  items: Array<{
    item_id: string;
    sku: string;
    name: string;
    qty: number;
    returned_qty: number;
  }>;
  borrowed_at: string;
  createdAt?: string;

  status: 'active' | 'completed';
}

const AdminBorrowers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  const { data: borrowersData, isLoading } = useQuery({
    queryKey: ['borrowers'],
    queryFn: borrowersApi.getAll,
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['borrower-sessions', selectedBorrower?.reg_no],
    queryFn: () => sessionsApi.getByStudent(selectedBorrower!.reg_no),
    enabled: !!selectedBorrower,
  });

  const borrowers: Borrower[] = borrowersData?.data || [];
  const sessions: Session[] = sessionsData?.data || [];

  const filteredBorrowers = borrowers.filter(
    (borrower) =>
      borrower.reg_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      borrower.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      borrower.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Borrowers</h1>
          <p className="text-muted-foreground">View student borrowing history and active sessions</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{borrowers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Borrowers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {borrowers.filter((b) => (b.active_sessions || 0) > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Borrowers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {borrowers.reduce((sum, b) => sum + (b.total_borrowed || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Items Borrowed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by registration number, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Borrowers Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBorrowers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mb-4 opacity-50" />
                <p>No borrowers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Total Borrowed</TableHead>
                      <TableHead className="text-center">Active Sessions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBorrowers.map((borrower) => (
                      <TableRow key={borrower._id}>
                        <TableCell>
                          <span className="font-mono font-medium">{borrower.reg_no}</span>
                        </TableCell>
                        <TableCell>{borrower.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {borrower.email || '-'}
                        </TableCell>
                        <TableCell>{borrower.department || '-'}</TableCell>
                        <TableCell className="text-center">
                          {borrower.total_borrowed || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {(borrower.active_sessions || 0) > 0 ? (
                            <Badge variant="outline" className="border-warning text-warning">
                              {borrower.active_sessions} active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-success text-success">
                              None
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBorrower(borrower)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Borrower Details Dialog */}
        <Dialog open={!!selectedBorrower} onOpenChange={(open) => !open && setSelectedBorrower(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Borrower Details
              </DialogTitle>
              <DialogDescription>
                Viewing history for {selectedBorrower?.reg_no}
              </DialogDescription>
            </DialogHeader>

            {selectedBorrower && (
              <div className="space-y-6">
                {/* Borrower Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration No.</p>
                    <p className="font-mono font-medium">{selectedBorrower.reg_no}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedBorrower.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{selectedBorrower.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p>{selectedBorrower.department || '-'}</p>
                  </div>
                </div>

                {/* Sessions */}
                <div>
                  <h3 className="font-semibold mb-3">Borrow History</h3>
                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No borrow history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <Card key={session._id} className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(session.borrowed_at), 'PPp')}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  session.status === 'active'
                                    ? 'border-warning text-warning'
                                    : 'border-success text-success'
                                }
                              >
                                {session.status === 'active' ? (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </>
                                )}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                            {session.items.map((item) => {
                                const returnedQty =
                                  session.returned_items
                                    ?.filter(r => String(r.item_id) === String(item.item_id))
                                    .reduce((sum, r) => sum + (r.qty || 0), 0) || 0;

                                return (
                                  <div
                                    key={item.item_id}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span>{item.name}</span>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        ({item.sku})
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-medium">
                                        {returnedQty}/{item.qty}
                                      </span>
                                      <span className="text-muted-foreground ml-1">returned</span>
                                    </div>
                                  </div>
                                );
                              })}

                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminBorrowers;
