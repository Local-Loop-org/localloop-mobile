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
    description: null,
    anchorType: AnchorType.NEIGHBORHOOD,
    anchorLabel: 'Bairro',
    distanceMeters: 0,
    privacy: GroupPrivacy.OPEN,
    memberCount: 12,
    myRole: null,
    memberStatus: null,
    liveCount: 4,
    x: 0.39,
    y: 0.37,
  },
  {
    id: 'ibira',
    name: 'Lago Ibirá',
    description: null,
    anchorType: AnchorType.ESTABLISHMENT,
    anchorLabel: 'Estabelecimento',
    distanceMeters: 120,
    privacy: GroupPrivacy.APPROVAL_REQUIRED,
    memberCount: 24,
    myRole: null,
    memberStatus: null,
    liveCount: 9,
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
    onPressGroup: jest.fn(),
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

  it('shows the selected-pin card (discovery row) only when a pin is selected', () => {
    const { queryByText } = renderLayout({ selectedId: null });
    expect(queryByText('Lago Ibirá')).toBeNull();

    const { getByText } = renderLayout({ selectedId: 'ibira' });
    expect(getByText('Lago Ibirá')).toBeTruthy();
    // Approval-required + non-member → "Solicitar" via the shared status badge.
    expect(getByText('Solicitar')).toBeTruthy();
  });
});
