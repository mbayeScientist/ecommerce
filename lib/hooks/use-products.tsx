'use client';

import { useState } from 'react';
import { Product } from '../types';

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Laptop Pro X',
    description: 'Ordinateur portable haute performance pour les professionnels',
    price: 1299.99,
    category: 'Informatique',
    stock: 10,
    features: ['16GB RAM', 'SSD 512GB', 'Intel i7'],
    rating: 4.5,
    reviews: 128,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80'
  },
  {
    id: '2',
    name: 'Smartphone Galaxy',
    description: 'Smartphone dernière génération avec appareil photo professionnel',
    price: 899.99,
    category: 'Téléphonie',
    stock: 15,
    features: ['6.7" AMOLED', '256GB', '5G'],
    rating: 4.8,
    reviews: 256,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80'
  },
  {
    id: '3',
    name: 'Casque Audio Pro',
    description: 'Casque sans fil avec réduction de bruit active',
    price: 249.99,
    category: 'Audio',
    stock: 8,
    features: ['Bluetooth 5.0', 'Autonomie 30h', 'ANC'],
    rating: 4.6,
    reviews: 89,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
  },
  {
    id: '4',
    name: 'Montre Connectée Sport',
    description: 'Montre intelligente pour le sport et la santé',
    price: 199.99,
    category: 'Accessoires',
    stock: 20,
    features: ['GPS', 'Cardio', 'Étanche'],
    rating: 4.4,
    reviews: 167,
    image_url: 'https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=500&q=80'
  },
  {
    id: '5',
    name: 'Tablette Pro 12',
    description: 'Tablette professionnelle avec stylet inclus',
    price: 799.99,
    category: 'Informatique',
    stock: 8,
    features: ['12.9 pouces', '256GB', 'Stylet Pro', 'iPadOS'],
    rating: 4.7,
    reviews: 92,
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80'
  },
  {
    id: '6',
    name: 'Enceinte Bluetooth Premium',
    description: 'Enceinte portable waterproof avec son 360°',
    price: 179.99,
    category: 'Audio',
    stock: 30,
    features: ['Bluetooth 5.2', '20h autonomie', 'IPX7', 'Son surround'],
    rating: 4.4,
    reviews: 73,
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80'
  }
];

export function useProducts() {
  const [products] = useState<Product[]>(initialProducts);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: Math.random().toString(36).substr(2, 9)
    };
    products.push(newProduct as Product);
  };

  const updateStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      product.stock += quantity;
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateStock
  };
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 