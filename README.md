# E-commerce AI Assistant

Ce projet est une application e-commerce intégrant un assistant IA pour améliorer l'expérience d'achat.

## Fonctionnalités

- 🛍️ Catalogue de produits avec recherche intelligente
- 🤖 Assistant IA pour les recommandations de produits (Mistral AI)
- 🛒 Gestion du panier d'achat
- 👤 Authentification avec Google
- 🔐 Base de données sécurisée avec Supabase

## Prérequis

- Node.js (v18 ou supérieur)
- pnpm (recommandé) ou npm
- Un compte Supabase
- Un compte Mistral AI
- Un compte Google Cloud (pour l'authentification)

## Installation

1. Clonez le repository :
```bash
git clone [votre-repo]
cd ecommerce
```

2. Installez les dépendances :
```bash
pnpm install
```

3. Les variables d'environnement a configurer dans `.env.local` avec :
- Configuration Supabase
- Clés d'authentification Google
- Clé API Mistral
- Configuration NextAuth

4. Lancez le serveur de développement :
```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Structure Détaillée du Projet

```
ecommerce/
├── app/                      # Application Next.js
│   ├── api/                 # Routes API
│   ├── auth/               # Pages d'authentification
│   ├── product/            # Pages produits
│   ├── components/         # Composants spécifiques aux pages
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   └── providers.tsx      # Providers React
│
├── components/              # Composants React réutilisables
│
├── lib/                     # Logique métier et utilitaires
│   ├── actions/           # Actions serveur
│   ├── hooks/             # Hooks React personnalisés
│   ├── supabase.ts       # Configuration Supabase
│   ├── types.ts          # Types TypeScript
│   └── gemini-adapter.ts # Adaptateur IA
│
├── public/                  # Assets statiques
│
└── config/                  # Fichiers de configuration
    ├── next.config.ts     # Configuration Next.js
    ├── postcss.config.mjs # Configuration PostCSS
    └── tsconfig.json      # Configuration TypeScript
```

## Préparation au Déploiement

1. **Vérification des Dépendances**
   - Assurez-vous que toutes les dépendances sont à jour
   ```bash
   pnpm update
   ```
   - Vérifiez qu'il n'y a pas de vulnérabilités
   ```bash
   pnpm audit
   ```

2. **Build de Production**
   ```bash
   pnpm build
   ```

3. **Tests de Production en Local**
   ```bash
   pnpm start
   ```

## Déploiement sur Vercel

1. **Préparation**
   - Créez un compte sur [Vercel](https://vercel.com)
   - Installez Vercel CLI : `pnpm i -g vercel`

2. **Configuration Vercel**
   - Initialisez Vercel : `vercel login`
   - Liez votre projet : `vercel link`

3. **Variables d'Environnement**
   - Copiez toutes les variables de `.env.local` dans le dashboard Vercel
   - Assurez-vous que les URLs de production sont correctement configurées

4. **Déploiement**
   ```bash
   vercel --prod
   ```

## Maintenance

- Surveillez les logs dans le dashboard Vercel
- Configurez des alertes pour les erreurs critiques
- Mettez régulièrement à jour les dépendances
- Sauvegardez régulièrement la base de données Supabase

## Support

Pour toute question ou problème :
1. Consultez la documentation technique dans `/docs`
2. Ouvrez une issue dans le repository
3. Contactez l'équipe de développement

## Sécurité

- Toutes les clés API sont stockées comme variables d'environnement
- L'authentification est gérée par NextAuth.js
- Les données sensibles sont stockées dans Supabase
- CORS est configuré pour la production
