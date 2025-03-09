import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase, supabaseAdmin } from '@/lib/supabase';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  debug: true,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('Début du processus de signIn', { user, account });
      
      if (account?.provider === 'google') {
        try {
          console.log('Vérification de l\'utilisateur dans Supabase');
          const { data: existingUser, error: searchError } = await supabaseAdmin
            .from('user_product')
            .select()
            .eq('email', user.email)
            .single();

          if (searchError && searchError.code !== 'PGRST116') {
            console.error('Erreur lors de la recherche:', searchError);
            return false;
          }

          console.log('Utilisateur existant:', existingUser);

          if (!existingUser) {
            console.log('Création d\'un nouvel utilisateur');
            const newUser = {
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              provider: 'google',
              provider_id: user.id,
              role: 'user',
              last_login: new Date().toISOString(),
            };
            
            const { error: insertError } = await supabaseAdmin
              .from('user_product')
              .insert([newUser]);

            if (insertError) {
              console.error('Erreur lors de la création:', insertError);
              return false;
            }
            console.log('Nouvel utilisateur créé avec succès');
          } else {
            console.log('Mise à jour de la dernière connexion');
            const { error: updateError } = await supabaseAdmin
              .from('user_product')
              .update({ last_login: new Date().toISOString() })
              .eq('email', user.email);

            if (updateError) {
              console.error('Erreur lors de la mise à jour:', updateError);
            }
          }
          return true;
        } catch (error) {
          console.error('Erreur générale:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      console.log('Configuration de la session', { session, user });
      
      if (session.user?.email) {
        const { data: userData, error } = await supabaseAdmin
          .from('user_product')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération des données:', error);
        }

        if (userData) {
          session.user.id = userData.id;
          session.user.role = userData.role;
          session.user.last_login = userData.last_login;
          console.log('Session mise à jour avec les données Supabase');
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 