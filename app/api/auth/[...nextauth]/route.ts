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
      try {
        const { data: existingUser, error: searchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('Erreur lors de la recherche:', searchError);
          return false;
        }

        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                email: user.email,
                name: user.name,
                image: user.image,
                last_sign_in: new Date().toISOString()
              }
            ]);

          if (insertError) {
            console.error('Erreur lors de la création:', insertError);
            return false;
          }
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({ last_sign_in: new Date().toISOString() })
          .eq('email', user.email);

        if (updateError) {
          console.error('Erreur lors de la mise à jour:', updateError);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Erreur générale:', error);
        return false;
      }
    },
    async session({ session, user }) {
      try {
        if (session?.user?.email) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (error) {
            console.error('Erreur lors de la récupération des données:', error);
            return session;
          }

          session.user.id = userData.id;
          session.user.role = userData.role;
        }
        return session;
      } catch (error) {
        console.error('Erreur lors de la session:', error);
        return session;
      }
    },
  },
});

export { handler as GET, handler as POST }; 