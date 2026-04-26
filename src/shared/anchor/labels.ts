import { AnchorType } from '@localloop/shared-types';

export const ANCHOR_TYPE_LABELS: Record<AnchorType, string> = {
  [AnchorType.ESTABLISHMENT]: 'Estabelecimento',
  [AnchorType.NEIGHBORHOOD]: 'Bairro',
  [AnchorType.CONDO]: 'Condomínio',
  [AnchorType.EVENT]: 'Evento',
  [AnchorType.CITY]: 'Cidade',
};

/** Plural section labels used by the home discovery sections. */
export const ANCHOR_SECTION_LABELS: Record<AnchorType, string> = {
  [AnchorType.ESTABLISHMENT]: 'Lugares',
  [AnchorType.NEIGHBORHOOD]: 'Bairros',
  [AnchorType.CONDO]: 'Prédios',
  [AnchorType.EVENT]: 'Eventos',
  [AnchorType.CITY]: 'Cidades',
};
