import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) return null;

        if (email !== adminEmail) return null;

        // For initial setup: if ADMIN_PASSWORD is plaintext (no $2 prefix), compare directly
        // In production, store a bcrypt hash in env
        let isValid = false;
        if (adminPassword.startsWith("$2")) {
          isValid = await bcrypt.compare(password, adminPassword);
        } else {
          isValid = password === adminPassword;
        }

        if (!isValid) return null;

        return {
          id: "admin",
          email: adminEmail,
          name: "Admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = nextUrl.pathname.startsWith("/admin");

      if (isAdmin && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
});
