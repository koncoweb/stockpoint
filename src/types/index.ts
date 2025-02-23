export interface User {
  id: string;
  name: string;
  role: 'owner' | 'staff';
  email: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  capacity: number;
  manager: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseStock {
  warehouseName: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number; // Total stock across all warehouses
  category: string;
  sku: string;
  stocks: WarehouseStock[]; // Array of warehouse-specific stocks
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  date: string;
  cashierId: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  warehouseId?: string;
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out';
  productId: string;
  quantity: number;
  date: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
}

// New interfaces for stock transfer system
export type LocationType = 'warehouse' | 'store' | 'supplier';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  contactPerson?: string;
  contactNumber?: string;
}

export interface TransferItem {
  productId: string;
  quantity: number;
  currentStock: number; // Stock at source location
  notes?: string;
  condition: 'good' | 'damaged' | 'expired';
  batchNumber?: string;
  expiryDate?: string;
}

export type TransferType = 
  | 'warehouse-to-warehouse'
  | 'supplier-to-warehouse'
  | 'warehouse-to-store'
  | 'store-to-warehouse'
  | 'return-to-supplier';

export type TransferStatus =
  | 'draft'
  | 'pending'
  | 'awaiting-validation' // New status for owner validation
  | 'approved'
  | 'in-transit'
  | 'partially-received'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type TransferPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface StockTransfer {
  id: string;
  transferNumber: string; // Unique reference number (e.g., TRF-2024-0001)
  transferType: TransferType;
  sourceLocation: Location;
  destinationLocation: Location;
  items: TransferItem[];
  
  // Dates
  requestDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  
  // Personnel
  requestedBy: {
    userId: string;
    name: string;
    role: string;
  };
  // New validation fields
  validatedBy?: {
    userId: string;
    name: string;
    role: string;
    date: string;
    notes?: string;
  };
  approvedBy?: {
    userId: string;
    name: string;
    role: string;
    date: string;
  };
  receivedBy?: {
    userId: string;
    name: string;
    role: string;
    date: string;
  };
  
  // Status and tracking
  status: TransferStatus;
  priority: TransferPriority;
  
  // Documents and references
  documents?: {
    purchaseOrderNumber?: string;
    deliveryOrderNumber?: string;
    invoiceNumber?: string;
    attachments?: string[]; // URLs to attached documents
  };
  
  // Transportation
  shipping?: {
    carrier?: string;
    trackingNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverContact?: string;
  };
  
  // Additional information
  totalItems: number;
  totalQuantity: number;
  notes?: string;
  reason?: string;
  
  // Quality control
  qualityCheck?: {
    checkedBy?: string;
    checkDate?: string;
    passed: boolean;
    notes?: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Cost tracking (optional)
  costs?: {
    shippingCost?: number;
    handlingCost?: number;
    insuranceCost?: number;
    totalCost: number;
  };
  
  // Approval chain
  approvalChain?: {
    level: number;
    approverRole: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    notes?: string;
  }[];
}

// Helper interface for transfer history
export interface TransferHistory {
  transferId: string;
  date: string;
  status: TransferStatus;
  updatedBy: {
    userId: string;
    name: string;
    role: string;
  };
  notes?: string;
}

// Interface for transfer templates
export interface TransferTemplate {
  id: string;
  name: string;
  description?: string;
  transferType: TransferType;
  sourceLocation: Location;
  destinationLocation: Location;
  defaultItems?: {
    productId: string;
    defaultQuantity: number;
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
