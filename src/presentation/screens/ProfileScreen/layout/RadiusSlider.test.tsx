import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import RadiusSlider from './RadiusSlider';

type ResponderEventMock = {
  nativeEvent: {
    locationX: number;
  };
};

type PanResponderConfigMock = {
  onPanResponderGrant?: (
    event: ResponderEventMock,
    gestureState: unknown,
  ) => void;
  onPanResponderMove?: (
    event: ResponderEventMock,
    gestureState: unknown,
  ) => void;
  onPanResponderRelease?: (event: ResponderEventMock) => void;
  onPanResponderTerminate?: (event: ResponderEventMock) => void;
};

let mockPanResponderConfig: PanResponderConfigMock | null = null;

jest.mock('react-native', () => {
  const actual = jest.requireActual<typeof import('react-native')>(
    'react-native',
  );
  const panResponder = {
    create: jest.fn((config: PanResponderConfigMock) => {
      mockPanResponderConfig = config;
      return { panHandlers: {} };
    }),
  };

  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === 'PanResponder') {
        return panResponder;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
});

function getPanResponderConfig(): PanResponderConfigMock {
  if (!mockPanResponderConfig) {
    throw new Error('PanResponder config was not created');
  }
  return mockPanResponderConfig;
}

describe('Profile RadiusSlider', () => {
  beforeEach(() => {
    mockPanResponderConfig = null;
  });

  it('updates the draft while dragging and commits only on release', () => {
    const onCommit = jest.fn();

    const { getByLabelText, getByText } = render(
      <RadiusSlider
        value={25}
        onCommit={onCommit}
      />,
    );

    fireEvent(getByLabelText('Raio de descoberta'), 'layout', {
      nativeEvent: { layout: { width: 100 } },
    });

    const config = getPanResponderConfig();
    act(() => {
      config.onPanResponderGrant?.(
        { nativeEvent: { locationX: 10 } },
        {},
      );
      config.onPanResponderMove?.(
        { nativeEvent: { locationX: 50 } },
        {},
      );
    });

    expect(getByText('13 km')).toBeTruthy();
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      config.onPanResponderRelease?.({ nativeEvent: { locationX: 50 } });
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(13);
  });

  it('commits a preset tick immediately', () => {
    const onCommit = jest.fn();

    const { getByLabelText } = render(
      <RadiusSlider
        value={25}
        onCommit={onCommit}
      />,
    );

    fireEvent.press(getByLabelText('Definir raio para 5 km'));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(5);
  });
});
