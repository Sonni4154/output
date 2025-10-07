import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, DollarSign, Calendar, User, Package, Edit, Trash2, Send } from "lucide-react";
import { CustomerAutocompleteInput } from "@/components/ui/customer-autocomplete";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Invoice form schema
const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  items: z.array(z.object({
    description: z.string().min(1, "Item description is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
    total: z.coerce.number()
  })).min(1, "At least one item is required"),
  subtotal: z.coerce.number(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxAmount: z.coerce.number(),
  totalAmount: z.coerce.number()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "by-customer" | "by-product">("all");

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: "draft",
      taxRate: 0,
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
    }
  });

  // Queries with proper data extraction
  const { data: invoicesResponse = { data: [] }, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: () => api.getInvoices(),
  });
  const invoices = invoicesResponse?.data || [];

  const { data: customersResponse = { data: [] } } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => api.getCustomers(),
  });
  const customers = customersResponse?.data || [];

  const { data: productsResponse = { data: [] } } = useQuery({
    queryKey: ["/api/products"],
    queryFn: () => api.getItems(),
  });
  const products = productsResponse?.data || [];

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesCustomer = selectedCustomer === "all" || invoice.customerId === selectedCustomer;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-600">Manage your invoices and billing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Fill in the details to create a new invoice</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <p className="text-center text-slate-500">Invoice creation form will be implemented here</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Search & Filters</CardTitle>
          <CardDescription>Search and filter your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice: any) => (
            <Card key={invoice.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Invoice #{invoice.invoiceNumber || invoice.id}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${invoice.totalAmount || 0}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM dd, yyyy') : 'No date'}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {invoice.customer?.name || 'Unknown Customer'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status || 'draft'}
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
                {searchQuery ? 'No invoices found matching your search.' : 'No invoices found.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
