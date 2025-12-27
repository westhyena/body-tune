import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);

        // Fetch meals
        const { data: meals } = await supabase
            .from('logs_meal')
            .select('*')
            .eq('is_public', true)
            .order('log_time', { ascending: false })
            .limit(20);

        // Fetch workouts
        const { data: workouts } = await supabase
            .from('logs_workout')
            .select('*')
            .eq('is_public', true)
            .order('log_time', { ascending: false })
            .limit(20);

        // Merge and sort
        const combined = [...(meals || []), ...(workouts || [])]
            .sort((a, b) => new Date(b.log_time).getTime() - new Date(a.log_time).getTime())
            .slice(0, 30); // Limit total shown

        setPosts(combined);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const renderItem = ({ item }: { item: any }) => {
        const isMeal = !!item.meal_type;

        return (
            <View className="bg-white mb-4 rounded-xl overflow-hidden shadow-sm mx-4 mt-2">
                {/* Header */}
                <View className="p-3 flex-row items-center gap-3">
                    {item.user_avatar ? (
                        <Image source={{ uri: item.user_avatar }} className="w-10 h-10 rounded-full bg-gray-200" />
                    ) : (
                        <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                            <Ionicons name="person" size={20} color="gray" />
                        </View>
                    )}
                    <View>
                        <Text className="font-bold text-gray-800">{item.username || `User ${item.user_id?.slice(0, 4)}`}</Text>
                        <Text className="text-gray-400 text-xs">{new Date(item.log_time).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Content */}
                {isMeal ? (
                    <>
                        {item.image_url && (
                            <Image
                                source={{ uri: item.image_url }}
                                className="w-full h-64 bg-gray-100"
                                resizeMode="cover"
                            />
                        )}
                        <View className="p-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="bg-orange-100 p-1 rounded-md">
                                    <Ionicons name="fast-food" size={12} color="#f97316" />
                                </View>
                                <Text className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                    {item.meal_type}
                                </Text>
                            </View>
                            <Text className="text-gray-800 text-base">{item.description}</Text>
                        </View>
                    </>
                ) : (
                    <View className="p-4">
                        <View className="bg-blue-50 p-4 rounded-xl mb-2 flex-row gap-4 items-center">
                            <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center">
                                <Ionicons name="fitness" size={24} color="#3b82f6" />
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-800">{item.exercise}</Text>
                                <Text className="text-gray-500">{item.duration} minutes • {item.intensity} Intensity</Text>
                            </View>
                        </View>
                    </View>
                )}


                {/* Actions */}
                <View className="px-4 pb-4">
                    <View className="flex-row gap-4 border-t border-gray-100 pt-3">
                        <TouchableOpacity className="flex-row items-center gap-1">
                            <Ionicons name="heart-outline" size={24} color="#333" />
                            <Text className="text-gray-600">Like</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-row items-center gap-1">
                            <Ionicons name="chatbubble-outline" size={24} color="#333" />
                            <Text className="text-gray-600">Comment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-100">
            <View className="bg-white p-4 pt-12 border-b border-gray-200">
                <Text className="text-xl font-bold text-center">Community Feed</Text>
            </View>
            <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString() + (item.meal_type ? '_meal' : '_workout')}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchPosts} />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
