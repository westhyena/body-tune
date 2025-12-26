import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-white p-4">
            <Text className="text-xl font-bold mb-8">User Profile</Text>

            <TouchableOpacity
                className="bg-red-500 p-4 rounded-lg w-full items-center"
                onPress={() => supabase.auth.signOut()}
            >
                <Text className="text-white font-semibold">Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}
