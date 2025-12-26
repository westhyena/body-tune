import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutsScreen() {
    const [exercise, setExercise] = useState('');
    const [duration, setDuration] = useState('');
    const [intensity, setIntensity] = useState('Medium');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('logs_workout')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
    }

    useEffect(() => {
        fetchHistory();
    }, []);

    const logWorkout = async () => {
        if (!exercise || !duration) {
            Alert.alert('Please fill in all fields');
            return;
        }
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No user on the session!');

            const updates = {
                user_id: session.user.id,
                exercise,
                duration: parseInt(duration),
                intensity,
                created_at: new Date(),
            };

            const { error } = await supabase.from('logs_workout').insert(updates);
            if (error) {
                // Alert.alert('Error', error.message);
                console.log(error);
            }

            Alert.alert('Workout Complete!', 'Keep up the momentum!');
            setExercise('');
            setDuration('');
            fetchHistory();
        } catch (error) {
            if (error instanceof Error) Alert.alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-6 mt-10">Log Workout</Text>

            <View className="mb-6">
                <Text className="text-gray-600 mb-2">Exercise</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl p-4 text-base bg-gray-50"
                    placeholder="e.g. Running, Yoga"
                    value={exercise}
                    onChangeText={setExercise}
                />
            </View>

            <View className="mb-6">
                <Text className="text-gray-600 mb-2">Duration (minutes)</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl p-4 text-base bg-gray-50"
                    placeholder="30"
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                />
            </View>

            <View className="mb-8">
                <Text className="text-gray-600 mb-2">Intensity</Text>
                <View className="flex-row gap-2">
                    {['Low', 'Medium', 'High'].map((level) => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setIntensity(level)}
                            className={`px-6 py-3 rounded-xl flex-1 items-center ${intensity === level ? 'bg-orange-500' : 'bg-gray-100'
                                }`}
                        >
                            <Text className={`${intensity === level ? 'text-white' : 'text-gray-700'} font-semibold`}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                onPress={logWorkout}
                disabled={loading}
                className="bg-black p-4 rounded-xl items-center flex-row justify-center gap-2 mb-10"
            >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Complete Workout</Text>}
            </TouchableOpacity>

            <View className="mb-20">
                <Text className="text-xl font-bold mb-4">Recent Workouts</Text>
                {history.map((item) => (
                    <View key={item.id} className="flex-row bg-gray-50 p-4 rounded-xl mb-3 items-center justify-between">
                        <View>
                            <Text className="font-semibold text-lg">{item.exercise}</Text>
                            <Text className="text-gray-500 text-sm">{item.duration} min • {item.intensity}</Text>
                            <Text className="text-gray-400 text-xs mt-1">{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                            <Ionicons name="fitness" size={20} color="#3b82f6" />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
