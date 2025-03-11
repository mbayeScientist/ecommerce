import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  LangChainAdapter
} from '@copilotkit/runtime';
import { ChatMistralAI } from '@langchain/mistralai';
import { NextRequest } from 'next/server';
import { BaseMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { supabase } from '@/lib/supabase';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Configuration
const AUTHORIZED_EMAIL = 'alioumbayang99@gmail.com';
const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY,
  modelName: "mistral-tiny",
  temperature: 0
});
const embeddings = new MistralAIEmbeddings({
  apiKey: process.env.MISTRAL_API_KEY
});

// Types
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  features: string[];
  image_url: string;
  rating: number;
}

interface CartItem {
  user_id: string;
  product_id: number;
  quantity: number;
  products?: Product;
}

interface ProductRecommendation {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
}

// Auth utilities
async function validateUser(): Promise<string> {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.user.id || session.data.session.user.email !== AUTHORIZED_EMAIL) {
    throw new Error("Utilisateur non autorisé");
  }
  return session.data.session.user.id;
}

// Product utilities
async function getProducts(): Promise<Product[]> {
  const { data: products, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) throw error;
  return products;
}

async function getProduct(productId: number): Promise<Product> {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error || !product) throw new Error("Produit non trouvé");
  return product;
}

// Cart utilities
async function addToCart(userId: string, productId: number, quantity: number = 1): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: userId,
      product_id: productId,
      quantity: quantity
    }, {
      onConflict: 'user_id,product_id'
    });

  if (error) throw error;
}

async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', userId);
  
  if (error) throw error;
  return cartItems;
}

async function getCartCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

// Vector search utilities
async function createProductVectorStore(): Promise<MemoryVectorStore> {
  const products = await getProducts();
  
  const docs = products.map(product => {
    return new Document({
      pageContent: `${product.name}\n${product.description}\nPrix: ${product.price}€\nCaractéristiques: ${product.features?.join(', ') || 'Non spécifiées'}`,
      metadata: {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock
      }
    });
  });

  return await MemoryVectorStore.fromDocuments(docs, embeddings);
}

// Agent tools
const searchProductsTool = new DynamicStructuredTool({
  name: "search_products",
  description: "Recherche des produits selon des critères spécifiques ou similaires",
  schema: z.object({
    query: z.string().describe("La requête de recherche"),
  }),
  func: async ({ query }) => {
    const vectorStore = await createProductVectorStore();
    const results = await vectorStore.similaritySearch(query, 4);
    return JSON.stringify({
      type: "search_results",
      results: results.map(doc => ({
        ...doc.metadata,
        description: doc.pageContent
      }))
    });
  },
});

const addToCartTool = new DynamicStructuredTool({
  name: "add_to_cart",
  description: "Ajoute un produit au panier après confirmation explicite de l'utilisateur",
  schema: z.object({
    productId: z.number().describe("L'ID du produit à ajouter"),
    quantity: z.number().optional().describe("La quantité à ajouter (défaut: 1)"),
  }),
  func: async ({ productId, quantity = 1 }) => {
    const userId = await validateUser();
    const product = await getProduct(productId);
    
    await addToCart(userId, productId, quantity);
    const cartItems = await getCartItems(userId);
    const cartCount = await getCartCount(userId);

    // Rechercher des produits similaires pour recommandation
    const vectorStore = await createProductVectorStore();
    const similarProducts = await vectorStore.similaritySearch(product.name + " " + product.description, 3);

    return JSON.stringify({
      type: "cart_update",
      success: true,
      message: `Produit "${product.name}" ajouté au panier`,
      cartCount,
      cartItems,
      recommendations: similarProducts.map(doc => ({
        ...doc.metadata,
        description: doc.pageContent
      }))
    });
  },
});

const getCartTool = new DynamicStructuredTool({
  name: "get_cart",
  description: "Récupère le contenu du panier et suggère des produits complémentaires",
  schema: z.object({}),
  func: async () => {
    const userId = await validateUser();
    const cartItems = await getCartItems(userId);
    
    // Obtenir des recommandations basées sur le panier actuel
    let recommendations: ProductRecommendation[] = [];
    if (cartItems.length > 0) {
      const vectorStore = await createProductVectorStore();
      const searchQuery = cartItems.map(item => item.products?.name || "").join(" ");
      const similarProducts = await vectorStore.similaritySearch(searchQuery, 3);
      recommendations = similarProducts.map(doc => ({
        id: doc.metadata.id,
        name: doc.metadata.name,
        price: doc.metadata.price,
        category: doc.metadata.category,
        stock: doc.metadata.stock,
        description: doc.pageContent
      }));
    }

    return JSON.stringify({
      type: "cart_view",
      cartItems,
      recommendations
    });
  },
});

// Agent configuration
const serviceAdapter = new LangChainAdapter({
  chainFn: async (forwardedProps: { messages: BaseMessage[] }) => {
    try {
      const executor = await initializeAgentExecutorWithOptions(
        [searchProductsTool, addToCartTool, getCartTool],
        model,
        {
          agentType: "zero-shot-react-description",
          verbose: true,
          maxIterations: 3
        }
      );

      const lastMessage = forwardedProps.messages[forwardedProps.messages.length - 1];
      const result = await executor.invoke({
        input: lastMessage.content
      });

      return new AIMessage({
        content: result.output
      });
    } catch (error) {
      console.error("Erreur:", error);
      return new AIMessage({
        content: "Je suis désolé, je n'ai pas compris. Pouvez-vous reformuler ?"
      });
    }
  }
});

// Runtime configuration
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "listProducts",
      description: "Liste tous les produits disponibles",
      handler: async () => {
        try {
          await validateUser();
          const products = await getProducts();
          return {
            products: products.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              description: p.description,
              category: p.category,
              stock: p.stock
            }))
          };
        } catch (error) {
          if (error instanceof Error && error.message === "Utilisateur non autorisé") {
            throw new Error("Service temporairement indisponible");
          }
          throw new Error("Impossible de récupérer la liste des produits");
        }
      }
    },
    {
      name: "addToCart",
      description: "Ajoute un produit au panier",
      parameters: [
        {
          name: "productId",
          type: "number",
          description: "L'ID du produit à ajouter",
          required: true
        },
        {
          name: "quantity",
          type: "number",
          description: "La quantité à ajouter",
          required: false
        }
      ],
      handler: async (args: { productId: number; quantity?: number }) => {
        try {
          const userId = await validateUser();
          await addToCart(userId, args.productId, args.quantity || 1);
          return { 
            success: true,
            message: "Produit ajouté au panier"
          };
        } catch (error) {
          if (error instanceof Error && error.message === "Utilisateur non autorisé") {
            throw new Error("Service temporairement indisponible");
          }
          throw new Error("Impossible d'ajouter le produit au panier");
        }
      }
    }
  ]
});

// API endpoint
export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/copilotkit',
    });

    return await handleRequest(req);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ error: errorMessage, details: errorStack }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 