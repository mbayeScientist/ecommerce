import { useCopilotAction } from "@copilotkit/react-core";
import { useCart } from "../hooks/useCart";
import { Product } from "../types";
import { supabase } from "../supabase";
import { useProducts } from "../hooks/use-products";

export function useCartActions() {
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const { products } = useProducts();

  useCopilotAction({
    name: "searchProducts",
    description: "Rechercher des produits par nom, catégorie ou description",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Le terme de recherche",
        required: true,
      }
    ],
    async handler({ query }) {
      try {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(5);

        return products || [];
      } catch (err) {
        console.error('Erreur lors de la recherche:', err);
        return [];
      }
    },
  });

  useCopilotAction({
    name: "listProducts",
    description: "Lister tous les produits disponibles",
    parameters: [],
    run: async () => {
      try {
        return {
          success: true,
          message: "Liste des produits",
          data: products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock
          }))
        };
      } catch (err) {
        console.error("Erreur lors de la récupération des produits:", err);
        return {
          success: false,
          message: "Erreur lors de la récupération des produits"
        };
      }
    }
  });

  useCopilotAction({
    name: "addToCart",
    description: "Ajouter un produit au panier",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "ID du produit à ajouter",
        required: true
      },
      {
        name: "quantity",
        type: "number",
        description: "Quantité à ajouter",
        required: true
      }
    ],
    run: async ({ productId, quantity }) => {
      try {
        const product = products.find(p => p.id === productId);
        if (!product) {
          return {
            success: false,
            message: "Produit non trouvé"
          };
        }

        addItem(product, quantity);
        return {
          success: true,
          message: `${quantity} ${product.name} ajouté(s) au panier`
        };
      } catch (err) {
        console.error("Erreur lors de l'ajout au panier:", err);
        return {
          success: false,
          message: "Erreur lors de l'ajout au panier"
        };
      }
    }
  });

  useCopilotAction({
    name: "updateCartItem",
    description: "Modifier la quantité d'un produit dans le panier",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "ID du produit à modifier",
        required: true
      },
      {
        name: "quantity",
        type: "number",
        description: "Nouvelle quantité",
        required: true
      }
    ],
    run: async ({ productId, quantity }) => {
      try {
        updateQuantity(productId, quantity);
        return {
          success: true,
          message: "Quantité mise à jour"
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de la mise à jour de la quantité"
        };
      }
    }
  });

  useCopilotAction({
    name: "removeFromCart",
    description: "Retirer un produit du panier",
    parameters: [
      {
        name: "productId",
        type: "string",
        description: "ID du produit à retirer",
        required: true
      }
    ],
    run: async ({ productId }) => {
      try {
        removeItem(productId);
        return {
          success: true,
          message: "Produit retiré du panier"
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors du retrait du produit"
        };
      }
    }
  });

  useCopilotAction({
    name: "getCart",
    description: "Obtenir le contenu du panier",
    parameters: [],
    run: async () => {
      try {
        if (cart.items.length === 0) {
          return {
            success: true,
            message: "Le panier est vide",
            data: { items: [], total: 0 }
          };
        }

        return {
          success: true,
          message: `Panier (${cart.items.length} articles)`,
          data: {
            items: cart.items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              total: item.quantity * item.product.price
            })),
            total: cart.total
          }
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors de la récupération du panier"
        };
      }
    }
  });

  useCopilotAction({
    name: "clearCart",
    description: "Vider le panier",
    parameters: [],
    run: async () => {
      try {
        clearCart();
        return {
          success: true,
          message: "Panier vidé"
        };
      } catch (error) {
        return {
          success: false,
          message: "Erreur lors du vidage du panier"
        };
      }
    }
  });
} 