// Nome do arquivo: components/EditServiceModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Loader2, DollarSign, Clock, Hash, AlignLeft, Briefcase } from 'lucide-react';

type ServiceItem = {
    id: number;
    name: string;
    price: number;
    duration: number; // Duração em minutos
    description: string; // Adicionado
};

type EditServiceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    service: ServiceItem | null;
    onSave: () => void; // Para atualizar a lista após salvar
};

export default function EditServiceModal({ isOpen, onClose, service, onSave }: EditServiceModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: '',
        description: '', // Adicionado
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega os dados do serviço no estado local ao abrir o modal
    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name,
                price: service.price.toFixed(2).replace('.', ','), // Formato BR
                duration: service.duration.toString(),
                description: service.description || '', // Pode ser nulo
            });
            setError(null);
        }
    }, [service]);

    if (!isOpen || !service) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Permite apenas números, vírgula e ponto (para input do usuário)
        value = value.replace(/[^\d.,]/g, '');
        // Troca vírgula por ponto para facilitar a conversão para float
        value = value.replace(',', '.');
        setFormData(prev => ({ ...prev, price: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!service) return;

        // Limpa e valida os dados
        const priceValue = parseFloat(formData.price.replace(',', '.'));
        const durationValue = parseInt(formData.duration, 10);
        
        if (!formData.name || isNaN(priceValue) || isNaN(durationValue) || durationValue <= 0) {
            setError('Por favor, preencha nome, preço e duração (em minutos) corretamente.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('services')
                .update({
                    name: formData.name,
                    price: priceValue,
                    duration_minutes: durationValue, // Correção do nome da coluna
                    description: formData.description.trim(), // Salva descrição
                })
                .eq('id', service.id);

            if (updateError) throw new Error(updateError.message);

            onSave(); // Notifica a página principal para recarregar
            onClose(); // Fecha o modal
        } catch (e: any) {
            setError('Erro ao salvar serviço: ' + e.message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()} // Impede que o clique interno feche
            >
                {/* Header do Modal */}
                <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
                    <h2 className="text-xl font-bold text-mani-pink-600">Editar Serviço: {service.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body do Modal */}
                <form onSubmit={handleSave} className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    
                    {/* Campo Nome */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                                placeholder="Ex: Manicure Simples"
                            />
                        </div>
                    </div>

                    {/* Campo Preço */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handlePriceChange}
                                required
                                inputMode="decimal"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                                placeholder="Ex: 35,00"
                            />
                        </div>
                    </div>

                    {/* Campo Duração */}
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                                min="5"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                                placeholder="Ex: 45"
                            />
                        </div>
                    </div>
                    
                    {/* Campo Descrição */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
                        <div className="relative">
                             <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500 resize-none"
                                placeholder="O que o serviço inclui? (Ex: Esfoliação e hidratação)"
                            />
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-mani-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-mani-pink-700 transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
}


