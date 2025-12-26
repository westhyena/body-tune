import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

const SafeStorage = {
    getItem: (key: string) => {
        if (Platform.OS === 'web' && typeof window === 'undefined') {
            return Promise.resolve(null)
        }
        return AsyncStorage.getItem(key)
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web' && typeof window === 'undefined') {
            return Promise.resolve()
        }
        return AsyncStorage.setItem(key, value)
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web' && typeof window === 'undefined') {
            return Promise.resolve()
        }
        return AsyncStorage.removeItem(key)
    },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: SafeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
})

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})
