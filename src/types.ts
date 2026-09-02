export type StatusAbordagem = 'nao_abordado' | 'abordado' | 'negou';

export interface SubTag {
  id: string;
  nome: string;
}

export interface TagItem {
  id: string;
  nome: string;
  subTags: SubTag[];
  cor?: string;
}

export interface LojaCrmData {
  status: StatusAbordagem;
  tagId?: string | null;
  subTagId?: string | null;
  observacoes?: string;
  dataAtualizacao?: string;
}

export interface CrmStorage {
  lojas: Record<string, LojaCrmData>; // lojaId -> data
  tagsPorBox: {
    nao_abordado: TagItem[];
    abordado: TagItem[];
    negou: TagItem[];
  };
}
