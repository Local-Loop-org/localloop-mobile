import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { RadiusMapPicker } from './RadiusMapPicker';

// A region whose center differs from the user's real location — stands in for
// the initial fallback (Curitiba) region the native MapView reports on mount.
const FALLBACK_REGION = {
  latitude: -25.4284,
  longitude: -49.2733,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const PICKED_REGION = {
  latitude: -23.55,
  longitude: -46.63,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function setup(overrides = {}) {
  const onAnchorChange = jest.fn();
  const utils = render(
    <RadiusMapPicker
      radiusKm={2}
      anchor={null}
      interactive
      onAnchorChange={onAnchorChange}
      {...overrides}
    />,
  );
  const map = utils.getByTestId('radius-map');
  const frame = utils.getByTestId('radius-map-frame');
  const emitRegion = (region: typeof FALLBACK_REGION) =>
    act(() => map.props.onRegionChangeComplete(region));
  const touch = () => fireEvent(frame, 'touchStart');
  return { onAnchorChange, emitRegion, touch };
}

describe('RadiusMapPicker anchor reporting', () => {
  it('does NOT report the initial/fallback region before any user touch', () => {
    const { onAnchorChange, emitRegion } = setup();
    // Native MapView settling on its initial fallback region must not be
    // mistaken for an explicit pick.
    emitRegion(FALLBACK_REGION);
    expect(onAnchorChange).not.toHaveBeenCalled();
  });

  it('reports the center as a pick once the user has touched the map', () => {
    const { onAnchorChange, emitRegion, touch } = setup();
    touch();
    emitRegion(PICKED_REGION);
    expect(onAnchorChange).toHaveBeenCalledWith({ lat: -23.55, lng: -46.63 });
  });

  it('never reports a pick when not interactive', () => {
    const { onAnchorChange, emitRegion, touch } = setup({ interactive: false });
    touch();
    emitRegion(PICKED_REGION);
    expect(onAnchorChange).not.toHaveBeenCalled();
  });
});
