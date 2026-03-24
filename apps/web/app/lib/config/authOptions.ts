import { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@repo/db"

export const authOptions: NextAuthOptions = {
    adapter: DrizzleAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "database",
    }, secret: process.env.AUTH_SECRET!,
    
    callbacks: {
        async session({ session, user }) {
            return session;
        },
        async redirect({ url, baseUrl }) {
            return `${baseUrl}/`;
        },
    }
};