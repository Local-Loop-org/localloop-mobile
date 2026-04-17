import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import OnboardingScreen from './index';
import { useAuthStore } from '@/application/stores/auth.store';

const resetStore = () =>
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: true,
    isNewUser: true,
  });

describe('OnboardingScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('blocks finish when the display name is empty', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Começar a Explorar'));

    expect(alertSpy).toHaveBeenCalledWith('Ops', 'Por favor, insira seu nome.');
    expect(useAuthStore.getState().isNewUser).toBe(true);
  });

  it('blocks finish when the name is shorter than 2 chars', () => {
    const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText('Seu nome ou apelido'), 'A');
    fireEvent.press(getByText('Começar a Explorar'));

    expect(alertSpy).toHaveBeenCalledWith('Ops', 'Por favor, insira seu nome.');
    expect(useAuthStore.getState().isNewUser).toBe(true);
  });

  it('blocks finish when location permission has not been granted', () => {
    const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText('Seu nome ou apelido'), 'Alice');
    fireEvent.press(getByText('Começar a Explorar'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Ops',
      'Por favor, conceda permissão de localização.',
    );
    expect(useAuthStore.getState().isNewUser).toBe(true);
  });

  it('alerts and keeps permission flag false when user denies location', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const { getByText } = render(<OnboardingScreen />);
    await act(async () => {
      fireEvent.press(getByText('Permitir Localização 📍'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Localização',
      'Precisamos da sua localização para mostrar grupos próximos.',
    );
  });

  it('flips isNewUser to false when name is valid and location is granted', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText('Seu nome ou apelido'), 'Alice');
    await act(async () => {
      fireEvent.press(getByText('Permitir Localização 📍'));
    });
    await waitFor(() =>
      expect(getByText('Localização Concedida! ✅')).toBeTruthy(),
    );

    fireEvent.press(getByText('Começar a Explorar'));

    expect(useAuthStore.getState().isNewUser).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
