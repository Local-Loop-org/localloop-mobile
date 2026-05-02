import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { DmPermission, Provider } from '@localloop/shared-types';
import OnboardingScreen from './index';
import { useAuthStore } from '@/application/stores/auth.store';
import { userApi } from '@/infra/api/user.api';

jest.mock('@/infra/api/user.api', () => ({
  userApi: {
    updateProfile: jest.fn(),
    updateLocation: jest.fn(),
  },
}));

const resetStore = () =>
  useAuthStore.setState({
    user: {
      id: 'user-1',
      providerId: 'provider-1',
      provider: Provider.GOOGLE,
      displayName: '',
      avatarUrl: null,
      geohash: null,
      dmPermission: DmPermission.MEMBERS,
      isActive: true,
      lastSeenAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    },
    accessToken: 'access',
    refreshToken: 'refresh',
    isAuthenticated: true,
    isNewUser: true,
  });

const mockedUpdateProfile = userApi.updateProfile as jest.MockedFunction<
  typeof userApi.updateProfile
>;
const mockedUpdateLocation = userApi.updateLocation as jest.MockedFunction<
  typeof userApi.updateLocation
>;

describe('OnboardingScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: -23.5505, longitude: -46.6333 },
    });
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

  it('calls both user APIs, persists displayName, and flips isNewUser on success', async () => {
    mockedUpdateProfile.mockResolvedValue({
      id: 'user-1',
      displayName: 'Alice',
      avatarUrl: null,
      dmPermission: DmPermission.MEMBERS,
      provider: Provider.GOOGLE,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    mockedUpdateLocation.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText('Seu nome ou apelido'), 'Alice');
    await act(async () => {
      fireEvent.press(getByText('Permitir Localização 📍'));
    });
    await waitFor(() =>
      expect(getByText('Localização Concedida! ✅')).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByText('Começar a Explorar'));
    });

    expect(mockedUpdateProfile).toHaveBeenCalledWith({ displayName: 'Alice' });
    expect(mockedUpdateLocation).toHaveBeenCalledWith({
      lat: -23.5505,
      lng: -46.6333,
    });

    const state = useAuthStore.getState();
    expect(state.isNewUser).toBe(false);
    expect(state.user?.displayName).toBe('Alice');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('alerts and keeps isNewUser true when the profile API fails', async () => {
    mockedUpdateProfile.mockRejectedValue(new Error('network'));
    mockedUpdateLocation.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText('Seu nome ou apelido'), 'Alice');
    await act(async () => {
      fireEvent.press(getByText('Permitir Localização 📍'));
    });
    await waitFor(() =>
      expect(getByText('Localização Concedida! ✅')).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(getByText('Começar a Explorar'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível salvar seu perfil. Tente novamente.',
    );
    expect(useAuthStore.getState().isNewUser).toBe(true);
  });
});
