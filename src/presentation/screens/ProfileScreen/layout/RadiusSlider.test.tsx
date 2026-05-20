import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import RadiusSlider from './RadiusSlider';

type GestureStateMock = {
  x0: number;
  moveX: number;
};

type PanResponderConfigMock = {
  onPanResponderGrant?: (
    event: unknown,
    gestureState: GestureStateMock,
  ) => void;
  onPanResponderMove?: (
    event: unknown,
    gestureState: GestureStateMock,
  ) => void;
  onPanResponderRelease?: () => void;
  onPanResponderTerminate?: () => void;
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
    const onChangeDraft = jest.fn();
    const onCommit = jest.fn();

    const { getByLabelText } = render(
      <RadiusSlider
        value={25}
        onChangeDraft={onChangeDraft}
        onCommit={onCommit}
      />,
    );

    fireEvent(getByLabelText('Raio de descoberta'), 'layout', {
      nativeEvent: { layout: { width: 100 } },
    });

    const config = getPanResponderConfig();
    config.onPanResponderGrant?.({}, { x0: 10, moveX: 10 });
    config.onPanResponderMove?.({}, { x0: 10, moveX: 50 });

    expect(onChangeDraft).toHaveBeenCalledWith(3);
    expect(onChangeDraft).toHaveBeenCalledWith(13);
    expect(onCommit).not.toHaveBeenCalled();

    config.onPanResponderRelease?.();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(13);
  });

  it('commits a preset tick immediately', () => {
    const onChangeDraft = jest.fn();
    const onCommit = jest.fn();

    const { getByLabelText } = render(
      <RadiusSlider
        value={25}
        onChangeDraft={onChangeDraft}
        onCommit={onCommit}
      />,
    );

    fireEvent.press(getByLabelText('Definir raio para 5 km'));

    expect(onChangeDraft).toHaveBeenCalledTimes(1);
    expect(onChangeDraft).toHaveBeenCalledWith(5);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(5);
  });
});
