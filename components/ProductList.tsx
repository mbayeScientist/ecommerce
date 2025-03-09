"use client";

import { useProducts } from "@/lib/hooks/use-products";
import { useCart } from "@/lib/hooks/useCart";
import Link from "next/link";
import { Product } from "@/lib/types";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { addItem } = useCart();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {product.name}
            </h3>
            <p className="text-gray-600 mt-1">{product.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xl font-bold text-gray-900">{product.price}€</p>
              <span className={`px-2 py-1 rounded text-sm ${
                product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stock} en stock
              </span>
            </div>
            <button
              onClick={() => addItem(product, 1)}
              disabled={product.stock === 0}
              className={`mt-4 w-full px-4 py-2 rounded-md ${
                product.stock > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 