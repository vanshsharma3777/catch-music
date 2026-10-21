let token: string | null = null;

export const getToken = (): string | null => token;

export const setToken = (t: string | null): void => {
  token = t;
};

