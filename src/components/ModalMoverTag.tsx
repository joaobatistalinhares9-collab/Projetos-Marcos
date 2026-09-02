import React, { useState } from 'react';
import { Loja } from '../data/lojas';
import { LojaCrmData, StatusAbordagem, TagItem } from '../types';
import { X, Tag, Check, MoveRight, Layers, Slash } from 'lucide-react';

interface ModalMoverTagProps {
  loja: Loja | null;
  crmData: LojaCrmData | undefined;
  tagsDoBox: TagItem[];
  statusAtual: StatusAbordagem;
  isOpen: boolean;
  onClose: () => void;
  onAplicarTag: (lojaId: string, tagId: string | null, subTagId: string | null) => void;
  onMudarStatus: (lojaId: string, novoStatus: StatusAbordagem) => void;
}

export function ModalMoverTag({
  loja,
  crmData,
  tagsDoBox,
  statusAtual,
  isOpen,
  onClose,
  onAplicarTag,
  onMudarStatus
}: ModalMoverTagProps) {
  const [tagSelecionada, setTagSelecionada] = useState<string | null>(crmData?.tagId || null);
  const [subTagSelecionada, setSubTagSelecionada] = useState<string | null>(crmData?.subTagId || null);
  const [novoStatus, setNovoStatus] = useState<StatusAbordagem>(statusAtual);

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setTagSelecionada(crmData?.tagId || null);
      setSubTagSelecionada(crmData?.subTagId || null);
      setNovoStatus(statusAtual);
    }
  }, [isOpen, crmData, statusAtual]);

  if (!isOpen || !loja) return null;

  const currentTagObj = tagsDoBox.find((t) => t.id === tagSelecionada);

  const handleSalvar = () => {
    if (novoStatus !== statusAtual) {
      onMudarStatus(loja.id, novoStatus);
      // If status changed, clear tag if not in that box
      onAplicarTag(loja.id, null, null);
    } else {
      onAplicarTag(loja.id, tagSelecionada, subTagSelecionada);
    }
    onClose();
  };

  const getStatusTitle = (st: StatusAbordagem) => {
    switch (st) {
      case 'abordado':
        return 'Abordados';
      case 'negou':
        return 'Negaram';
      default:
        return 'Não Abordados';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Organizar Estabelecimento
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[260px]">
                {loja.nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Box / Status Atual:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['nao_abordado', 'abordado', 'negou'] as StatusAbordagem[]).map((st) => {
                const isSelected = novoStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setNovoStatus(st);
                      if (st !== statusAtual) {
                        setTagSelecionada(null);
                        setSubTagSelecionada(null);
                      }
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? st === 'abordado'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : st === 'negou'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-slate-700 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {getStatusTitle(st)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag Selection for Current Box */}
          {novoStatus === statusAtual && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Tags no Box ({getStatusTitle(statusAtual)}):</span>
                {tagSelecionada && (
                  <button
                    type="button"
                    onClick={() => {
                      setTagSelecionada(null);
                      setSubTagSelecionada(null);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
                  >
                    <Slash className="w-3 h-3" /> Deixar sem tag
                  </button>
                )}
              </label>

              {tagsDoBox.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  Nenhuma tag criada neste box ainda. Você pode criar tags diretamente no cabeçalho do box {getStatusTitle(statusAtual)}.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Option: Sem Tag */}
                  <button
                    type="button"
                    onClick={() => {
                      setTagSelecionada(null);
                      setSubTagSelecionada(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      tagSelecionada === null
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-xs ring-1 ring-slate-400'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Slash className="w-3.5 h-3.5 text-slate-400" />
                      Sem Tag (Fora das tags)
                    </span>
                    {tagSelecionada === null && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                  </button>

                  {/* List of Tags */}
                  {tagsDoBox.map((tag) => {
                    const isSelectedTag = tagSelecionada === tag.id;
                    return (
                      <div
                        key={tag.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isSelectedTag
                            ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTagSelecionada(tag.id);
                            // If currently selected subtag is not in this tag, reset it
                            if (!tag.subTags.some((s) => s.id === subTagSelecionada)) {
                              setSubTagSelecionada(null);
                            }
                          }}
                          className="w-full text-left p-2.5 text-xs font-semibold flex items-center justify-between text-slate-800"
                        >
                          <span className="flex items-center gap-2 font-bold">
                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                            {tag.nome}
                          </span>
                          {isSelectedTag && !subTagSelecionada && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3" /> Selecionada
                            </span>
                          )}
                        </button>

                        {/* SubTags of this Tag */}
                        {tag.subTags.length > 0 && (
                          <div className="px-3 pb-2.5 pt-0.5 border-t border-slate-100/80 bg-slate-50/50 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                              Sub-tags disponíveis:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {tag.subTags.map((sub) => {
                                const isSelectedSub = isSelectedTag && subTagSelecionada === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      setTagSelecionada(tag.id);
                                      setSubTagSelecionada(isSelectedSub ? null : sub.id);
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 border ${
                                      isSelectedSub
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                    }`}
                                  >
                                    <Layers className="w-3 h-3" />
                                    {sub.nome}
                                    {isSelectedSub && <Check className="w-3 h-3 font-bold" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Check className="w-4 h-4" /> Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
