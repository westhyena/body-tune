import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function MealsScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [mealType, setMealType] = useState('Breakfast');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('logs_meal')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
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

            const updates = {
                user_id: session.user.id,
                meal_type: mealType,
                description,
                image_url: imagePath,
                created_at: new Date(),
            };

            const { error } = await supabase.from('logs_meal').insert(updates);
            if (error) {
                console.log(error);
            }

            Alert.alert('Success', 'Meal logged!');
            setDescription('');
            setImage(null);
            fetchHistory(); // Refresh history
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-6 mt-10">Log Your Meal</Text>

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
                            <Text className="text-gray-400 text-xs mt-1">{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
