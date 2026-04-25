/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `locallooptest://${path}`),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 0, longitude: 0 },
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
      getSession: jest.fn(),
    },
  })),
}));

jest.mock('react-native-url-polyfill/auto', () => ({}), { virtual: true });

jest.mock('react-native-svg', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const Stub = ({ children }: { children?: React.ReactNode }) =>
    ReactLib.createElement(View, null, children);
  return {
    __esModule: true,
    default: Stub,
    Svg: Stub,
    Path: Stub,
    Circle: Stub,
    Rect: Stub,
    G: Stub,
  };
});

jest.mock('expo-linear-gradient', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({
    children,
    style,
  }: {
    children?: React.ReactNode;
    style?: unknown;
  }) => ReactLib.createElement(View, { style }, children);
  return { LinearGradient };
});
