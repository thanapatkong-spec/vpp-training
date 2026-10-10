import { createAuthClient } from "better-auth/vue";

const client = createAuthClient();
export const useAuthClient = () => client;
