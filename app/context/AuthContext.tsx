"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: string;
}

interface RegisterData {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>; // Tipo de retorno se mantiene
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ ESTA FUNCIÓN AHORA DEVUELVE AL USUARIO
  const loadUser = async (auth_id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", auth_id)
      .single();

    if (!error && data) {
      const userData: User = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        rol: data.rol,
      };
      setUser(userData); // 1. Actualiza el estado para la app
      return userData; // 2. Devuelve los datos inmediatamente
    }

    setUser(null);
    return null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user;
      if (sessionUser) {
        loadUser(sessionUser.id).finally(() => setLoading(false)); // Carga al usuario
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadUser(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const register = async (data: RegisterData) => {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Error al crear usuario en Auth");

      // 2. Insertar en tabla users
      const { error: dbError } = await supabase.from("users").insert([
        {
          auth_id: authData.user.id,
          nombre: data.nombre,
          email: data.email.toLowerCase(),
          telefono: data.telefono,
          rol: "usuario",
        },
      ]);

      if (dbError) throw dbError;

      // 3. Cargar datos del usuario (no es necesario capturar el retorno aquí)
      await loadUser(authData.user.id);
    } catch (error: any) {
      console.error("❌ Error en registro:", error);
      throw new Error(error.message || "Error al registrar usuario");
    }
  };

  // ✅ ESTA FUNCIÓN AHORA USA EL VALOR DEVUELTO
  const login = async (email: string, password: string): Promise<User> => {
    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Captura el usuario que 'loadUser' encontró
    const loadedUser = await loadUser(auth.user.id);

    if (!loadedUser) {
      // Seguridad: Si se autenticó pero no tiene perfil en tu tabla 'users'
      await supabase.auth.signOut(); // Cierra la sesión para evitar problemas
      throw new Error("Perfil de usuario no encontrado.");
    }

    // Devuelve el usuario encontrado, no el 'user' del estado
    return loadedUser;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}