// Nome do arquivo: app/auth/AuthPage.tsx
"use client";

import React, { useState } from 'react';
// IMPORTAÇÃO CORRIGIDA: Adicionado CalendarCheck
import { Mail, Lock, User, Phone, Briefcase, Loader2, ArrowLeft, CalendarCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; 
import { useRouter } from 'next/navigation';

// Tipos para gerenciar o estado do formulário e o modo (login ou cadastro)
type AuthMode = 'login' | 'signup';
type UserRole = 'manicure' | 'client';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('client'); // Padrão
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A função principal de autenticação
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        // --- LOGIN ---
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw new Error(loginError.message);
        // O redirecionamento será tratado pelo app/page.tsx
        router.refresh(); 

      } else {
        // --- SIGNUP (CADASTRO) ---
        // Usamos options.data para injetar metadados, incluindo o 'role' e o 'name'
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phoneNumber,
              user_role: role, // Este é o metadado que o RLS Trigger espera!
            },
          },
        });

        if (signupError) throw new Error(signupError.message);

        // Se for cadastro, informamos para verificar o e-mail
        if (role === 'client') {
            // NOTE: Substituir 'alert' por um modal customizado no futuro!
            alert('Verifique seu e-mail para confirmar seu cadastro. Você será redirecionado para a página inicial.');
        } else {
            // NOTE: Substituir 'alert' por um modal customizado no futuro!
            alert('Cadastro de Manicure realizado! Por favor, faça o login.');
        }
        setMode('login'); // Volta para login após o cadastro

      }
    } catch (e: any) {
      console.error('Erro de autenticação:', e);
      // Tratamento de erros específicos (ex: senha muito fraca)
      setError(e.message || 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ícones de status para os botões
  const submitIcon = isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null;
  const submitText = mode === 'login' ? 'Entrar' : 'Cadastrar';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          {/* Logo Minimalista */}
          <div className="mx-auto w-16 h-16 rounded-full bg-mani-pink-600 flex items-center justify-center">
            {/* Ícone CalendarCheck agora está definido */}
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">ManiHelp</h1>
          <p className="text-gray-500">
            {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campos de Cadastro (Signup) */}
          {mode === 'signup' && (
            <>
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 sr-only">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-mani-pink-500 focus:border-mani-pink-500"
                  />
                </div>
              </div>
              
              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 sr-only">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Telefone / WhatsApp"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-mani-pink-500 focus:border-mani-pink-500"
                  />
                </div>
              </div>

              {/* Seleção de Perfil (Role) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                <div className="flex space-x-4">
                  <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer w-1/2 transition ${role === 'client' ? 'border-mani-pink-500 bg-mani-pink-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="role"
                      value="client"
                      checked={role === 'client'}
                      onChange={() => setRole('client')}
                      className="text-mani-pink-600 focus:ring-mani-pink-500"
                    />
                    <span className="text-sm font-medium">Cliente</span>
                  </label>
                  <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer w-1/2 transition ${role === 'manicure' ? 'border-mani-pink-500 bg-mani-pink-50' : 'border-gray-300 bg-white hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="role"
                      value="manicure"
                      checked={role === 'manicure'}
                      onChange={() => setRole('manicure')}
                      className="text-mani-pink-600 focus:ring-mani-pink-500"
                    />
                    <span className="text-sm font-medium">Manicure</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 sr-only">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-mani-pink-500 focus:border-mani-pink-500"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 sr-only">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-mani-pink-500 focus:border-mani-pink-500"
              />
            </div>
          </div>

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-mani-pink-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-mani-pink-700 transition duration-300"
          >
            {submitIcon}
            {submitText}
          </button>
        </form>

        {/* Alternar Modo (Login/Cadastro) */}
        <div className="text-center text-sm">
          {mode === 'login' ? (
            <p className="text-gray-600">
              Não tem conta? {' '}
              <button type="button" onClick={() => setMode('signup')} className="text-mani-pink-600 font-medium hover:text-mani-pink-800">
                Cadastre-se aqui
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              <button type="button" onClick={() => setMode('login')} className="text-mani-pink-600 font-medium hover:text-mani-pink-800 flex items-center mx-auto">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}