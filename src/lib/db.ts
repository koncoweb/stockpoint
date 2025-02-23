import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  DocumentReference,
  Timestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { Product, Transaction, StockMovement, User, Warehouse, WarehouseStock, StockTransfer } from '../types';

// Collection References
const PRODUCTS = 'products';
const TRANSACTIONS = 'transactions';
const STOCK_MOVEMENTS = 'stockMovements';
const USERS = 'users';
const STOCK = 'stock';
const PROFILES = 'profiles';
const WAREHOUSES = 'warehouses';
const TRANSFERS = 'transfers';

// Product Operations
export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(firestore, PRODUCTS);
    const querySnapshot = await getDocs(productsRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        category: data.category || '',
        sku: data.sku || '',
        stocks: Array.isArray(data.stocks) ? data.stocks : []
      } as Product;
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

export const getProduct = async (id: string): Promise<Product> => {
  try {
    const productRef = doc(firestore, PRODUCTS, id);
    const docSnap = await getDoc(productRef);
    
    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      price: data.price,
      stock: data.stock,
      category: data.category,
      sku: data.sku,
      stocks: data.stocks || []
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<DocumentReference> => {
  try {
    const batch = writeBatch(firestore);

    // Calculate total stock from warehouse stocks
    const totalStock = (product.stocks || []).reduce((sum, stock) => sum + (stock.quantity || 0), 0);

    // Create the product document with sanitized data
    const productRef = doc(collection(firestore, PRODUCTS));
    const productData = {
      name: product.name || '',
      price: Number(product.price) || 0,
      stock: totalStock,
      category: product.category || '',
      sku: product.sku || '',
      stocks: (product.stocks || []).map(stock => ({
        warehouseName: stock.warehouseName || '',
        quantity: Number(stock.quantity) || 0
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(productRef, productData);

    // Create stock document
    const stockRef = doc(firestore, STOCK, productRef.id);
    batch.set(stockRef, {
      quantity: totalStock,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return productRef;
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error('Failed to add product');
  }
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  try {
    const batch = writeBatch(firestore);
    const productRef = doc(firestore, PRODUCTS, id);
    
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp()
    };

    // Calculate new total stock if stocks array is being updated
    if (data.stocks) {
      const totalStock = data.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      updateData.stock = totalStock;

      // Update stock document
      const stockRef = doc(firestore, STOCK, id);
      batch.update(stockRef, {
        quantity: totalStock,
        updatedAt: serverTimestamp()
      });
    }

    batch.update(productRef, updateData);
    await batch.commit();
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const batch = writeBatch(firestore);
    
    // Delete main product document
    batch.delete(doc(firestore, PRODUCTS, id));
    
    // Delete stock document
    batch.delete(doc(firestore, STOCK, id));
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }
};

// Transaction Operations
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(firestore, TRANSACTIONS), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<DocumentReference> => {
  try {
    return await addDoc(collection(firestore, TRANSACTIONS), {
      ...transaction,
      createdAt: serverTimestamp(),
      date: Timestamp.now()
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw new Error('Failed to add transaction');
  }
};

// Stock Movement Operations
export const getStockMovements = async (): Promise<StockMovement[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(firestore, STOCK_MOVEMENTS), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    throw new Error('Failed to fetch stock movements');
  }
};

// Stock Transfer Operations
export const getStockTransfers = async (): Promise<StockTransfer[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(firestore, TRANSFERS), orderBy('requestDate', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockTransfer));
  } catch (error) {
    console.error('Error fetching transfers:', error);
    throw new Error('Failed to fetch transfers');
  }
};

export const addStockTransfer = async (transfer: Omit<StockTransfer, 'id'>): Promise<DocumentReference> => {
  try {
    return await addDoc(collection(firestore, TRANSFERS), {
      ...transfer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding transfer:', error);
    throw new Error('Failed to add transfer');
  }
};

export const updateStockTransfer = async (id: string, data: Partial<StockTransfer>) => {
  try {
    const transferRef = doc(firestore, TRANSFERS, id);
    await updateDoc(transferRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
    throw new Error('Failed to update transfer');
  }
};

export const deleteStockTransfer = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, TRANSFERS, id));
  } catch (error) {
    console.error('Error deleting transfer:', error);
    throw new Error('Failed to delete transfer');
  }
};

// Warehouse Operations
export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, WAREHOUSES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw new Error('Failed to fetch warehouses');
  }
};

export const addWarehouse = async (warehouse: Omit<Warehouse, 'id'>): Promise<DocumentReference> => {
  try {
    return await addDoc(collection(firestore, WAREHOUSES), {
      ...warehouse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding warehouse:', error);
    throw new Error('Failed to add warehouse');
  }
};

export const updateWarehouse = async (id: string, data: Partial<Warehouse>) => {
  try {
    const warehouseRef = doc(firestore, WAREHOUSES, id);
    await updateDoc(warehouseRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw new Error('Failed to update warehouse');
  }
};

export const deleteWarehouse = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, WAREHOUSES, id));
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw new Error('Failed to delete warehouse');
  }
};

// User Profile Operations
export const getUserProfile = async (userId: string): Promise<User> => {
  try {
    const docSnap = await getDoc(doc(firestore, PROFILES, userId));
    if (!docSnap.exists()) {
      throw new Error('Profile not found');
    }
    return { id: docSnap.id, ...docSnap.data() } as User;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  try {
    await updateDoc(doc(firestore, PROFILES, userId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, PROFILES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Stock Management
export const subscribeToStock = (productId: string, callback: (stock: number) => void) => {
  const stockRef = doc(firestore, STOCK, productId);
  return onSnapshot(stockRef, (doc) => {
    callback(doc.data()?.quantity || 0);
  });
};

export const updateStock = async (productId: string, quantity: number) => {
  try {
    const batch = writeBatch(firestore);
    
    const stockRef = doc(firestore, STOCK, productId);
    batch.update(stockRef, {
      quantity,
      updatedAt: serverTimestamp()
    });

    const productRef = doc(firestore, PRODUCTS, productId);
    batch.update(productRef, {
      stock: quantity,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating stock:', error);
    throw new Error('Failed to update stock');
  }
};

// Query Helpers
export const getLowStockProducts = async (threshold: number = 10): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(firestore, PRODUCTS), where('stock', '<=', threshold))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw new Error('Failed to fetch low stock products');
  }
};

export const getTransactionsByDateRange = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(firestore, TRANSACTIONS),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    throw new Error('Failed to fetch transactions');
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(firestore, PRODUCTS), where('category', '==', category))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw new Error('Failed to fetch products');
  }
};
