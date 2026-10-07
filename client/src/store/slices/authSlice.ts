import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../storage';

export interface User {
  _id: string;
  username: string;
  email: string;
  personalRate: number;
  role: 'user' | 'manager';
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

// Rehydrate session from localStorage on load so a refresh keeps you signed in
const initialState: AuthState = {
  token: storage.get<string | null>('token', null),
  user: storage.get<User | null>('user', null),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      storage.set('token', action.payload.token);
      storage.set('user', action.payload.user);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      storage.set('user', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      storage.remove('token');
      storage.remove('user');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
