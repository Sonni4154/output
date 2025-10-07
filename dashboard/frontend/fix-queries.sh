#!/bin/bash

# Function to add queryFn to useQuery calls
fix_usequery() {
    local file="$1"
    local query_key="$2"
    local query_fn="$3"
    
    # Add queryFn after queryKey
    sed -i "s|queryKey: \[$query_key\],|queryKey: \[$query_key\],\n    queryFn: () => $query_fn,|g" "$file"
}

# Fix the most critical files
fix_usequery "src/components/layout/role-based-navigation.tsx" '"/api/quickbooks/auth-status"' "api.getTokenStatus()"
fix_usequery "src/components/layout/role-based-navigation.tsx" '"/api/health"' 'fetch("http://localhost:5000/health").then(res => res.json())'

fix_usequery "src/pages/invoices.tsx" '"/api/invoices"' "api.getInvoices()"
fix_usequery "src/pages/invoices.tsx" '"/api/customers"' "api.getCustomers()"
fix_usequery "src/pages/invoices.tsx" '"/api/products"' "api.getItems()"

fix_usequery "src/components/modals/create-invoice-modal.tsx" "'/api/customers'" "api.getCustomers()"

echo "Fixed useQuery issues in critical files"
