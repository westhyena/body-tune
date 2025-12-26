import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState('Checking session...');
    const [sessionInfo, setSessionInfo] = useState<string>('null');

    useEffect(() => {
        // Check for session immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionInfo(session ? 'Session Found!' : 'No Session');
            if (session) {
                setStatus('Session found! Redirecting...');
                setTimeout(() => router.replace('/(tabs)'), 500);
            } else {
                setStatus('No session found yet... waiting for auth event');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSessionInfo(session ? `Event: ${event} (Session Found)` : `Event: ${event} (No Session)`);
            if (session) {
                setStatus('Auth event received! Redirecting...');
                setTimeout(() => router.replace('/(tabs)'), 500);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <ScrollView contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'white' }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-4 text-gray-500 font-bold text-lg mb-2">Processing Login...</Text>

            <View className="bg-gray-100 p-4 rounded-lg w-full mb-6">
                <Text className="font-mono text-xs text-gray-600 mb-1">Status: {status}</Text>
                <Text className="font-mono text-xs text-gray-600">Info: {sessionInfo}</Text>
            </View>

            <TouchableOpacity
                className="bg-blue-500 px-6 py-3 rounded-full shadow-lg"
                onPress={() => router.replace('/(tabs)')}
            >
                <Text className="text-white font-bold text-lg">Force Continue (Go Home)</Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-300 mt-10">Running: v1.2 Debug</Text>
        </ScrollView>
    );
}
