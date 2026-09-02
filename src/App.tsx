import React, { useState, useEffect, useMemo } from 'react';
import { lojas, cidades, Loja, CidadeInfo } from './data/lojas';
import Mapa from './components/Mapa';
import { GestaoAbordagens } from './components/GestaoAbordagens';
import { ModalObservacoes } from './components/ModalObservacoes';
import { StatusAbordagem, TagItem, LojaCrmData } from './types';
import {
  Search,
  MapPin,
  Leaf,
  ShoppingBag,
  Navigation,
  Heart,
  LocateFixed,
  ArrowUpDown,
  Clock,
  ExternalLink,
  X,
  Compass,
  Sparkles,
  Building2,
  Phone,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MessageCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Tag as TagIcon
} from 'lucide-react';

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

const REGIOES = [
  { id: 'Todas', nome: 'Todas as Regiões', icone: '🌎' },
  { id: 'Norte', nome: 'Norte', icone: '🌳' },
  { id: 'Nordeste', nome: 'Nordeste', icone: '☀️' },
  { id: 'Sudeste', nome: 'Sudeste', icone: '🏙️' },
  { id: 'Centro-Oeste', nome: 'Centro-Oeste', icone: '🌾' },
  { id: 'Sul', nome: 'Sul', icone: '🌲' },
] as const;

const DEFAULT_TAGS: {
  nao_abordado: TagItem[];
  abordado: TagItem[];
  negou: TagItem[];
} = {
  nao_abordado: [
    {
      id: 'tag-nao-1',
      nome: 'Prioridade Alta',
      subTags: [
        { id: 'sub-nao-1-1', nome: 'Zona Central' },
        { id: 'sub-nao-1-2', nome: 'Grande Porte' }
      ]
    },
    {
      id: 'tag-nao-2',
      nome: 'Rota da Semana',
      subTags: []
    }
  ],
  abordado: [
    {
      id: 'tag-ab-1',
      nome: 'Em Negociação',
      subTags: [
        { id: 'sub-ab-1-1', nome: 'Catálogo Enviado' },
        { id: 'sub-ab-1-2', nome: 'Aguardando Retorno' }
      ]
    },
    {
      id: 'tag-ab-2',
      nome: 'Parceria Fechada',
      subTags: [
        { id: 'sub-ab-2-1', nome: 'Primeiro Pedido' },
        { id: 'sub-ab-2-2', nome: 'Cliente Recorrente' }
      ]
    }
  ],
  negou: [
    {
      id: 'tag-neg-1',
      nome: 'Sem Interesse no Momento',
      subTags: [
        { id: 'sub-neg-1-1', nome: 'Tentar em 3 meses' }
      ]
    },
    {
      id: 'tag-neg-2',
      nome: 'Já Possui Fornecedor',
      subTags: []
    },
    {
      id: 'tag-neg-3',
      nome: 'Preço / Condições',
      subTags: []
    }
  ]
};

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<'guia' | 'gestao'>('guia');
  const [cidadeSelecionadaId, setCidadeSelecionadaId] = useState<string>('manaus-am');
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todas');
  const [apenasFavoritos, setApenasFavoritos] = useState(false);
  const [bairroFiltro, setBairroFiltro] = useState<string>('Todos');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [obtendoGPS, setObtendoGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [selectedLojaId, setSelectedLojaId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // CRM State & Persistence
  const [crmLojas, setCrmLojas] = useState<Record<string, LojaCrmData>>({});
  const [tagsPorBox, setTagsPorBox] = useState<{
    nao_abordado: TagItem[];
    abordado: TagItem[];
    negou: TagItem[];
  }>(DEFAULT_TAGS);
  const [lojaObsModal, setLojaObsModal] = useState<Loja | null>(null);

  // Region filter state
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>('Todas');
  const [boxCidadesAberto, setBoxCidadesAberto] = useState<boolean>(true);

  // Load CRM Data and Tags from localStorage
  useEffect(() => {
    try {
      const savedCrm = localStorage.getItem('crm_lojas_data');
      if (savedCrm) {
        setCrmLojas(JSON.parse(savedCrm));
      }
      const savedTags = localStorage.getItem('crm_tags_por_box');
      if (savedTags) {
        setTagsPorBox(JSON.parse(savedTags));
      }
    } catch (e) {
      console.error('Erro ao carregar dados do CRM:', e);
    }
  }, []);

  // Save CRM helper
  const salvarCrmData = (novosDados: Record<string, LojaCrmData>) => {
    setCrmLojas(novosDados);
    try {
      localStorage.setItem('crm_lojas_data', JSON.stringify(novosDados));
    } catch (e) {
      console.error('Erro ao salvar CRM:', e);
    }
  };

  // Save Tags helper
  const salvarTagsData = (novasTags: {
    nao_abordado: TagItem[];
    abordado: TagItem[];
    negou: TagItem[];
  }) => {
    setTagsPorBox(novasTags);
    try {
      localStorage.setItem('crm_tags_por_box', JSON.stringify(novasTags));
    } catch (e) {
      console.error('Erro ao salvar Tags:', e);
    }
  };

  // CRM Actions
  const handleUpdateStatusLoja = (lojaId: string, novoStatus: StatusAbordagem) => {
    setCrmLojas((prev) => {
      const itemAtual = prev[lojaId] || { status: 'nao_abordado' };
      const statusAntigo = itemAtual.status || 'nao_abordado';
      // If status changed, check if tag is still valid for this box, else reset tag
      const tagPermanece = statusAntigo === novoStatus ? itemAtual.tagId : null;
      const subTagPermanece = statusAntigo === novoStatus ? itemAtual.subTagId : null;

      const atualizado: Record<string, LojaCrmData> = {
        ...prev,
        [lojaId]: {
          ...itemAtual,
          status: novoStatus,
          tagId: tagPermanece,
          subTagId: subTagPermanece,
          dataAtualizacao: new Date().toISOString()
        }
      };
      salvarCrmData(atualizado);
      return atualizado;
    });
  };

  const handleUpdateTagLoja = (
    lojaId: string,
    tagId: string | null,
    subTagId: string | null = null
  ) => {
    setCrmLojas((prev) => {
      const itemAtual = prev[lojaId] || { status: 'nao_abordado' };
      const atualizado: Record<string, LojaCrmData> = {
        ...prev,
        [lojaId]: {
          ...itemAtual,
          tagId,
          subTagId,
          dataAtualizacao: new Date().toISOString()
        }
      };
      salvarCrmData(atualizado);
      return atualizado;
    });
  };

  const handleUpdateObservacaoLoja = (lojaId: string, observacoes: string) => {
    setCrmLojas((prev) => {
      const itemAtual = prev[lojaId] || { status: 'nao_abordado' };
      const atualizado: Record<string, LojaCrmData> = {
        ...prev,
        [lojaId]: {
          ...itemAtual,
          observacoes,
          dataAtualizacao: new Date().toISOString()
        }
      };
      salvarCrmData(atualizado);
      return atualizado;
    });
  };

  // Tag CRUD Handlers
  const handleAdicionarTag = (box: StatusAbordagem, nome: string) => {
    const novaTag: TagItem = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome,
      subTags: []
    };
    const novasTags = {
      ...tagsPorBox,
      [box]: [...tagsPorBox[box], novaTag]
    };
    salvarTagsData(novasTags);
  };

  const handleEditarTag = (box: StatusAbordagem, tagId: string, novoNome: string) => {
    const novasTags = {
      ...tagsPorBox,
      [box]: tagsPorBox[box].map((t) => (t.id === tagId ? { ...t, nome: novoNome } : t))
    };
    salvarTagsData(novasTags);
  };

  const handleExcluirTag = (box: StatusAbordagem, tagId: string) => {
    const novasTags = {
      ...tagsPorBox,
      [box]: tagsPorBox[box].filter((t) => t.id !== tagId)
    };
    salvarTagsData(novasTags);

    // Reset stores that were in this tag to have no tag
    setCrmLojas((prev) => {
      let mudou = false;
      const copia = { ...prev };
      Object.keys(copia).forEach((id) => {
        if (copia[id].tagId === tagId) {
          copia[id] = { ...copia[id], tagId: null, subTagId: null };
          mudou = true;
        }
      });
      if (mudou) salvarCrmData(copia);
      return copia;
    });
  };

  const handleAdicionarSubTag = (box: StatusAbordagem, tagId: string, nomeSubTag: string) => {
    const novaSub: { id: string; nome: string } = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome: nomeSubTag
    };
    const novasTags = {
      ...tagsPorBox,
      [box]: tagsPorBox[box].map((t) =>
        t.id === tagId ? { ...t, subTags: [...t.subTags, novaSub] } : t
      )
    };
    salvarTagsData(novasTags);
  };

  const handleEditarSubTag = (
    box: StatusAbordagem,
    tagId: string,
    subTagId: string,
    novoNome: string
  ) => {
    const novasTags = {
      ...tagsPorBox,
      [box]: tagsPorBox[box].map((t) =>
        t.id === tagId
          ? {
              ...t,
              subTags: t.subTags.map((s) => (s.id === subTagId ? { ...s, nome: novoNome } : s))
            }
          : t
      )
    };
    salvarTagsData(novasTags);
  };

  const handleExcluirSubTag = (box: StatusAbordagem, tagId: string, subTagId: string) => {
    const novasTags = {
      ...tagsPorBox,
      [box]: tagsPorBox[box].map((t) =>
        t.id === tagId
          ? {
              ...t,
              subTags: t.subTags.filter((s) => s.id !== subTagId)
            }
          : t
      )
    };
    salvarTagsData(novasTags);

    // Reset subTagId in stores that had it
    setCrmLojas((prev) => {
      let mudou = false;
      const copia = { ...prev };
      Object.keys(copia).forEach((id) => {
        if (copia[id].subTagId === subTagId) {
          copia[id] = { ...copia[id], subTagId: null };
          mudou = true;
        }
      });
      if (mudou) salvarCrmData(copia);
      return copia;
    });
  };

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

  // Load saved favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lojas_favoritas');
      if (saved) {
        setFavoritos(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Erro ao carregar favoritos:', e);
    }
  }, []);

  const toggleFavorito = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const novosFavoritos = favoritos.includes(id)
      ? favoritos.filter((favId) => favId !== id)
      : [...favoritos, id];

    setFavoritos(novosFavoritos);
    try {
      localStorage.setItem('lojas_favoritas', JSON.stringify(novosFavoritos));
    } catch (err) {
      console.error('Erro ao salvar favoritos:', err);
    }
  };

  const obterLocalizacao = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setObtendoGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setObtendoGPS(false);
      },
      (error) => {
        console.error(error);
        setGpsError('Não foi possível obter sua localização. Verifique as permissões de GPS.');
        setObtendoGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Active City Info
  const cidadeAtiva = useMemo(() => {
    if (cidadeSelecionadaId === 'todas') return null;
    return cidades.find((c) => c.id === cidadeSelecionadaId) || cidades[0];
  }, [cidadeSelecionadaId]);

  // Count stores per city
  const contagemPorCidade = useMemo(() => {
    const counts: Record<string, number> = {};
    lojas.forEach((l) => {
      counts[l.cidadeId] = (counts[l.cidadeId] || 0) + 1;
    });
    return counts;
  }, []);

  // Cities grouped by region
  const cidadesPorRegiao = useMemo(() => {
    const grupos: Record<string, typeof cidades> = {
      'Norte': [],
      'Nordeste': [],
      'Sudeste': [],
      'Centro-Oeste': [],
      'Sul': []
    };
    cidades.forEach((c) => {
      if (grupos[c.regiao]) {
        grupos[c.regiao].push(c);
      }
    });
    return grupos;
  }, []);

  // Distinct neighborhoods available for selected city
  const bairrosDisponiveis = useMemo(() => {
    const lojasBase =
      cidadeSelecionadaId === 'todas'
        ? lojas
        : lojas.filter((l) => l.cidadeId === cidadeSelecionadaId);
    const bairrosSet = new Set(lojasBase.map((l) => l.bairro).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(bairrosSet).sort()];
  }, [cidadeSelecionadaId]);

  // Reset neighborhood when city changes
  const handleCityChange = (novoId: string) => {
    setCidadeSelecionadaId(novoId);
    setBairroFiltro('Todos');
    setSelectedLojaId(null);
  };

  // Process store list with calculated distance
  let lojasProcessadas: Loja[] = useMemo(() => {
    return lojas.map((loja) => {
      const distancia = userLocation
        ? calcularDistancia(userLocation.lat, userLocation.lng, loja.lat, loja.lng)
        : undefined;

      return { ...loja, distancia };
    });
  }, [userLocation]);

  // Filter stores
  const lojasFiltradas = useMemo(() => {
    let result = lojasProcessadas.filter((loja) => {
      // City check
      if (cidadeSelecionadaId !== 'todas' && loja.cidadeId !== cidadeSelecionadaId) {
        return false;
      }

      // Search check
      const termo = busca.toLowerCase().trim();
      if (termo) {
        const atende =
          loja.nome.toLowerCase().includes(termo) ||
          loja.descricao.toLowerCase().includes(termo) ||
          loja.endereco.toLowerCase().includes(termo) ||
          loja.cidade.toLowerCase().includes(termo) ||
          (loja.bairro && loja.bairro.toLowerCase().includes(termo)) ||
          loja.destaques.some((d) => d.toLowerCase().includes(termo));
        if (!atende) return false;
      }

      // Category check
      if (categoriaAtiva !== 'Todas' && loja.categoria !== categoriaAtiva) {
        return false;
      }

      // Neighborhood check
      if (bairroFiltro !== 'Todos' && loja.bairro !== bairroFiltro) {
        return false;
      }

      // Favorites check
      if (apenasFavoritos && !favoritos.includes(loja.id)) {
        return false;
      }

      return true;
    });

    // Proximity sorting if GPS active
    if (userLocation) {
      result.sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
    }

    return result;
  }, [lojasProcessadas, cidadeSelecionadaId, busca, categoriaAtiva, bairroFiltro, apenasFavoritos, favoritos, userLocation]);

  const limparFiltros = () => {
    setBusca('');
    setCategoriaAtiva('Todas');
    setBairroFiltro('Todos');
    setApenasFavoritos(false);
    setSelectedLojaId(null);
  };

  const handleLojaClick = (lojaId: string) => {
    setSelectedLojaId(lojaId);
    // Smooth scroll to map on mobile if clicked
    const mapElement = document.getElementById('mapa-section');
    if (mapElement && window.innerWidth < 768) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-stone-50 to-emerald-50/40 text-slate-800 antialiased">
      {/* Top Banner / Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-xl shrink-0">
              🌿
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-emerald-950 leading-tight flex items-center gap-2">
                Ervas & Produtos Naturais
              </h1>
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 inline text-emerald-600" /> Guia Nacional & Gestão de Abordagens
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Tab Switcher */}
            <div className="flex items-center bg-emerald-100/70 p-1 rounded-xl border border-emerald-200 shadow-2xs">
              <button
                type="button"
                id="tab-guia-mapa"
                onClick={() => setAbaAtiva('guia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  abaAtiva === 'guia'
                    ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-300'
                    : 'text-emerald-900 hover:bg-white/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>Guia & Mapa</span>
              </button>

              <button
                type="button"
                id="tab-gestao-abordagens"
                onClick={() => setAbaAtiva('gestao')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  abaAtiva === 'gestao'
                    ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-300'
                    : 'text-emerald-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Gestão (CRM)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 font-extrabold">
                  3 Boxes
                </span>
              </button>
            </div>

            {/* Quick City Selector Dropdown in Header */}
            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <label htmlFor="select-cidade-header" className="sr-only">Selecionar Cidade</label>
              <select
                id="select-cidade-header"
                value={cidadeSelecionadaId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full sm:w-auto text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
              >
                <option value="todas">🌍 Todas ({lojas.length})</option>
                {(['Norte', 'Nordeste', 'Sudeste', 'Centro-Oeste', 'Sul'] as const).map((reg) => (
                  <optgroup key={reg} label={`Região ${reg}`}>
                    {(cidadesPorRegiao[reg] || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        📍 {c.nome} - {c.uf} ({contagemPorCidade[c.id] || 0})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Saved Favorites Trigger */}
            <button
              id="btn-header-favoritos"
              onClick={() => setApenasFavoritos(!apenasFavoritos)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
                apenasFavoritos
                  ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs ring-2 ring-rose-200'
                  : 'bg-white text-emerald-800 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${apenasFavoritos ? 'fill-rose-500 text-rose-500' : 'text-emerald-700'}`} />
              <span>({favoritos.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {abaAtiva === 'gestao' ? (
          <GestaoAbordagens
            cidades={cidades}
            cidadesPorRegiao={cidadesPorRegiao}
            todasLojas={lojasProcessadas}
            cidadeSelecionadaId={cidadeSelecionadaId}
            onSelecionarCidade={(id) => handleCityChange(id)}
            crmLojas={crmLojas}
            tagsPorBox={tagsPorBox}
            onUpdateStatusLoja={handleUpdateStatusLoja}
            onUpdateTagLoja={handleUpdateTagLoja}
            onUpdateObservacaoLoja={handleUpdateObservacaoLoja}
            onAdicionarTag={handleAdicionarTag}
            onEditarTag={handleEditarTag}
            onExcluirTag={handleExcluirTag}
            onAdicionarSubTag={handleAdicionarSubTag}
            onEditarSubTag={handleEditarSubTag}
            onExcluirSubTag={handleExcluirSubTag}
          />
        ) : (
          <>
            {/* City Selector Bar Grouped by Region (Collapsible / Retrátil) */}
        <section className="bg-white rounded-2xl shadow-sm border border-emerald-100/90 overflow-hidden transition-all duration-300">
          {/* Header click bar (abre / fecha) */}
          <div
            id="toggle-box-cidades"
            role="button"
            tabIndex={0}
            onClick={() => setBoxCidadesAberto(!boxCidadesAberto)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setBoxCidadesAberto(!boxCidadesAberto);
              }
            }}
            aria-expanded={boxCidadesAberto}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-emerald-50/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Cidades por Região
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-full border border-emerald-200">
                    {cidades.length} cidades
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {boxCidadesAberto
                    ? 'Clique para recolher o painel de cidades'
                    : 'Clique para abrir e navegar por cidades e regiões'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
              <button
                id="btn-ver-todas-cidades"
                type="button"
                onClick={() => {
                  handleCityChange('todas');
                  setRegiaoFiltro('Todas');
                }}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                  cidadeSelecionadaId === 'todas'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                🌍 Ver Todas ({lojas.length})
              </button>

              {cidadeAtiva && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-200">
                  <span>📍 {cidadeAtiva.nome} ({cidadeAtiva.uf})</span>
                  <span className="text-emerald-600 font-normal hidden sm:inline">• {cidadeAtiva.regiao}</span>
                </span>
              )}

              {/* Toggle Button */}
              <button
                id="btn-toggle-recolher-cidades"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBoxCidadesAberto(!boxCidadesAberto);
                }}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-1.5 text-xs font-semibold"
                title={boxCidadesAberto ? 'Recolher painel de cidades' : 'Abrir painel de cidades'}
              >
                <span className="hidden sm:inline">
                  {boxCidadesAberto ? 'Recolher' : 'Expandir'}
                </span>
                {boxCidadesAberto ? (
                  <ChevronUp className="w-4 h-4 text-emerald-700" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-emerald-700" />
                )}
              </button>
            </div>
          </div>

          {/* Retractable Body */}
          {boxCidadesAberto && (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 space-y-4 border-t border-emerald-50 animate-in fade-in duration-200">
              {/* Region Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                  Região:
                </span>
                {REGIOES.map((reg) => {
                  const isRegiaoAtiva = regiaoFiltro === reg.id;
                  const countCidades = reg.id === 'Todas' ? cidades.length : (cidadesPorRegiao[reg.id]?.length || 0);

                  return (
                    <button
                      key={reg.id}
                      id={`tab-regiao-${reg.id.toLowerCase()}`}
                      onClick={() => setRegiaoFiltro(reg.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isRegiaoAtiva
                          ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-transparent'
                      }`}
                    >
                      <span>{reg.icone}</span>
                      <span>{reg.nome}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isRegiaoAtiva ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-200/80 text-slate-600'
                      }`}>
                        {countCidades}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grouped City Cards by Region */}
              <div className="space-y-3 pt-1">
                {(['Norte', 'Nordeste', 'Sudeste', 'Centro-Oeste', 'Sul'] as const)
                  .filter((reg) => regiaoFiltro === 'Todas' || regiaoFiltro === reg)
                  .map((reg) => {
                    const cidadesDoGrupo = cidadesPorRegiao[reg] || [];
                    if (cidadesDoGrupo.length === 0) return null;

                    const iconeRegiao = REGIOES.find((r) => r.id === reg)?.icone || '📍';
                    const totalLojasRegiao = cidadesDoGrupo.reduce(
                      (acc, c) => acc + (contagemPorCidade[c.id] || 0),
                      0
                    );

                    return (
                      <div
                        key={reg}
                        className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                            <span>{iconeRegiao}</span>
                            <span>Região {reg}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200 shadow-2xs">
                              {cidadesDoGrupo.length} {cidadesDoGrupo.length === 1 ? 'cidade' : 'cidades'} • {totalLojasRegiao} locais
                            </span>
                          </h3>
                        </div>

                        {/* City Chips in this Region */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {cidadesDoGrupo.map((c) => {
                            const count = contagemPorCidade[c.id] || 0;
                            const isSelected = cidadeSelecionadaId === c.id;

                            return (
                              <button
                                key={c.id}
                                id={`pill-cidade-${c.id}`}
                                onClick={() => handleCityChange(c.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white shadow-xs font-semibold ring-2 ring-emerald-600/40 scale-[1.02]'
                                    : 'bg-white text-emerald-950 hover:bg-emerald-100/80 border border-emerald-100 hover:border-emerald-200 shadow-2xs'
                                }`}
                              >
                                <span>{c.nome}</span>
                                <span className={`text-[10px] font-semibold px-1 rounded-sm ${
                                  isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-50 text-emerald-800'
                                }`}>
                                  {c.uf}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-800 font-bold'
                                }`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Active City Botanical Description */}
              {cidadeAtiva && (
                <div className="text-xs text-emerald-900 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-3 rounded-xl border border-emerald-200/80 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-base shrink-0 mt-0.5">🌿</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-950 flex items-center gap-2">
                      <span>Tradição & Botânica em {cidadeAtiva.nome} ({cidadeAtiva.uf})</span>
                      <span className="text-[10px] font-normal text-emerald-700 px-2 py-0.5 bg-white/80 rounded-full border border-emerald-200">
                        Região {cidadeAtiva.regiao}
                      </span>
                    </p>
                    <p className="text-emerald-800/90 leading-relaxed">{cidadeAtiva.descricao}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Map Section */}
        <section id="mapa-section" className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" /> Mapa de Estabelecimentos ({lojasFiltradas.length} encontrados)
            </h3>
            {selectedLojaId && (
              <button
                onClick={() => setSelectedLojaId(null)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 underline"
              >
                Limpar seleção de foco
              </button>
            )}
          </div>
          <Mapa
            lojas={lojasFiltradas}
            cidadeAtiva={cidadeAtiva}
            selectedLojaId={selectedLojaId}
            onSelectLoja={(id) => setSelectedLojaId(id)}
            userLocation={userLocation}
          />
        </section>

        {/* Search and Filters */}
        <section className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-emerald-100/90">
          {/* Search bar & GPS Action */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
              <input
                id="search-input"
                type="text"
                placeholder={
                  cidadeAtiva
                    ? `Buscar em ${cidadeAtiva.nome} (ex: chás, mastruz, castanha, banhos)...`
                    : 'Buscar por nome, cidade, produto ou endereço...'
                }
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50/60 border border-emerald-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 transition-all"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              id="btn-obter-gps"
              onClick={obterLocalizacao}
              disabled={obtendoGPS}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs shrink-0 ${
                userLocation
                  ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-semibold'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
              }`}
            >
              <LocateFixed className={`w-4 h-4 ${obtendoGPS ? 'animate-spin' : ''}`} />
              {obtendoGPS
                ? 'Obtendo GPS...'
                : userLocation
                ? '✓ GPS Ativo (Por distância)'
                : 'Calcular por proximidade'}
            </button>
          </div>

          {gpsError && (
            <div className="p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <span>⚠️ {gpsError}</span>
              <button onClick={() => setGpsError(null)} className="text-amber-900 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Category and Neighborhood Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Categoria:
              </span>
              {['Todas', 'Ervas & Plantas', 'Empórios & Granel', 'Produtos Naturais'].map((cat) => (
                <button
                  key={cat}
                  id={`cat-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                    categoriaAtiva === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {cat === 'Ervas & Plantas' && '🌿 '}
                  {cat === 'Empórios & Granel' && '🌾 '}
                  {cat === 'Produtos Naturais' && '🍃 '}
                  {cat}
                </button>
              ))}
            </div>

            {/* Neighborhood Dropdown Scoped to Active City */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Bairro:</span>
              <select
                id="bairro-select"
                value={bairroFiltro}
                onChange={(e) => setBairroFiltro(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {bairrosDisponiveis.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* GPS Proximity Feedback Notice */}
        {userLocation && (
          <div className="flex items-center justify-between gap-2 text-xs text-emerald-900 bg-emerald-100/80 px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Resultados ordenados da <strong>menor para a maior distância</strong> da sua posição atual.
              </span>
            </div>
            <button
              onClick={() => setUserLocation(null)}
              className="text-emerald-800 hover:text-emerald-950 underline font-medium text-[11px] shrink-0"
            >
              Desativar GPS
            </button>
          </div>
        )}

        {/* Active Filters Summary Header */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {cidadeAtiva ? `Empreendimentos em ${cidadeAtiva.nome} (${cidadeAtiva.uf})` : 'Todos os empreendimentos'}
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
              {lojasFiltradas.length} {lojasFiltradas.length === 1 ? 'local' : 'locais'}
            </span>
          </div>

          {(busca || categoriaAtiva !== 'Todas' || bairroFiltro !== 'Todos' || apenasFavoritos) && (
            <button
              id="btn-limpar-filtros"
              onClick={limparFiltros}
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-1 text-xs"
            >
              Limpar filtros ativos
            </button>
          )}
        </div>

        {/* Stores Grid */}
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {lojasFiltradas.map((loja) => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${loja.nome} ${loja.endereco}`
            )}`;
            const isFavorito = favoritos.includes(loja.id);
            const isSelected = selectedLojaId === loja.id;

            const crm = crmLojas[loja.id];
            const status: StatusAbordagem = crm?.status || 'nao_abordado';
            const tag = tagsPorBox[status]?.find((t) => t.id === crm?.tagId);
            const subTag = tag?.subTags.find((s) => s.id === crm?.subTagId);
            const temObs = Boolean(crm?.observacoes && crm.observacoes.trim().length > 0);

            return (
              <div
                key={loja.id}
                id={`card-loja-${loja.id}`}
                onClick={() => handleLojaClick(loja.id)}
                className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                    : 'border-emerald-100 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 pr-9">
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-emerald-900">
                      {loja.nome}
                    </h2>
                  </div>

                  {/* Favorite Toggle Button */}
                  <button
                    id={`btn-fav-${loja.id}`}
                    onClick={(e) => toggleFavorito(loja.id, e)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                    title={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform active:scale-125 ${
                        isFavorito
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-300 hover:text-rose-400'
                      }`}
                    />
                  </button>

                  {/* CRM Status & Tag Row + OBS. Button */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          status === 'abordado'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : status === 'negou'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {status === 'abordado'
                          ? '🟢 Abordado'
                          : status === 'negou'
                          ? '🔴 Negou'
                          : '⚪ Não Abordado'}
                      </span>

                      {tag && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 flex items-center gap-1">
                          <TagIcon className="w-2.5 h-2.5 text-emerald-600" />
                          {tag.nome}
                          {subTag ? ` › ${subTag.nome}` : ''}
                        </span>
                      )}
                    </div>

                    {/* OBS. Button */}
                    <button
                      type="button"
                      id={`btn-obs-card-${loja.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLojaObsModal(loja);
                      }}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                        temObs
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <FileText className={`w-3 h-3 ${temObs ? 'text-amber-700' : 'text-slate-400'}`} />
                      <span>{temObs ? 'OBS. 📝' : 'OBS.'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        loja.categoria === 'Ervas & Plantas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : loja.categoria === 'Produtos Naturais'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {loja.categoria === 'Ervas & Plantas' ? (
                        <>
                          <Leaf className="w-3 h-3" /> Ervas & Plantas
                        </>
                      ) : loja.categoria === 'Produtos Naturais' ? (
                        <>
                          <Sparkles className="w-3 h-3" /> Produtos Naturais
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3" /> Empórios & Granel
                        </>
                      )}
                    </span>

                    <span className="text-xs text-slate-600 font-semibold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {loja.bairro ? `${loja.bairro}, ` : ''}{loja.cidade} - {loja.uf}
                    </span>

                    {loja.distancia !== undefined && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        📍 {loja.distancia} km
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                    {loja.descricao}
                  </p>

                  <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                    <span className="font-semibold text-slate-700 shrink-0">Endereço:</span> {loja.endereco}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-500">
                    {loja.horario && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{loja.horario}</span>
                      </span>
                    )}

                    {loja.telefone && (
                      <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 rounded-lg p-1 pr-2">
                        <a
                          href={`https://wa.me/${formatarNumeroParaWhatsapp(loja.telefone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Clique para abrir conversa no WhatsApp"
                          className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold px-1.5 py-0.5 rounded hover:bg-emerald-100/70 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                          <span>{loja.telefone}</span>
                          <span className="text-[10px] bg-emerald-600 text-white px-1 py-0.2 rounded font-medium ml-0.5">WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          id={`btn-copiar-${loja.id}`}
                          onClick={(e) => copiarNumero(loja.telefone, loja.id, e)}
                          title="Copiar número de telefone"
                          className="flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded shadow-2xs transition-all active:scale-95"
                        >
                          {copiadoId === loja.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 font-bold" />
                              <span className="text-emerald-700 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Preview of OBS note if present */}
                  {temObs && (
                    <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 leading-tight">
                      <span className="font-bold">📝 OBS:</span> {crm!.observacoes}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Status Action Buttons (Não Abordado, Abordado, Negou) */}
                  <div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        id={`btn-card-status-nao-${loja.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatusLoja(loja.id, 'nao_abordado');
                        }}
                        className={`py-1.5 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          status === 'nao_abordado'
                            ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        Não Abordado
                      </button>

                      <button
                        type="button"
                        id={`btn-card-status-ab-${loja.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatusLoja(loja.id, 'abordado');
                        }}
                        className={`py-1.5 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          status === 'abordado'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        Abordado
                      </button>

                      <button
                        type="button"
                        id={`btn-card-status-neg-${loja.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatusLoja(loja.id, 'negou');
                        }}
                        className={`py-1.5 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          status === 'negou'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
                        }`}
                      >
                        Negou
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {loja.destaques.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLojaClick(loja.id);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      Focar no Mapa
                    </button>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Como Chegar
                      <ExternalLink className="w-3 h-3 opacity-75" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {lojasFiltradas.length === 0 && (
          <div className="text-center py-14 px-4 bg-white rounded-2xl border border-emerald-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              🌿
            </div>
            <h3 className="font-bold text-slate-800 text-base">Nenhum local encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Nenhuma loja corresponde aos filtros selecionados{cidadeAtiva ? ` em ${cidadeAtiva.nome}` : ''}. Tente buscar por outros termos ou limpar os filtros.
            </p>
            <button
              onClick={limparFiltros}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Limpar filtros e ver todas as lojas
            </button>
          </div>
        )}
          </>
        )}

        {/* Global Observation Modal */}
        <ModalObservacoes
          loja={lojaObsModal}
          crmData={lojaObsModal ? crmLojas[lojaObsModal.id] : undefined}
          isOpen={Boolean(lojaObsModal)}
          onClose={() => setLojaObsModal(null)}
          onSave={handleUpdateObservacaoLoja}
        />

        {/* Footer Info */}
        <footer className="text-center pt-8 pb-4 text-xs text-slate-400 space-y-1">
          <p>Guia Nacional & Gestão de Prospecção de Produtos Naturais, Ervanárias & Empórios</p>
          <p>Selecione sua cidade para gerenciar abordagens, organizar tags e registrar anotações.</p>
        </footer>
      </main>
    </div>
  );
}
