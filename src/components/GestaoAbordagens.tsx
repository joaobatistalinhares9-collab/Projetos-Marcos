import React, { useState } from 'react';
import { Loja, CidadeInfo } from '../data/lojas';
import { LojaCrmData, StatusAbordagem, TagItem, SubTag } from '../types';
import { ModalObservacoes } from './ModalObservacoes';
import { ModalMoverTag } from './ModalMoverTag';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Tag as TagIcon,
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Search,
  Move,
  GripVertical,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface GestaoAbordagensProps {
  cidades: CidadeInfo[];
  cidadesPorRegiao: Record<string, CidadeInfo[]>;
  todasLojas: Loja[];
  cidadeSelecionadaId: string;
  onSelecionarCidade: (cidadeId: string) => void;
  crmLojas: Record<string, LojaCrmData>;
  tagsPorBox: {
    nao_abordado: TagItem[];
    abordado: TagItem[];
    negou: TagItem[];
  };
  onUpdateStatusLoja: (lojaId: string, status: StatusAbordagem) => void;
  onUpdateTagLoja: (lojaId: string, tagId: string | null, subTagId: string | null) => void;
  onUpdateObservacaoLoja: (lojaId: string, observacoes: string) => void;
  onAdicionarTag: (box: StatusAbordagem, nome: string) => void;
  onEditarTag: (box: StatusAbordagem, tagId: string, novoNome: string) => void;
  onExcluirTag: (box: StatusAbordagem, tagId: string) => void;
  onAdicionarSubTag: (box: StatusAbordagem, tagId: string, nomeSubTag: string) => void;
  onEditarSubTag: (box: StatusAbordagem, tagId: string, subTagId: string, novoNome: string) => void;
  onExcluirSubTag: (box: StatusAbordagem, tagId: string, subTagId: string) => void;
}

export function GestaoAbordagens({
  cidades,
  cidadesPorRegiao,
  todasLojas,
  cidadeSelecionadaId,
  onSelecionarCidade,
  crmLojas,
  tagsPorBox,
  onUpdateStatusLoja,
  onUpdateTagLoja,
  onUpdateObservacaoLoja,
  onAdicionarTag,
  onEditarTag,
  onExcluirTag,
  onAdicionarSubTag,
  onEditarSubTag,
  onExcluirSubTag
}: GestaoAbordagensProps) {
  // Collapsible boxes state
  const [boxAberto, setBoxAberto] = useState<{
    abordado: boolean;
    nao_abordado: boolean;
    negou: boolean;
  }>({
    nao_abordado: true,
    abordado: true,
    negou: true
  });

  // Modal states
  const [lojaObsModal, setLojaObsModal] = useState<Loja | null>(null);
  const [lojaTagModal, setLojaTagModal] = useState<Loja | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Tag creation / editing states
  const [novaTagInput, setNovaTagInput] = useState<{ box: StatusAbordagem | null; texto: string }>({
    box: null,
    texto: ''
  });
  const [editandoTag, setEditandoTag] = useState<{
    box: StatusAbordagem;
    tagId: string;
    texto: string;
  } | null>(null);

  const [novaSubTagInput, setNovaSubTagInput] = useState<{
    box: StatusAbordagem;
    tagId: string;
    texto: string;
  } | null>(null);
  const [editandoSubTag, setEditandoSubTag] = useState<{
    box: StatusAbordagem;
    tagId: string;
    subTagId: string;
    texto: string;
  } | null>(null);

  // Filter search inside CRM
  const [termoBuscaCrm, setTermoBuscaCrm] = useState('');

  // Drag and Drop state
  const [draggedLojaId, setDraggedLojaId] = useState<string | null>(null);

  // Lojas for selected city
  const lojasDaCidade = React.useMemo(() => {
    if (cidadeSelecionadaId === 'todas') {
      return todasLojas;
    }
    return todasLojas.filter((l) => l.cidadeId === cidadeSelecionadaId);
  }, [todasLojas, cidadeSelecionadaId]);

  // Apply search filter if any
  const lojasFiltradas = React.useMemo(() => {
    if (!termoBuscaCrm.trim()) return lojasDaCidade;
    const termo = termoBuscaCrm.toLowerCase();
    return lojasDaCidade.filter(
      (l) =>
        l.nome.toLowerCase().includes(termo) ||
        (l.bairro && l.bairro.toLowerCase().includes(termo)) ||
        l.endereco.toLowerCase().includes(termo) ||
        (l.telefone && l.telefone.includes(termo)) ||
        (crmLojas[l.id]?.observacoes && crmLojas[l.id].observacoes!.toLowerCase().includes(termo))
    );
  }, [lojasDaCidade, termoBuscaCrm, crmLojas]);

  // Group stores by status
  const lojasPorStatus = React.useMemo(() => {
    const grupos: Record<StatusAbordagem, Loja[]> = {
      nao_abordado: [],
      abordado: [],
      negou: []
    };

    lojasFiltradas.forEach((loja) => {
      const crm = crmLojas[loja.id];
      const status: StatusAbordagem = crm?.status || 'nao_abordado';
      grupos[status].push(loja);
    });

    return grupos;
  }, [lojasFiltradas, crmLojas]);

  const cidadeAtual = cidades.find((c) => c.id === cidadeSelecionadaId);

  const copiarNumero = (telefone: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(telefone);
    setCopiadoId(id);
    setTimeout(() => {
      setCopiadoId(null);
    }, 2000);
  };

  const formatarNumeroParaWhatsapp = (telefone: string): string => {
    const apenasDigitos = telefone.replace(/\D/g, '');
    if (apenasDigitos.startsWith('55')) {
      return apenasDigitos;
    }
    return `55${apenasDigitos}`;
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lojaId: string) => {
    e.dataTransfer.setData('text/plain', lojaId);
    setDraggedLojaId(lojaId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTag = (
    e: React.DragEvent,
    status: StatusAbordagem,
    tagId: string | null,
    subTagId: string | null = null
  ) => {
    e.preventDefault();
    const lojaId = e.dataTransfer.getData('text/plain') || draggedLojaId;
    if (lojaId) {
      onUpdateStatusLoja(lojaId, status);
      onUpdateTagLoja(lojaId, tagId, subTagId);
    }
    setDraggedLojaId(null);
  };

  // Render Box
  const renderBox = (
    statusKey: StatusAbordagem,
    titulo: string,
    corTema: {
      bgHeader: string;
      textHeader: string;
      border: string;
      badge: string;
      tagBg: string;
      tagBorder: string;
      tagText: string;
      btnStatusActive: string;
    },
    icon: React.ReactNode
  ) => {
    const lojasDoBox = lojasPorStatus[statusKey] || [];
    const tagsDoBox = tagsPorBox[statusKey] || [];
    const estaAberto = boxAberto[statusKey];

    // Separate stores with tag vs without tag
    const lojasSemTag = lojasDoBox.filter((l) => {
      const crm = crmLojas[l.id];
      return !crm?.tagId || !tagsDoBox.some((t) => t.id === crm.tagId);
    });

    return (
      <div
        id={`crm-box-${statusKey}`}
        className={`bg-white rounded-2xl border ${corTema.border} shadow-sm overflow-hidden transition-all duration-200`}
      >
        {/* Box Header (Collapsible toggle) */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none ${corTema.bgHeader} border-b ${corTema.border}`}
          onClick={() =>
            setBoxAberto((prev) => ({ ...prev, [statusKey]: !prev[statusKey] }))
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center font-bold">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base sm:text-lg ${corTema.textHeader}`}>
                  {titulo}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${corTema.badge}`}
                >
                  {lojasDoBox.length} {lojasDoBox.length === 1 ? 'loja' : 'lojas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {tagsDoBox.length} {tagsDoBox.length === 1 ? 'tag criada' : 'tags criadas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id={`btn-nova-tag-${statusKey}`}
              onClick={(e) => {
                e.stopPropagation();
                setNovaTagInput({ box: statusKey, texto: '' });
                if (!estaAberto) {
                  setBoxAberto((prev) => ({ ...prev, [statusKey]: true }));
                }
              }}
              className="text-xs font-bold px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl flex items-center gap-1 shadow-2xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 font-bold" />
              <span>Nova Tag</span>
            </button>

            <div className="p-1 rounded-lg text-slate-500 hover:bg-white/80 transition-colors">
              {estaAberto ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Box Body */}
        {estaAberto && (
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/40">
            {/* New Tag Input Form */}
            {novaTagInput.box === statusKey && (
              <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-sm flex items-center gap-2 animate-in fade-in duration-150">
                <TagIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Nome da nova Tag (ex: Em Negociação, Sem Interesse, Prioridade)..."
                  value={novaTagInput.texto}
                  onChange={(e) =>
                    setNovaTagInput({ box: statusKey, texto: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && novaTagInput.texto.trim()) {
                      onAdicionarTag(statusKey, novaTagInput.texto.trim());
                      setNovaTagInput({ box: null, texto: '' });
                    }
                  }}
                  autoFocus
                  className="flex-1 text-xs sm:text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (novaTagInput.texto.trim()) {
                      onAdicionarTag(statusKey, novaTagInput.texto.trim());
                      setNovaTagInput({ box: null, texto: '' });
                    }
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setNovaTagInput({ box: null, texto: '' })}
                  className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* List of Custom Tags */}
            {tagsDoBox.map((tag) => {
              const lojasDaTag = lojasDoBox.filter((l) => crmLojas[l.id]?.tagId === tag.id);
              const isEditingTag = editandoTag?.tagId === tag.id && editandoTag.box === statusKey;

              return (
                <div
                  key={tag.id}
                  id={`tag-group-${tag.id}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnTag(e, statusKey, tag.id, null)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  {/* Tag Header Bar */}
                  <div className={`p-3.5 sm:px-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 ${corTema.tagBg}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <TagIcon className={`w-4 h-4 ${corTema.tagText}`} />

                      {isEditingTag ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editandoTag.texto}
                            onChange={(e) =>
                              setEditandoTag({ ...editandoTag, texto: e.target.value })
                            }
                            className="text-xs p-1 bg-white border border-emerald-500 rounded font-bold text-slate-900 w-full max-w-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editandoTag.texto.trim()) {
                                onEditarTag(statusKey, tag.id, editandoTag.texto.trim());
                                setEditandoTag(null);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoTag(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${corTema.tagText}`}>
                            {tag.nome}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.2 bg-white/90 text-slate-700 rounded-full border border-slate-200">
                            {lojasDaTag.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tag Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setNovaSubTagInput({ box: statusKey, tagId: tag.id, texto: '' })
                        }
                        title="Adicionar Sub-tag"
                        className="text-[11px] font-semibold px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3 text-emerald-600" />
                        + Sub-Tag
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditandoTag({ box: statusKey, tagId: tag.id, texto: tag.nome })
                        }
                        title="Editar nome da Tag"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Deseja realmente excluir a tag "${tag.nome}"? Os estabelecimentos voltarão para "Sem Tag".`
                            )
                          ) {
                            onExcluirTag(statusKey, tag.id);
                          }
                        }}
                        title="Excluir Tag"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* New SubTag Input Form */}
                  {novaSubTagInput?.tagId === tag.id && novaSubTagInput.box === statusKey && (
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />
                      <input
                        type="text"
                        placeholder="Nome da Sub-Tag (ex: Retorno na Terça, WhatsApp Enviado)..."
                        value={novaSubTagInput.texto}
                        onChange={(e) =>
                          setNovaSubTagInput({ ...novaSubTagInput, texto: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && novaSubTagInput.texto.trim()) {
                            onAdicionarSubTag(
                              statusKey,
                              tag.id,
                              novaSubTagInput.texto.trim()
                            );
                            setNovaSubTagInput(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 text-xs p-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (novaSubTagInput.texto.trim()) {
                            onAdicionarSubTag(
                              statusKey,
                              tag.id,
                              novaSubTagInput.texto.trim()
                            );
                            setNovaSubTagInput(null);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setNovaSubTagInput(null)}
                        className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* SubTags Containers */}
                  {tag.subTags.length > 0 && (
                    <div className="p-3 bg-slate-50/70 border-b border-slate-100 space-y-2">
                      {tag.subTags.map((sub) => {
                        const lojasDaSubTag = lojasDaTag.filter(
                          (l) => crmLojas[l.id]?.subTagId === sub.id
                        );
                        const isEditingSub =
                          editandoSubTag?.subTagId === sub.id &&
                          editandoSubTag.tagId === tag.id;

                        return (
                          <div
                            key={sub.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleDropOnTag(e, statusKey, tag.id, sub.id);
                            }}
                            className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />
                                {isEditingSub ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <input
                                      type="text"
                                      value={editandoSubTag.texto}
                                      onChange={(e) =>
                                        setEditandoSubTag({
                                          ...editandoSubTag,
                                          texto: e.target.value
                                        })
                                      }
                                      className="text-xs p-1 bg-white border border-emerald-500 rounded font-semibold w-full max-w-xs"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editandoSubTag.texto.trim()) {
                                          onEditarSubTag(
                                            statusKey,
                                            tag.id,
                                            sub.id,
                                            editandoSubTag.texto.trim()
                                          );
                                          setEditandoSubTag(null);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-bold"
                                    >
                                      OK
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-slate-700">
                                    Sub-tag: {sub.nome} ({lojasDaSubTag.length})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditandoSubTag({
                                      box: statusKey,
                                      tagId: tag.id,
                                      subTagId: sub.id,
                                      texto: sub.nome
                                    })
                                  }
                                  title="Editar Sub-tag"
                                  className="p-1 text-slate-400 hover:text-slate-700"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onExcluirSubTag(statusKey, tag.id, sub.id)}
                                  title="Excluir Sub-tag"
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Stores in this SubTag */}
                            {lojasDaSubTag.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                {lojasDaSubTag.map((loja) =>
                                  renderStoreCard(loja, statusKey, tag, sub)
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                Arraste estabelecimentos para cá ou use o botão Organizar
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Stores directly under Tag (without subtag) */}
                  <div className="p-3">
                    {(() => {
                      const lojasSemSubTag = lojasDaTag.filter(
                        (l) => !crmLojas[l.id]?.subTagId
                      );

                      if (lojasSemSubTag.length === 0 && tag.subTags.length === 0) {
                        return (
                          <div className="text-xs text-slate-400 py-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            Nenhum estabelecimento nesta tag. Arraste estabelecimentos aqui ou use o botão <strong>Organizar</strong> no card.
                          </div>
                        );
                      }

                      if (lojasSemSubTag.length > 0) {
                        return (
                          <div className="space-y-2">
                            {tag.subTags.length > 0 && (
                              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                                Estabelecimentos nesta Tag principal:
                              </span>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {lojasSemSubTag.map((loja) =>
                                renderStoreCard(loja, statusKey, tag, null)
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })}

            {/* Section: Estabelecimentos Sem Tag (Fora das tags) */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnTag(e, statusKey, null, null)}
              className="bg-white rounded-2xl border border-dashed border-slate-300 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    #
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Sem Tag / Fora das Tags ({lojasSemTag.length})
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Arraste para cá para remover de qualquer tag
                </span>
              </div>

              {lojasSemTag.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                  Todos os estabelecimentos deste box estão organizados em tags!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {lojasSemTag.map((loja) => renderStoreCard(loja, statusKey, null, null))}
                </div>
              )}
            </div>

            {/* Empty Box Message */}
            {lojasDoBox.length === 0 && (
              <div className="text-center py-6 px-4 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-1">
                <p className="font-semibold">Nenhum estabelecimento marcado como "{titulo}" em {cidadeAtual?.nome || 'todas as cidades'}.</p>
                <p className="text-slate-400">Marque estabelecimentos nos botões abaixo ou arraste-os para este box.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render individual store card inside CRM
  const renderStoreCard = (
    loja: Loja,
    statusKey: StatusAbordagem,
    tag: TagItem | null,
    subTag: SubTag | null
  ) => {
    const crm = crmLojas[loja.id];
    const temObs = Boolean(crm?.observacoes && crm.observacoes.trim().length > 0);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${loja.nome} ${loja.endereco}`
    )}`;

    return (
      <div
        key={loja.id}
        id={`crm-card-${loja.id}`}
        draggable
        onDragStart={(e) => handleDragStart(e, loja.id)}
        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 group cursor-grab active:cursor-grabbing relative"
      >
        <div>
          {/* Top row: Name + Drag handle + Category */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-start gap-1.5 flex-1 min-w-0">
              <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5 cursor-grab" />
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate">
                {loja.nome}
              </h5>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
              {loja.bairro || loja.cidade}
            </span>
          </div>

          {/* Address snippet */}
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {loja.endereco}
          </p>

          {/* Phone & WhatsApp */}
          {loja.telefone && (
            <div className="flex items-center gap-1 mt-1.5">
              <a
                href={`https://wa.me/${formatarNumeroParaWhatsapp(loja.telefone)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir WhatsApp"
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>{loja.telefone}</span>
              </a>

              <button
                type="button"
                id={`btn-copiar-crm-${loja.id}`}
                onClick={(e) => copiarNumero(loja.telefone, loja.id, e)}
                title="Copiar número de telefone"
                className="p-1 text-slate-500 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 rounded border border-slate-200 transition-colors"
              >
                {copiadoId === loja.id ? (
                  <Check className="w-3 h-3 text-emerald-600 font-bold" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-500" />
                )}
              </button>
            </div>
          )}

          {/* Current Tag Badge if present */}
          {tag && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 flex items-center gap-1">
                <TagIcon className="w-2.5 h-2.5 text-emerald-600" />
                {tag.nome} {subTag ? `› ${subTag.nome}` : ''}
              </span>
            </div>
          )}

          {/* Preview of Notes if present */}
          {temObs && (
            <div className="mt-2 p-2 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-tight line-clamp-2">
              <span className="font-bold">📝 OBS:</span> {crm!.observacoes}
            </div>
          )}
        </div>

        {/* Action Buttons Row: OBS, Organizar Tag, and Quick Status Switchers */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Top Button pair: OBS and Tag Mover */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Button: OBS */}
            <button
              type="button"
              id={`btn-obs-${loja.id}`}
              onClick={() => setLojaObsModal(loja)}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all border ${
                temObs
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${temObs ? 'text-amber-700 font-bold' : 'text-slate-500'}`} />
              <span>{temObs ? 'OBS. (Salva)' : 'OBS.'}</span>
            </button>

            {/* Button: Mudar / Organizar Tag */}
            <button
              type="button"
              id={`btn-tag-mover-${loja.id}`}
              onClick={() => setLojaTagModal(loja)}
              className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Organizar Tag</span>
            </button>
          </div>

          {/* Status Switcher Buttons */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onUpdateStatusLoja(loja.id, 'nao_abordado')}
              className={`py-1 px-1 text-center rounded-md text-[10px] font-bold transition-all border ${
                statusKey === 'nao_abordado'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Não Abordado
            </button>

            <button
              type="button"
              onClick={() => onUpdateStatusLoja(loja.id, 'abordado')}
              className={`py-1 px-1 text-center rounded-md text-[10px] font-bold transition-all border ${
                statusKey === 'abordado'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              Abordado
            </button>

            <button
              type="button"
              onClick={() => onUpdateStatusLoja(loja.id, 'negou')}
              className={`py-1 px-1 text-center rounded-md text-[10px] font-bold transition-all border ${
                statusKey === 'negou'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                  : 'bg-rose-50/60 text-rose-800 hover:bg-rose-100 border-rose-200'
              }`}
            >
              Negou
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* City Selector & CRM Overview Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/90 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Gestão de Abordagens & Prospecção
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Acompanhe o funil de contato por cidade, organize com tags e sub-tags e registre anotações em cada estabelecimento.
            </p>
          </div>

          {/* City Selector */}
          <div className="w-full sm:w-auto min-w-[240px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cidade da Prospecção:
            </label>
            <select
              id="select-cidade-crm"
              value={cidadeSelecionadaId}
              onChange={(e) => onSelecionarCidade(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="todas">🌍 Todas as Cidades ({todasLojas.length} lojas)</option>
              {(['Norte', 'Nordeste', 'Sudeste', 'Centro-Oeste', 'Sul'] as const).map((reg) => (
                <optgroup key={reg} label={`Região ${reg}`}>
                  {(cidadesPorRegiao[reg] || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.nome} - {c.uf}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* CRM Quick Stats and Search Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Total: <strong>{lojasDaCidade.length}</strong>
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-300">
              ⚪ Não Abordados: <strong>{lojasPorStatus.nao_abordado.length}</strong>
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
              🟢 Abordados: <strong>{lojasPorStatus.abordado.length}</strong>
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-100 text-rose-900 border border-rose-300">
              🔴 Negaram: <strong>{lojasPorStatus.negou.length}</strong>
            </span>
          </div>

          {/* Search inside CRM */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por nome, bairro, OBS..."
              value={termoBuscaCrm}
              onChange={(e) => setTermoBuscaCrm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3 Collapsible Boxes (Não Abordados, Abordados, Negaram) */}
      <div className="space-y-5">
        {/* Box 1: Não Abordados */}
        {renderBox(
          'nao_abordado',
          'Não Abordados',
          {
            bgHeader: 'bg-slate-50 hover:bg-slate-100/80',
            textHeader: 'text-slate-900',
            border: 'border-slate-200',
            badge: 'bg-slate-100 text-slate-800 border-slate-300',
            tagBg: 'bg-slate-50',
            tagBorder: 'border-slate-200',
            tagText: 'text-slate-800',
            btnStatusActive: 'bg-slate-800 text-white'
          },
          <HelpCircle className="w-5 h-5 text-slate-600" />
        )}

        {/* Box 2: Abordados */}
        {renderBox(
          'abordado',
          'Abordados',
          {
            bgHeader: 'bg-emerald-50/70 hover:bg-emerald-50',
            textHeader: 'text-emerald-950',
            border: 'border-emerald-200',
            badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
            tagBg: 'bg-emerald-50/50',
            tagBorder: 'border-emerald-200',
            tagText: 'text-emerald-900',
            btnStatusActive: 'bg-emerald-600 text-white'
          },
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        )}

        {/* Box 3: Negaram */}
        {renderBox(
          'negou',
          'Negaram',
          {
            bgHeader: 'bg-rose-50/70 hover:bg-rose-50',
            textHeader: 'text-rose-950',
            border: 'border-rose-200',
            badge: 'bg-rose-100 text-rose-900 border-rose-300',
            tagBg: 'bg-rose-50/50',
            tagBorder: 'border-rose-200',
            tagText: 'text-rose-900',
            btnStatusActive: 'bg-rose-600 text-white'
          },
          <XCircle className="w-5 h-5 text-rose-600" />
        )}
      </div>

      {/* Modals */}
      <ModalObservacoes
        loja={lojaObsModal}
        crmData={lojaObsModal ? crmLojas[lojaObsModal.id] : undefined}
        isOpen={Boolean(lojaObsModal)}
        onClose={() => setLojaObsModal(null)}
        onSave={onUpdateObservacaoLoja}
      />

      <ModalMoverTag
        loja={lojaTagModal}
        crmData={lojaTagModal ? crmLojas[lojaTagModal.id] : undefined}
        tagsDoBox={
          lojaTagModal
            ? tagsPorBox[crmLojas[lojaTagModal.id]?.status || 'nao_abordado'] || []
            : []
        }
        statusAtual={
          lojaTagModal ? crmLojas[lojaTagModal.id]?.status || 'nao_abordado' : 'nao_abordado'
        }
        isOpen={Boolean(lojaTagModal)}
        onClose={() => setLojaTagModal(null)}
        onAplicarTag={onUpdateTagLoja}
        onMudarStatus={onUpdateStatusLoja}
      />
    </div>
  );
}
