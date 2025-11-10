// Nome do arquivo: app/services/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import EditServiceModal from '../../components/EditServiceModal';
// Ícones COMPLETOS para o Header e a página
import { 
    Loader2, 
    Briefcase, 
    DollarSign, 
    Clock, 
    Trash2, 
    Plus, 
    Users, 
    Calendar, 
    BarChart3, 
    Lock, 
    Bell, 
    ChevronDown, 
    LogOut, 
    Settings,
    Pencil
} from 'lucide-react';

// --- Tipos de Dados ---
type ManicureProfile = { id: string; name: string; };

type ServiceItem = {
    id: number;
    name: string;
    price: number;
    duration: number; // Duração em minutos
    description: string; // Adicionado
};

// --- Componente Header (Completo e Funcional) ---
function Header({ user }: any) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [manicureName, setManicureName] = useState(user.name);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) router.replace('/');
    };

    useEffect(() => {
        async function loadProfileName() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', authUser.id)
                .single();
            if (profile) setManicureName(profile.name);
        }
        loadProfileName();
    }, []);
    
    const isActive = (path: string) => typeof window !== 'undefined' && window.location.pathname === path;

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-mani-pink-600">ManiHelp</h1>
                        <nav className="hidden md:flex space-x-6">
                            <a href="/dashboard" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/dashboard') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Calendar className="inline-block w-5 h-5 mr-1" />
                                Agenda
                            </a>
                            <a href="/clients" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/clients') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Users className="inline-block w-5 h-5 mr-1" />
                                Clientes
                            </a>
                            <a href="/services" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/services') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Briefcase className="inline-block w-5 h-5 mr-1" />
                                Serviços
                            </a>
                            <a href="/schedules" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/schedules') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Clock className="inline-block w-5 h-5 mr-1" />
                                Horários
                            </a>
                             <a href="#" 
                                className={`font-medium px-1 py-2 text-sm transition text-gray-400 cursor-not-allowed`}
                                title="Recurso em desenvolvimento"
                            >
                                <BarChart3 className="inline-block w-5 h-5 mr-1" />
                                <Lock className="inline-block w-4 h-4 mr-1" /> 
                                Relatórios
                            </a>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="text-gray-400 hover:text-gray-500 rounded-full p-1 relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-mani-pink-500 ring-2 ring-white" />
                        </button>
                        
                        <div className="relative">
                            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 rounded-full p-1 pr-2 hover:bg-gray-100">
                                <span className="hidden sm:inline font-medium text-sm text-gray-700">{manicureName}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-20">
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <Settings className="inline-block w-4 h-4 mr-2" />
                                        Configurações
                                    </a>
                                    <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <LogOut className="inline-block w-4 h-4 mr-2" />
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

// Manipulador de preço para criação (separado)
const handlePriceChange = (value: string, setter: React.Dispatch<React.SetStateAction<any>>) => {
    let priceValue = value;
    priceValue = priceValue.replace(/[^\d.,]/g, ''); 
    priceValue = priceValue.replace(',', '.'); 
    setter(prev => ({ ...prev, price: priceValue }));
};


// Manipulador de mudança genérico
const handleNewServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
};


// --- Componente Principal ---
export default function ServicesPage() {
    const router = useRouter();
    const [manicureProfile, setManicureProfile] = useState<ManicureProfile | null>(null);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Novo estado para o formulário de criação (incluindo descrição)
    const [newService, setNewService] = useState({ 
        name: '', 
        price: '', 
        duration: '60', // Padrão 60 minutos
        description: '' 
    });

    // Estados para Edição (Modal)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    
    const mockUser = {
        name: "Dona Maria",
        avatarUrl: "https://placehold.co/100x100/E62E7A/FFFFFF?text=M"
    };

    // Função de Busca de Serviços (Usamos useCallback para otimização)
    const fetchServices = useCallback(async (id: string) => {
        setError(null);
        try {
            // Renomeia 'duration_minutes' para 'duration' no retorno do select para bater com o tipo ServiceItem
            const { data, error } = await supabase
                .from('services')
                .select('id, name, price, duration_minutes, description') 
                .eq('manicure_id', id)
                .order('name', { ascending: true });

            if (error) throw new Error(error.message);
            
            // Mapeia os dados para o tipo ServiceItem, renomeando duration_minutes para duration
            const safeData = (data || []).map(service => ({
                id: service.id,
                name: service.name,
                price: service.price,
                duration: service.duration_minutes, // Mapeia corretamente
                description: service.description || '',
            }));

            setServices(safeData as ServiceItem[]);
        } catch (e: any) {
            setError('Falha ao carregar serviços: ' + e.message);
            console.error(e);
        } 
    }, []);
    
    // 1. CARREGAMENTO E AUTORIZAÇÃO
    useEffect(() => {
        async function checkAuthAndLoadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/'); 
                return;
            }
            
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, name, role')
                .eq('id', user.id)
                .single();
            
            if (error || profile?.role !== 'manicure') {
                await supabase.auth.signOut();
                router.replace('/');
                return;
            }

            setManicureProfile({ id: profile.id, name: profile.name });
            await fetchServices(user.id);
            setIsLoading(false); 
        }
        
        checkAuthAndLoadProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') router.replace('/');
        });
        return () => subscription.unsubscribe();
    }, [router, fetchServices]); 


    // Lógica para Adicionar Novo Serviço
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!manicureProfile || !newService.name || !newService.price || !newService.duration) {
             setError('Preencha nome, preço e duração.');
             setIsSaving(false);
             return;
        }

        // Conversão e Validação
        const priceValue = parseFloat(newService.price.replace(',', '.'));
        const durationValue = parseInt(newService.duration, 10);

        if (isNaN(priceValue) || isNaN(durationValue) || durationValue <= 0) {
            setError('Preço ou duração inválidos.');
            setIsSaving(false);
            return;
        }

        const newEntry = {
            manicure_id: manicureProfile.id,
            name: newService.name.trim(),
            price: priceValue,
            duration_minutes: durationValue, // Usa o nome da coluna do banco
            description: newService.description.trim()
        };

        try {
            const { error: insertError } = await supabase
                .from('services')
                .insert([newEntry]);
            
            if (insertError) {
                if (insertError.code === '23505') { 
                    throw new Error('Você já tem um serviço com este nome.');
                }
                throw new Error(insertError.message);
            }
            
            // Limpa formulário e recarrega
            setNewService({ name: '', price: '', duration: '60', description: '' }); 
            fetchServices(manicureProfile.id); 

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Lógica para Remover Serviço
    const handleDeleteService = async (id: number) => {
        if (!manicureProfile || !confirm('Tem certeza que deseja excluir este serviço? Esta ação é irreversível.')) return;
        
        setIsSaving(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (deleteError) throw new Error(deleteError.message);
            
            fetchServices(manicureProfile.id); 
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Funções para controle do Modal
    const handleOpenModal = (service: ServiceItem) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        if (manicureProfile) fetchServices(manicureProfile.id); // Re-fetch para atualizar a lista
    };


    if (isLoading || !manicureProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
                <p className="ml-3 text-gray-600">Carregando serviços...</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-100 font-inter">
            <Header user={mockUser} /> 
            
            {/* Modal de Edição */}
            <EditServiceModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                service={editingService}
                onSave={handleCloseModal} // onSave chama handleCloseModal, que faz o re-fetch
            />

            <main className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
                
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Briefcase className="w-7 h-7 mr-3 text-mani-pink-600" />
                        Catálogo de Serviços
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">
                        Gerencie os serviços que você oferece e seus respectivos preços e durações.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Seção de Adicionar Novo Serviço */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Serviço
                    </h2>
                    <form onSubmit={handleAddService} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        
                        {/* Nome */}
                        <div className="col-span-2 md:col-span-4 lg:col-span-1">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                            <input 
                                type="text"
                                id="name"
                                name="name"
                                value={newService.name}
                                onChange={(e) => handleNewServiceChange(e, setNewService)}
                                required
                                placeholder="Manicure Simples"
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                            />
                        </div>
                        
                        {/* Preço */}
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                            <input 
                                type="text"
                                id="price"
                                name="price"
                                value={newService.price}
                                onChange={(e) => handlePriceChange(e.target.value, setNewService)}
                                required
                                inputMode="decimal"
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                                placeholder="35,00"
                            />
                        </div>
                        
                        {/* Duração */}
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duração (min)</label>
                            <input 
                                type="number"
                                id="duration"
                                name="duration"
                                value={newService.duration}
                                onChange={(e) => handleNewServiceChange(e, setNewService)}
                                required
                                min="5"
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                                placeholder="45"
                            />
                        </div>

                        {/* Botão Salvar (em linha com os campos) */}
                        <div className='col-span-2 md:col-span-1'>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-2 px-4 bg-mani-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-mani-pink-700 transition disabled:opacity-50 flex items-center justify-center h-[42px]"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Adicionar'}
                            </button>
                        </div>

                         {/* Descrição (Ocupa a largura total na linha de baixo) */}
                        <div className="col-span-2 md:col-span-4">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
                            <textarea
                                id="description"
                                name="description"
                                value={newService.description}
                                onChange={(e) => handleNewServiceChange(e, setNewService)}
                                rows={2}
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500 resize-none"
                                placeholder="Detalhes do serviço para seus clientes (Ex: Incluso esfoliação)."
                            />
                        </div>
                       
                    </form>
                </div>


                {/* Seção de Serviços Cadastrados */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Seu Catálogo Atual</h2>
                    {services.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                             Nenhum serviço cadastrado. Adicione um acima!
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {services.map((service) => (
                                <li key={service.id} className="py-4 flex justify-between items-start">
                                    {/* Informações */}
                                    <div className="flex-1 pr-4">
                                        <div className="font-bold text-lg text-gray-900 flex items-center mb-1">
                                            {service.name}
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600">
                                            <p className="flex items-center">
                                                <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                                                R$ {service.price.toFixed(2).replace('.', ',')}
                                            </p>
                                            <p className="flex items-center mt-1 sm:mt-0">
                                                <Clock className="w-4 h-4 mr-1 text-indigo-600" />
                                                {service.duration} min
                                            </p>
                                        </div>
                                        {/* Descrição (Aparece se existir) */}
                                        {service.description && (
                                            <p className="text-xs text-gray-500 mt-2 italic border-l-2 pl-2 border-mani-pink-200">
                                                {service.description}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Ações */}
                                    <div className="flex space-x-2 flex-shrink-0">
                                        {/* Botão Editar */}
                                        <button 
                                            onClick={() => handleOpenModal(service)}
                                            disabled={isSaving}
                                            className="text-mani-pink-600 hover:text-mani-pink-800 disabled:text-gray-400 p-2 transition rounded-lg hover:bg-mani-pink-50"
                                            title="Editar Serviço"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>

                                        {/* Botão Excluir */}
                                        <button 
                                            onClick={() => handleDeleteService(service.id)}
                                            disabled={isSaving}
                                            className="text-red-500 hover:text-red-700 disabled:text-gray-400 p-2 transition rounded-lg hover:bg-red-50"
                                            title="Excluir Serviço"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}