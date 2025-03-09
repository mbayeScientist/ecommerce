"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Product } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/hooks/useCart';
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import Image from "next/image";

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Produit non trouvé');

        setProduct(data);
      } catch (err) {
        console.error('Erreur lors du chargement du produit:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Produit non trouvé'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    router.push('/');
  };

  useCopilotAction({
    name: "genererFacture",
    description: "Générer une facture pour l'achat d'un produit",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "ID du produit",
        required: true
      },
      {
        name: "quantity",
        type: "number",
        description: "Quantité achetée",
        required: true
      }
    ],
    run: async (params) => {
      if (product && params.quantity > 0 && params.quantity <= product.stock) {
        // Implementation of generating a receipt
        return {
          success: true,
          message: "Facture générée avec succès"
        };
      }
      return {
        success: false,
        message: "Impossible de générer la facture"
      };
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 relative h-96 w-full md:w-96">
              <Image
                className="object-cover"
                src={imageError 
                  ? 'https://via.placeholder.com/400x600?text=Image+non+disponible'
                  : product.image_url}
                alt={product.name}
                fill
                onError={() => setImageError(true)}
              />
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                  <p className="mt-2 text-gray-600">{product.description}</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{product.price}€</p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900">Caractéristiques</h3>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-3">Quantité:</span>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(Number(e.target.value), product.stock))}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  </div>
                  <span className={`px-3 py-1 rounded ${
                    product.stock > 0 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock} en stock
                  </span>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 px-6 py-3 rounded-md text-white font-semibold ${
                      product.stock > 0
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Retour
                  </button>
                </div>
              </div>

              <div className="mt-8 border-t pt-8">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-xl">★</span>
                    <span className="ml-2 text-gray-900">{product.rating}</span>
                  </div>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-gray-500">{product.reviews} avis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CopilotPopup
        defaultOpen={true}
        instructions={`Je peux vous aider à :
        - Obtenir plus d'informations sur ce produit
        - Générer une facture (genererFacture)
        - Vérifier la disponibilité
        - Calculer le montant total pour différentes quantités`}
        labels={{
          title: "Assistant Produit",
          initial: "👋 Je peux vous aider avec ce produit. Que souhaitez-vous savoir ?",
        }}
      />
    </div>
  );
} 