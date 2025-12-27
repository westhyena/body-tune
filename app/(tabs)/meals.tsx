import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MealsScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [mealType, setMealType] = useState('Breakfast');
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
            .from('logs_meal')
            .select('*')
            .eq('user_id', session.user.id)
            .order('log_time', { ascending: false }) // Sort by log_time
            .limit(5);

        if (data) setHistory(data);
    }

    useEffect(() => {
        fetchHistory();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadLog = async () => {
        if (!description && !image) {
            Alert.alert('Please add an image or description');
            return;
        }
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No user on the session!');

            let imagePath = null;
            if (image) {
                imagePath = image;
            }

            const username = session.user.user_metadata?.full_name || 'Anonymous';
            const user_avatar = session.user.user_metadata?.avatar_url || null;

            const updates = {
                user_id: session.user.id,
                username,
                user_avatar,
                meal_type: mealType,
                description,
                image_url: imagePath,
                is_public: isPublic,           // New
                log_time: logTime.toISOString(), // New
                created_at: new Date(),
            };

            const { error } = await supabase.from('logs_meal').insert(updates);
            if (error) {
                console.log(error);
                throw error;
            }

            Alert.alert('Success', 'Meal logged!');
            setDescription('');
            setImage(null);
            fetchHistory();
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error logging meal', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || logTime;
        setShowDatePicker(Platform.OS === 'ios');
        setLogTime(currentDate);
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-6 mt-10">Log Your Meal</Text>

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
                        onChange={onChangeDate}
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
                <Text className="text-gray-600 mb-2">Meal Type</Text>
                <View className="flex-row gap-2">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setMealType(type)}
                            className={`px-4 py-2 rounded-full ${mealType === type ? 'bg-blue-500' : 'bg-gray-100'
                                }`}
                        >
                            <Text className={mealType === type ? 'text-white' : 'text-gray-700'}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity onPress={pickImage} className="w-full h-48 bg-gray-100 rounded-xl items-center justify-center mb-6 border-2 border-dashed border-gray-300">
                {image ? (
                    <Image source={{ uri: image }} className="w-full h-full rounded-xl" />
                ) : (
                    <View className="items-center">
                        <Ionicons name="camera" size={32} color="gray" />
                        <Text className="text-gray-500 mt-2">Tap to take a photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View className="mb-6">
                <Text className="text-gray-600 mb-2">Description</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl p-4 min-h-[100px] text-base"
                    multiline
                    placeholder="What did you eat?"
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            <TouchableOpacity
                onPress={uploadLog}
                disabled={loading}
                className="bg-blue-600 p-4 rounded-xl items-center mb-10"
            >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Log Meal</Text>}
            </TouchableOpacity>

            <View className="mb-20">
                <Text className="text-xl font-bold mb-4">Recent Meals</Text>
                {history.map((item) => (
                    <View key={item.id} className="flex-row bg-gray-50 p-4 rounded-xl mb-3 items-center gap-4">
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} className="w-16 h-16 rounded-lg bg-gray-200" />
                        ) : (
                            <View className="w-16 h-16 rounded-lg bg-gray-200 items-center justify-center">
                                <Ionicons name="fast-food" size={20} color="gray" />
                            </View>
                        )}
                        <View className="flex-1">
                            <Text className="font-semibold text-lg">{item.meal_type}</Text>
                            <Text className="text-gray-500 text-sm" numberOfLines={1}>{item.description}</Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <Text className="text-gray-400 text-xs">{new Date(item.log_time).toLocaleString()}</Text>
                                {!item.is_public && <Ionicons name="lock-closed" size={12} color="gray" />}
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
