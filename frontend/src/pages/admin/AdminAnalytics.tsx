import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const { toast } = useToast();

  const { data: topBorrowedData, isLoading: loadingTop } = useQuery({
    queryKey: ['analytics', 'top-borrowed', days],
    queryFn: () => analyticsApi.getTopBorrowed(days, 10),
  });

  const { data: lowStockData, isLoading: loadingLow } = useQuery({
    queryKey: ['analytics', 'low-stock'],
    queryFn: () => analyticsApi.getLowStock(5),
  });

  const { data: usageData, isLoading: loadingUsage } = useQuery({
    queryKey: ['analytics', 'usage', days],
    queryFn: () => analyticsApi.getUsageOverTime(days),
  });

  const {
    data: aiSummaryData,
    isLoading: loadingAI,
    refetch: refetchAI,
    isFetching: fetchingAI,
  } = useQuery({
    queryKey: ['analytics', 'ai-summary', days],
    queryFn: () => analyticsApi.getGeminiSummary(days, 5, 5),
    enabled: false,
  });

  const handleGenerateAISummary = () => {
    refetchAI();
    toast({
      title: 'Generating AI Summary',
      description: 'Analyzing inventory data...',
    });
  };

  const topBorrowed = topBorrowedData?.data || [];
  const lowStock = lowStockData?.data || [];
  const usage = usageData?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Inventory insights and usage trends</p>
          </div>
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI Summary Card */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Inventory Analysis</CardTitle>
                  <CardDescription>Powered by Gemini</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleGenerateAISummary}
                disabled={fetchingAI}
                className="gap-2"
              >
                {fetchingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Generate Summary
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAI || fetchingAI ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : aiSummaryData?.llm_response ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                  {aiSummaryData.llm_response}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Click "Generate Summary" to get AI-powered insights</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Usage Over Time Chart */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Borrowing Activity</CardTitle>
              </div>
              <CardDescription>Daily borrow transactions over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : usage.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No usage data available
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usage}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Borrowed Items */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>Top Borrowed Items</CardTitle>
              </div>
              <CardDescription>Most frequently borrowed components</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTop ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : topBorrowed.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  No data available
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topBorrowed.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle>Low Stock Alert</CardTitle>
              </div>
              <CardDescription>Items that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLow ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : lowStock.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>All items are well stocked!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lowStock.map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-warning text-warning">
                          {item.available_quantity} left
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAnalytics;
