// Plain module so non-React code (api.ts) can read the token.
let token: string | null = null;

export const getToken = () => token;
export const setToken = (t: string | null) => {
  token = t;
};