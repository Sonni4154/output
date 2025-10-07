import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers with proper queryFn
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });

  // Fetch invoices with proper queryFn
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  // Fetch time entries with proper queryFn
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => api.getTimeEntries?.() || Promise.resolve({ data: [], success: true }),
  });

  // Filter customers based on search term
  const filteredCustomers = customers.data?.filter((customer: any) =>
    customer.displayname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading customers</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600">Manage your customer relationships</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Search</CardTitle>
          <CardDescription>Search and filter your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer: any) => (
            <Card key={customer.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {customer.displayname || 'Unnamed Customer'}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      {customer.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.billaddr?.line1 && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {customer.billaddr.line1}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {customer.balance || 0} Outstanding
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-slate-500">
                {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
