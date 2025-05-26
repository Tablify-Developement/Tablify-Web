import NextAuth from "next-auth"

declare module "next-auth" {
  /**
   * Extension du type User par défaut
   */
  interface User {
    id_utilisateur: string;
    role?: string;
    notification?: boolean;
    langue?: string;
  }

  /**
   * Extension du type Session par défaut
   */
  interface Session {
    user: {
      id_utilisateur: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
  }
}
