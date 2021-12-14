import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect
} from 'react';

import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProviderProps {
  children: ReactNode
}

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface AuthContextData {
  user: User;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  signOut(): Promise<void>;
  userStorageLoading: boolean;
}

interface AuthorizationResponse {
  params: {
    access_token: string;
  };
  type: string;
}

const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User);  
  const [userStorageLoading, setUserStorageLoading] = useState(true);

  const userStorageKey = '@gofinances:user';

  async function signInWithGoogle() {
    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
      const RESPONSE_TYPE = 'token';
      const SCOPE = encodeURI('profile email');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;

      const { type, params } = await AuthSession.startAsync({ authUrl }) as AuthorizationResponse;
      if(type === 'success') {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`);
        const userInfo = await response.json();

        const loggedUser = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.given_name,
          photo: userInfo.picture
        }

        setUser(loggedUser);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(loggedUser));

        console.log(user);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ]
      });

      const name = credential.fullName!.givenName!;
      const photo = `https://ui-avatars.com/api/?name=${name}&length=1`
      if(credential) {
        const loggedUser = {
          id: credential.user,
          email: credential.email!,
          name,
          photo
        };

        setUser(loggedUser);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(loggedUser));
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async function signOut() {
    setUser({} as User);
    await AsyncStorage.removeItem(userStorageKey);
  }

  useEffect(() => {
    async function loadStoredUserData() {
      const storedUser = await AsyncStorage.getItem(userStorageKey);
      if(storedUser) setUser(JSON.parse(storedUser) as User);
      setUserStorageLoading(false);
    }

    loadStoredUserData();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      signInWithGoogle,
      signInWithApple,
      signOut,
      userStorageLoading
    }}>
      { children }
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

export { AuthContext, AuthProvider, useAuth }