import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from './index';
import { useAuthLogin } from '@/application/hooks/useAuthLogin';

jest.mock('@/application/hooks/useAuthLogin', () => ({
  useAuthLogin: jest.fn(),
}));

const mockedUseAuthLogin = useAuthLogin as jest.MockedFunction<typeof useAuthLogin>;

describe('LoginScreen', () => {
  const handleGoogleLogin = jest.fn();
  const handleAppleLogin = jest.fn();

  beforeEach(() => {
    handleGoogleLogin.mockReset();
    handleAppleLogin.mockReset();
    mockedUseAuthLogin.mockReturnValue({
      loading: false,
      handleGoogleLogin,
      handleAppleLogin,
    });
  });

  it('renders Google and Apple buttons when not loading', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Continuar com Google')).toBeTruthy();
    expect(getByText('Continuar com Apple')).toBeTruthy();
  });

  it('dispatches handleGoogleLogin when the Google button is pressed', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Continuar com Google'));
    expect(handleGoogleLogin).toHaveBeenCalledTimes(1);
  });

  it('dispatches handleAppleLogin when the Apple button is pressed', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Continuar com Apple'));
    expect(handleAppleLogin).toHaveBeenCalledTimes(1);
  });

  it('hides the buttons and shows a loader while loading', () => {
    mockedUseAuthLogin.mockReturnValue({
      loading: true,
      handleGoogleLogin,
      handleAppleLogin,
    });

    const { queryByText, UNSAFE_getByType } = render(<LoginScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('Continuar com Google')).toBeNull();
    expect(queryByText('Continuar com Apple')).toBeNull();
  });
});
