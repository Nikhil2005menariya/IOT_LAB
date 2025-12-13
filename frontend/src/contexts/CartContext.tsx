import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  item_id: string;
  sku: string;
  name: string;
  qty: number;
  available_quantity: number;
}

interface CartContextType {
  items: CartItem[];
  studentRegNo: string;
  setStudentRegNo: (regNo: string) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [studentRegNo, setStudentRegNo] = useState('');

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_id === item.item_id);
      if (existing) {
        return prev.map((i) =>
          i.item_id === item.item_id
            ? { ...i, qty: Math.min(i.qty + item.qty, i.available_quantity) }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.item_id === itemId
          ? { ...i, qty: Math.min(qty, i.available_quantity) }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setStudentRegNo('');
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        studentRegNo,
        setStudentRegNo,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
