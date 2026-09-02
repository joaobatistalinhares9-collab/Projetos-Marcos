import React, { useState, useEffect } from 'react';
import { Loja } from '../data/lojas';
import { LojaCrmData, StatusAbordagem } from '../types';
import { X, Save, FileText, CheckCircle2, Clock, Trash2 } from 'lucide-react';

interface ModalObservacoesProps {
  loja: Loja | null;
  crmData: LojaCrmData | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lojaId: string, observacoes: string) => void;
}

export function ModalObservacoes({
  loja,
  crmData,
  isOpen,
  onClose,
  onSave
}: ModalObservacoesProps) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (crmData?.observacoes) {
      setTexto(crmData.observacoes);
    } else {
      setTexto('');
    }
  }, [crmData, isOpen]);

  if (!isOpen || !loja) return null;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(loja.id, texto);
    onClose();
  };

  const handleLimpar = () => {
    setTexto('');
  };

  const getStatusLabel = (status?: StatusAbordagem) => {
    switch (status) {
      case 'abordado':
        return { label: 'Abordado', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'negou':
        return { label: 'Negou', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'Não Abordado', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const statusInfo = getStatusLabel(crmData?.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Observações & Anotações
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {loja.nome}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                Status: {statusInfo.label}
              </span>
              <span className="text-[11px] text-slate-500">
                {loja.bairro ? `${loja.bairro}, ` : ''}{loja.cidade} - {loja.uf}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSalvar} className="p-5 flex-1 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Comentários sobre o contato (histórico, gerente, negociações, retorno):
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex: Falei com o proprietário Sr. Carlos. Pediu retorno na próxima terça com catálogo de atacado. Tem grande interesse em chás e óleos..."
              rows={7}
              className="w-full p-3 text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 resize-y"
              autoFocus
            />
          </div>

          {crmData?.dataAtualizacao && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Última atualização: {new Date(crmData.dataAtualizacao).toLocaleString('pt-BR')}
            </p>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLimpar}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 border border-transparent hover:border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar texto
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-300"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Save className="w-4 h-4" /> Salvar OBS
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
