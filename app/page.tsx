"use client";

import { ProductProvider } from "@/lib/hooks/use-products";
import { ProductList } from "@/components/ProductList";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useProducts } from "@/lib/hooks/use-products";
import { useState } from "react";
import { Product, ProductSuggestion } from "@/lib/types";
import { useSession, signOut } from "next-auth/react";
import { CartProvider, useCart } from '@/lib/hooks/useCart';
import { CopilotKit } from "@copilotkit/react-core";
import { CartModal } from "@/components/CartModal";
import { useCartActions } from "@/lib/actions/cartActions";
import { Providers } from "./providers";

function ProductManager() {
  const { products, addProduct, updateStock } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(products);
  const { data: session } = useSession();
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Fonction de recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  useCopilotReadable({
    description: "Liste des produits avec leurs détails (nom, prix, stock, catégorie)",
    value: { products: searchResults }
  });

  useCopilotAction({
    name: "rechercherProduits",
    description: "Rechercher des produits par nom, catégorie ou description",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Terme de recherche",
        required: true
      }
    ],
    handler: async (params) => {
      try {
        const results = products.filter(product => 
          product.name.toLowerCase().includes(params.query.toLowerCase()) ||
          product.category.toLowerCase().includes(params.query.toLowerCase()) ||
          product.description.toLowerCase().includes(params.query.toLowerCase())
        );
        return {
          success: true,
          message: `${results.length} produit(s) trouvé(s)`,
          data: results
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de la recherche."
        };
      }
    }
  });

  useCopilotAction({
    name: "ajouterProduit",
    description: "Ajouter un nouveau produit au catalogue",
    parameters: [
      {
        name: "name",
        type: "string",
        description: "Nom du produit",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Description du produit",
        required: true
      },
      {
        name: "price",
        type: "number",
        description: "Prix du produit en euros",
        required: true
      },
      {
        name: "category",
        type: "string",
        description: "Catégorie du produit",
        required: true
      },
      {
        name: "stock",
        type: "number",
        description: "Quantité en stock",
        required: true
      },
      {
        name: "features",
        type: "string[]",
        description: "Caractéristiques du produit",
        required: false
      }
    ],
    handler: async ({ name, description, price, category, stock, features }: {
      name: string;
      description: string;
      price: number;
      category: string;
      stock: number;
      features?: string[];
    }) => {
      try {
        addProduct({
          name,
          description,
          price,
          category,
          stock,
          features: features || [],
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          rating: 0,
          reviews: 0
        });
        return {
          success: true,
          message: `Produit ${name} ajouté avec succès!`
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de l'ajout du produit."
        };
      }
    }
  });

  useCopilotAction({
    name: "mettreAJourStock",
    description: "Mettre à jour le stock d'un produit",
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
        description: "Quantité à ajouter (positif) ou retirer (négatif)",
        required: true
      }
    ],
    handler: async (params) => {
      try {
        updateStock(params.productId, params.quantity);
        return {
          success: true,
          message: `Stock mis à jour avec succès!`
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de la mise à jour du stock."
        };
      }
    }
  });

  // Action pour analyser les avis clients
  useCopilotAction({
    name: "analyserAvisClients",
    description: "Analyser les avis clients pour un produit et fournir des insights",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "ID du produit à analyser",
        required: true
      }
    ],
    handler: async (params) => {
      try {
        const product = products.find(p => p.id === params.productId);
        if (!product || !product.customerReviews) {
          return {
            success: false,
            message: "Produit non trouvé ou aucun avis disponible"
          };
        }

        // Analyse des avis
        const averageRating = product.customerReviews.reduce((acc, review) => acc + review.rating, 0) / product.customerReviews.length;
        const positiveReviews = product.customerReviews.filter(review => review.rating >= 4);
        const negativeReviews = product.customerReviews.filter(review => review.rating <= 2);

        return {
          success: true,
          message: "Analyse des avis terminée",
          data: {
            productName: product.name,
            averageRating,
            totalReviews: product.customerReviews.length,
            positiveCount: positiveReviews.length,
            negativeCount: negativeReviews.length,
            topComments: product.customerReviews
              .sort((a, b) => b.helpful - a.helpful)
              .slice(0, 3)
          }
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de l'analyse des avis"
        };
      }
    }
  });

  // Action pour les recommandations intelligentes
  useCopilotAction({
    name: "recommanderProduits",
    description: "Recommander des produits similaires ou complémentaires",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "ID du produit de référence",
        required: true
      },
      {
        name: "type",
        type: "string",
        description: "Type de recommandation (similaire ou complementaire)",
        required: true
      }
    ],
    handler: async (params) => {
      try {
        const product = products.find(p => p.id === params.productId);
        if (!product) {
          return {
            success: false,
            message: "Produit non trouvé"
          };
        }

        // Logique de recommandation
        const recommendations = products
          .filter(p => p.id !== params.productId)
          .map(p => {
            let confidence = 0;
            let reason = "";

            if (params.type === "similaire") {
              // Produits similaires
              if (p.category === product.category) confidence += 0.4;
              if (Math.abs(p.price - product.price) < product.price * 0.2) confidence += 0.3;
              if (p.rating >= product.rating) confidence += 0.3;
              reason = "Produit similaire dans la même catégorie";
            } else {
              // Produits complémentaires
              if (p.category !== product.category) confidence += 0.3;
              if (p.rating >= 4) confidence += 0.3;
              reason = "Complément idéal pour votre produit";
            }

            return {
              productId: p.id,
              reason,
              confidence
            } as ProductSuggestion;
          })
          .filter(r => r.confidence > 0.5)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);

        return {
          success: true,
          message: `${recommendations.length} recommandations trouvées`,
          data: recommendations
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de la génération des recommandations"
        };
      }
    }
  });

  // Initialiser les actions du panier
  useCartActions();

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">
                ProductManager
              </span>
            </div>
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full bg-white/10 text-white placeholder-white/75 border border-white/20 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button 
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-white/75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="text-white hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Panier ({cart.items.length})
              </button>
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">
                    {session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <a
                  href="/auth/signin"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Connexion
                </a>
              )}
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Gestion de Produits
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Gérez votre catalogue de produits efficacement avec notre assistant intelligent. Ajoutez, modifiez et suivez vos produits en temps réel.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Résultats de recherche ({searchResults.length})
            </h2>
          </div>
        )}
        <ProductList products={searchResults} />
      </main>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <CopilotPopup
        instructions={`Tu es un assistant commercial intelligent qui aide les utilisateurs à trouver et commander des produits. 
        Tu peux ajouter des produits au panier en utilisant l'action addToCart avec l'ID du produit et la quantité souhaitée.
        
        Exemple : Pour ajouter 2 unités du produit avec l'ID "1", utilise :
        addToCart("1", 2)
        
        L'utilisateur actuel est : ${session?.user?.name || 'non connecté'}`}
        labels={{
          title: "Assistant Shopping",
          initial: "Bonjour ! Je peux vous aider à ajouter des produits au panier. Dites-moi quel produit vous souhaitez ajouter.",
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <CartProvider>
        <ProductProvider>
          <ProductManager />
        </ProductProvider>
      </CartProvider>
    </Providers>
  );
}
