// next-auth.d.ts
import 'next-auth/jwt';

// Read more at: https://next-auth.js.org/getting-started/typescript#module-augmentation
declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's role */
    role?: 'ADMIN' | 'TEAM_MEMBER' | "SUPER_ADMIN"; // Or whatever roles you have
    /** The user's permissions */
    permissions?: string[];
  }
}