import React, { useState } from 'react'
import { Alert, View, Platform, Image } from 'react-native'
import { supabase } from '../../lib/supabase'
import { View as ThemedView, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { Ionicons } from '@expo/vector-icons'

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
    const [loading, setLoading] = useState(false)

    const redirectTo = makeRedirectUri({
        scheme: 'bodytune',
        path: 'auth/callback',
    });

    async function signInWithGoogle() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    skipBrowserRedirect: false,
                }
            });
            if (error) throw error;
        } catch (e) {
            if (e instanceof Error) Alert.alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 items-center justify-center bg-white p-6">
            <Stack.Screen options={{ title: 'Sign In', headerShown: false }} />

            <View className="items-center mb-16">
                <View className="w-24 h-24 bg-blue-100 rounded-3xl items-center justify-center mb-6">
                    <Ionicons name="fitness" size={50} color="#3b82f6" />
                </View>
                <Text className="text-4xl font-extrabold text-gray-900 tracking-tight">BodyTune</Text>
                <Text className="text-gray-500 mt-2 text-lg">Your Personal Health Companion</Text>
            </View>

            <View className="w-full max-w-[320px] gap-4">
                <TouchableOpacity
                    className="bg-white border border-gray-300 p-4 rounded-xl items-center flex-row justify-center gap-3 shadow-sm h-14"
                    onPress={() => signInWithGoogle()}
                    disabled={loading}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text className="text-gray-700 font-bold text-lg">Sign in with Google</Text>
                </TouchableOpacity>

                {loading && <ActivityIndicator className="mt-4" size="large" color="#3b82f6" />}
            </View>

            <View className="absolute bottom-10">
                <Text className="text-gray-400 text-xs">Powered by Supabase & Expo</Text>
            </View>
        </View>
    )
}
