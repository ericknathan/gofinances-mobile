import { renderHook, act } from '@testing-library/react-hooks';
import { mocked } from 'jest-mock';
import fetchMock from 'jest-fetch-mock';
import { AuthProvider, useAuth } from '../../hooks/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startAsync } from 'expo-auth-session';

fetchMock.enableMocks();

const userExample = {
  id: 'any_id',
  email: 'john.doe@email.com',
  name: 'John Doe',
  photo: 'any_photo.png'
};

jest.mock('expo-auth-session');

describe('Hook: Auth', () => {
  beforeEach(async () => {
     const userCollectionKey = '@gofinances:user';
     await AsyncStorage.removeItem(userCollectionKey);
  });

  it('should be able to sign in with existing Google account', async () => {
    const googleMocked = mocked(startAsync as any);
    googleMocked.mockReturnValueOnce({
      type: 'success',
      params: {
        access_token: 'any_token',
      }
    });
    fetchMock.mockResponseOnce(JSON.stringify(userExample));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(() => result.current.signInWithGoogle());

    expect(result.current.user.email).toBe(userExample.email);
  });

  it('user should not connect if cancel authentication with Google', async () => {
    const googleMocked = mocked(startAsync as any);
    googleMocked.mockReturnValueOnce({
      type: 'cancel'
    });
    fetchMock.mockResponseOnce(JSON.stringify(userExample));
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(() => result.current.signInWithGoogle());

    expect(result.current.user).not.toHaveProperty(userExample.id);
  });

  it('should throw error with incorrectly Google parameters', async () => {
    const { result } = renderHook(() => useAuth());
    fetchMock.mockResponseOnce(JSON.stringify(userExample));

    try {
      await act(() => result.current.signInWithGoogle());
    } catch {
      expect(result.current.user).toEqual(undefined);
    }
  });
});