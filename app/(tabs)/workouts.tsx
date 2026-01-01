import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCharacter } from '../../context/CharacterContext';

export default function WorkoutsScreen() {
    const { exercise: doExercise } = useCharacter();
    const [exercise, setExercise] = useState('');
    const [duration, setDuration] = useState('');
    const [intensity, setIntensity] = useState('Medium');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // New features
    const [isPublic, setIsPublic] = useState(true);
    const [logTime, setLogTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchHistory = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('logs_workout')
            .select('*')
            .eq('user_id', session.user.id)
            .order('log_time', { ascending: false }) // Sort by log_time
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

            const username = session.user.user_metadata?.full_name || 'Anonymous';
            const user_avatar = session.user.user_metadata?.avatar_url || null;

            const updates = {
                user_id: session.user.id,
                username,
                user_avatar,
                exercise,
                duration: parseInt(duration),
                intensity,
                is_public: isPublic,           // New
                log_time: logTime.toISOString(), // New
                created_at: new Date(),
            };

            const { error } = await supabase.from('logs_workout').insert(updates);
            if (error) {
                console.log(error);
                throw error;
            }

            Alert.alert('Workout Complete!', 'Keep up the momentum!');

            // Calculate intensity value
            const intensityValue = intensity === 'High' ? 5 : intensity === 'Medium' ? 3 : 1;
            await doExercise(intensityValue);

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

            {/* Time Picker */}
            <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-gray-600 font-semibold">Time</Text>
                {Platform.OS === 'web' ? (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="datetime-local"
                            value={new Date(logTime.getTime() - (logTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                            onChange={(e) => setLogTime(new Date(e.target.value))}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                        />
                    </div>
                ) : Platform.OS === 'android' ? (
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} className="bg-gray-100 px-4 py-2 rounded-lg">
                        <Text>{logTime.toLocaleString()}</Text>
                    </TouchableOpacity>
                ) : (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={logTime}
                        mode={'datetime'}
                        is24Hour={true}
                        onChange={(event, date) => date && setLogTime(date)}
                    />
                )}
                {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={logTime}
                        mode={'datetime'}
                        is24Hour={true}
                        onChange={(e, date) => {
                            setShowDatePicker(false);
                            if (date) setLogTime(date);
                        }}
                    />
                )}
            </View>

            {/* Visibility Switch */}
            <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-gray-600 font-semibold">Share to Community</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#3b82f6" }}
                    thumbColor={isPublic ? "#f4f3f4" : "#f4f3f4"}
                    onValueChange={setIsPublic}
                    value={isPublic}
                />
            </View>

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
                            <View className="flex-row items-center gap-2 mt-1">
                                <Text className="text-gray-400 text-xs">{new Date(item.log_time).toLocaleString()}</Text>
                                {!item.is_public && <Ionicons name="lock-closed" size={12} color="gray" />}
                            </View>
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
