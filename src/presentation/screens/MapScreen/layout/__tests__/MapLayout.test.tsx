import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AnchorType, GroupPrivacy } from '@localloop/shared-types';
import MapLayout from '../index';
import type { MapLayoutProps } from '../types';
import type { MapPinData } from '../../types';

const PINS: MapPinData[] = [
  {
    id: 'agua-verde',
    name: 'Água verde',
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceLabel: 'aqui',
    memberCount: 12,
    liveCount: 4,
    privacy: GroupPrivacy.OPEN,
    lastMessage: 'Caminhada às 18h?',
    x: 0.39,
    y: 0.37,
  },
  {
    id: 'ibira',
    name: 'Lago Ibirá',
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceLabel: '120m',
    memberCount: 24,
    liveCount: 9,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    lastMessage: 'Pedala amanhã 7h',
    x: 0.68,
    y: 0.49,
  },
];

function renderLayout(overrides: Partial<MapLayoutProps> = {}) {
  const props: MapLayoutProps = {
    pins: PINS,
    filter: 'all',
    selectedId: null,
    radiusKm: 0.5,
    search: '',
    topInset: 47,
    bottomInset: 34,
    onChangeFilter: jest.fn(),
    onSelectPin: jest.fn(),
    onChangeRadius: jest.fn(),
    onChangeSearch: jest.fn(),
    onRecenter: jest.fn(),
    onCreate: jest.fn(),
    onMyGroups: jest.fn(),
    onPressJoin: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<MapLayout {...props} />) };
}

describe('MapLayout', () => {
  it('renders a pin per group and the category chips', () => {
    const { getByTestId } = renderLayout();
    expect(getByTestId('map-pin-agua-verde')).toBeTruthy();
    expect(getByTestId('map-pin-ibira')).toBeTruthy();
    expect(getByTestId('filter-chip-all')).toBeTruthy();
    expect(getByTestId(`filter-chip-${AnchorType.NEIGHBORHOOD}`)).toBeTruthy();
  });

  it('selects a pin when its marker is pressed', () => {
    const { props, getByTestId } = renderLayout();
    fireEvent.press(getByTestId('map-pin-ibira'));
    expect(props.onSelectPin).toHaveBeenCalledWith('ibira');
  });

  it('changes the filter when a category chip is pressed', () => {
    const { props, getByTestId } = renderLayout();
    fireEvent.press(getByTestId(`filter-chip-${AnchorType.ESTABLISHMENT}`));
    expect(props.onChangeFilter).toHaveBeenCalledWith(AnchorType.ESTABLISHMENT);
  });

  it('shows the selected-pin card only when a pin is selected', () => {
    const { queryByTestId } = renderLayout({ selectedId: null });
    expect(queryByTestId('map-selected-card')).toBeNull();

    const { getByTestId, getByText } = renderLayout({ selectedId: 'ibira' });
    expect(getByTestId('map-selected-card')).toBeTruthy();
    expect(getByText('Lago Ibirá')).toBeTruthy();
    expect(getByText('Pedir')).toBeTruthy();
  });
});
