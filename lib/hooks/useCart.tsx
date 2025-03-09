'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem, Cart } from '../types';
import { useSession } from 'next-auth/react';

interface CartContextType {
  cart: Cart;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || 'anonymous';

  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
    userId
  });

  const addItem = (product: Product, quantity: number) => {
    setCart(currentCart => {
      const existingItem = currentCart.items.find(item => item.product.id === product.id);
      
      let newItems;
      if (existingItem) {
        newItems = currentCart.items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...currentCart.items, { product, quantity }];
      }

      return {
        ...currentCart,
        items: newItems,
        total: calculateTotal(newItems)
      };
    });
  };

  const removeItem = (productId: string) => {
    setCart(currentCart => {
      const newItems = currentCart.items.filter(item => item.product.id !== productId);
      return {
        ...currentCart,
        items: newItems,
        total: calculateTotal(newItems)
      };
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(currentCart => {
      if (quantity <= 0) {
        const newItems = currentCart.items.filter(item => item.product.id !== productId);
        return {
          ...currentCart,
          items: newItems,
          total: calculateTotal(newItems)
        };
      }

      const newItems = currentCart.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );

      return {
        ...currentCart,
        items: newItems,
        total: calculateTotal(newItems)
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      total: 0,
      userId
    });
  };

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 