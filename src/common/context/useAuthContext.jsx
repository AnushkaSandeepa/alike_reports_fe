import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext({});

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

const authSessionKey = '_HYPER_AUTH';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    localStorage.getItem(authSessionKey)
      ? JSON.parse(localStorage.getItem(authSessionKey) || '{}')
      : undefined
  );

  const saveSession = useCallback(
    (user) => {
      localStorage.setItem(authSessionKey, JSON.stringify(user.token));
      setUser(user);
    },
    [setUser]
  );

  const removeSession = useCallback(() => {
    localStorage.removeItem(authSessionKey);
    setUser(undefined);
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        saveSession,
        removeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
