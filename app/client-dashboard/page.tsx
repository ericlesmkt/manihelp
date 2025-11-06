// Nome do arquivo: app/client-dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ClientAppointments from '../../components/ClientAppointments';
import NewAppointmentModal from '../../components/NewAppointmentModal';
import { LogOut, Loader2, Calendar, Settings, User, Plus } from 'lucide-react';

// --- Tipos ---
type ClientProfile = {
    id: string;
    name: string;
    email: string;
    manicureName: string; 
};

const mockManicure = { name: "Dona Maria" }; 

// --- Componente: Header do Cliente ---
function ClientHeader({ profile }: { profile: ClientProfile | null }) {
    const router = useRouter();
    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.replace('/');
        }
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <h1 className="text-2xl font-bold text-mani-pink-600">ManiHelp</h1>
                    
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:block text-sm text-gray-600">
                            Manicure: <span className="font-semibold">{profile?.manicureName || mockManicure.name}</span>
                        </div>
                        <button 
                            onClick={handleSignOut} 
                            className="flex items-center space-x-2 text-sm font-medium text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

// --- Componente Principal: ClientDashboardPage ---
export default function ClientDashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [error, setError] = useState<string | null>(null);


    // Otimizado: A função agora só fecha o modal, pois o ClientAppointments
    // faz a atualização em tempo real (Realtime).
    const handleAppointmentCreated = () => {
      setIsModalOpen(false); 
      // Não precisa de re-fetch manual aqui!
    };

    // 1. CARREGAMENTO E AUTORIZAÇÃO (Cliente)
    useEffect(() => {
        async function checkAuthAndLoadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.replace('/'); 
                return;
            }
            
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('id, name, role')
                .eq('id', user.id)
                .single();
            
            if (error || profileData?.role !== 'client') {
                await supabase.auth.signOut();
                router.replace('/');
                return;
            }

            setProfile({ 
                id: profileData.id, 
                name: profileData.name,
                email: user.email || '', 
                manicureName: mockManicure.name 
            });
            setIsLoading(false);
        }
        checkAuthAndLoadProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                router.replace('/');
            }
        });
        return () => subscription.unsubscribe();
    }, [router]);

    if (isLoading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
                <p className="ml-3 text-gray-600">Verificando sua conta...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-inter">
            <ClientHeader profile={profile} />

            <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                
                {/* Cabeçalho de Boas-Vindas e CTA */}
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Olá, {profile.name}!
                    </h1>
                    <p className="text-lg text-gray-600">
                        Gerencie seus agendamentos com facilidade.
                    </p>
                </div>
                
                {/* Área Principal - Agendamentos */}
                <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 space-y-6">
                    
                    {/* Botão de Nova Ação (CTA) */}
                    <div className="border-b border-gray-100 pb-6">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full flex items-center justify-center bg-mani-pink-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-mani-pink-700 transition"
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            Agendar Novo Serviço
                        </button>
                    </div>

                    {/* Lista de Agendamentos */}
                    <ClientAppointments clientId={profile.id} />
                </div>

                {/* Rodapé - Configurações */}
                <div className="mt-8 text-center">
                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-mani-pink-600 flex items-center justify-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Gerenciar Perfil e Contato
                    </a>
                </div>
            </main>
            
            {/* Modal de Novo Agendamento */}
            {profile.id && (
                <NewAppointmentModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    // Passamos o ID do Cliente como manicureId - Isso precisa ser corrigido para a Manicure real
                    // Por enquanto, apenas para abrir o modal.
                    manicureId={profile.id} 
                    onAppointmentCreated={handleAppointmentCreated}
                />
            )}
        </div>
    );
}