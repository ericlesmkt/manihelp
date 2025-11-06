// Nome do arquivo: app/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; 
import AuthPage from './auth/AuthPage'; // Importa a tela de autenticação
import { Loader2 } from 'lucide-react';


export default function RootRouter() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Monitora o estado da autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleRouting(session);
    });

    // 2. Verifica o estado inicial na montagem
    async function checkInitialUser() {
        const { data: { session } } = await supabase.auth.getSession();
        handleRouting(session);
    }
    checkInitialUser();

    // Cleanup do listener
    return () => subscription.unsubscribe();
  }, [router]);

  // Função principal de roteamento
  const handleRouting = async (session: any | null) => {
    if (!session) {
      // Se não há sessão, mostra a tela de login/cadastro
      setIsLoading(false);
      return; 
    }

    // Se há sessão, buscamos o perfil para saber a 'role'
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    // Se o profile falhar, mostramos o login por segurança
    if (error || !profile) {
        console.error("Erro ao carregar perfil, mostrando tela de login.", error);
        setIsLoading(false);
        await supabase.auth.signOut(); // Força o logout
        return;
    }

    // Redirecionamento baseado no role
    if (profile.role === 'manicure') {
      router.replace('/dashboard'); // Redireciona para o dashboard principal
    } else if (profile.role === 'client') {
      // Futuramente, redirecionar para uma página específica do cliente
      router.replace('/client-dashboard'); 
    }
    
    setIsLoading(false);
  };

  // --- Renderização ---

  if (isLoading) {
    // Tela de carregamento enquanto verificamos a sessão
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
        <p className="ml-3 text-gray-600">Carregando...</p>
      </div>
    );
  }

  // Se não está carregando e não foi redirecionado, mostra a página de Autenticação
  // (Isso só acontece se não houver sessão)
  return <AuthPage />;
}