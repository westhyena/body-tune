import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Social State
    const [myLikes, setMyLikes] = useState<Set<string>>(new Set()); // Composite keys: "meal_123" or "workout_456"
    const [commentCounts, setCommentCounts] = useState<{ [key: string]: number }>({});
    const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});

    // Comments Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user.id;

        // Fetch meals with counts
        const { data: meals } = await supabase
            .from('logs_meal')
            .select(`*, community_likes(count), community_comments(count)`)
            .eq('is_public', true)
            .order('log_time', { ascending: false })
            .limit(20);

        // Fetch workouts with counts
        const { data: workouts } = await supabase
            .from('logs_workout')
            .select(`*, community_likes(count), community_comments(count)`)
            .eq('is_public', true)
            .order('log_time', { ascending: false })
            .limit(20);

        // Fetch My Likes (to highlight heart)
        let myLikedKeys = new Set<string>();
        if (currentUserId) {
            const { data: myLikeData } = await supabase
                .from('community_likes')
                .select('meal_id, workout_id')
                .eq('user_id', currentUserId);

            myLikeData?.forEach(like => {
                if (like.meal_id) myLikedKeys.add(`meal_${like.meal_id}`);
                if (like.workout_id) myLikedKeys.add(`workout_${like.workout_id}`);
            });
        }
        setMyLikes(myLikedKeys);

        // Process Counts & Merge
        const newLikeCounts: any = {};
        const newCommentCounts: any = {};

        const processItem = (item: any, type: 'meal' | 'workout') => {
            const key = `${type}_${item.id}`;
            const lCount = item.community_likes[0]?.count || 0;
            const cCount = item.community_comments[0]?.count || 0;
            newLikeCounts[key] = lCount;
            newCommentCounts[key] = cCount;
            return { ...item, type }; // Add internal type
        };

        const processedMeals = meals?.map(m => processItem(m, 'meal')) || [];
        const processedWorkouts = workouts?.map(w => processItem(w, 'workout')) || [];

        const combined = [...processedMeals, ...processedWorkouts]
            .sort((a, b) => new Date(b.log_time).getTime() - new Date(a.log_time).getTime())
            .slice(0, 30);

        setLikeCounts(newLikeCounts);
        setCommentCounts(newCommentCounts);
        setPosts(combined);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const toggleLike = async (item: any) => {
        const isMeal = item.type === 'meal';
        const key = `${item.type}_${item.id}`;
        const isLiked = myLikes.has(key);

        // Optimistic Update
        setMyLikes(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(key);
            else next.add(key);
            return next;
        });
        setLikeCounts(prev => ({
            ...prev,
            [key]: Math.max(0, (prev[key] || 0) + (isLiked ? -1 : 1))
        }));

        // DB Update
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not logged in');

            if (isLiked) {
                // Remove Like
                const query = supabase.from('community_likes').delete().eq('user_id', session.user.id);
                if (isMeal) query.eq('meal_id', item.id);
                else query.eq('workout_id', item.id);
                await query;
            } else {
                // Add Like
                const payload: any = { user_id: session.user.id };
                if (isMeal) payload.meal_id = item.id;
                else payload.workout_id = item.id;
                await supabase.from('community_likes').insert(payload);
            }
        } catch (e) {
            console.error(e);
            // Revert on error (skipped for MVP brevity)
        }
    };

    const openComments = async (item: any) => {
        setSelectedPost(item);
        setModalVisible(true);
        setComments([]);
        setCommentLoading(true);

        const isMeal = item.type === 'meal'; // or identify by existence of meal_type

        let query = supabase
            .from('community_comments')
            .select('*')
            .order('created_at', { ascending: true }); // Oldest first

        if (isMeal) query = query.eq('meal_id', item.id);
        else query = query.eq('workout_id', item.id);

        const { data } = await query;
        if (data) setComments(data);
        setCommentLoading(false);
    };

    const submitComment = async () => {
        if (!newComment.trim() || !selectedPost) return;
        const isMeal = selectedPost.type === 'meal';

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const username = session.user.user_metadata?.full_name || 'Anonymous';
            const user_avatar = session.user.user_metadata?.avatar_url || null;

            const payload: any = {
                user_id: session.user.id,
                username,
                user_avatar,
                content: newComment,
            };
            if (isMeal) payload.meal_id = selectedPost.id;
            else payload.workout_id = selectedPost.id;

            const { error } = await supabase.from('community_comments').insert(payload);
            if (error) throw error;

            setNewComment('');
            openComments(selectedPost); // Refresh list

            // Increment local count
            const key = `${selectedPost.type}_${selectedPost.id}`;
            setCommentCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));

        } catch (e) {
            Alert.alert('Error', 'Failed to post comment');
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMeal = item.type === 'meal';
        const key = `${item.type}_${item.id}`;
        const liked = myLikes.has(key);
        const lCount = likeCounts[key] || 0;
        const cCount = commentCounts[key] || 0;

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
                        <Text className="font-bold text-gray-800">{item.username || `User`}</Text>
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
                    <View className="flex-row gap-6 border-t border-gray-100 pt-3">
                        <TouchableOpacity className="flex-row items-center gap-1" onPress={() => toggleLike(item)}>
                            <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#ef4444" : "#333"} />
                            <Text className={`${liked ? 'text-red-500' : 'text-gray-600'} font-medium`}>{lCount > 0 ? lCount : 'Like'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center gap-1" onPress={() => openComments(item)}>
                            <Ionicons name="chatbubble-outline" size={24} color="#333" />
                            <Text className="text-gray-600 font-medium">{cCount > 0 ? cCount : 'Comment'}</Text>
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
                keyExtractor={(item) => item.type + '_' + item.id}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchPosts} />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {/* Comments Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end bg-black/50"
                >
                    <View className="bg-white h-[80%] rounded-t-3xl overflow-hidden">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                            <Text className="font-bold text-lg">Comments</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
                                <Ionicons name="close" size={24} color="gray" />
                            </TouchableOpacity>
                        </View>

                        {commentLoading ? (
                            <ActivityIndicator size="large" className="mt-10" />
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={{ padding: 16 }}
                                ListEmptyComponent={<Text className="text-center text-gray-400 mt-10">No comments yet. Be the first!</Text>}
                                renderItem={({ item }) => (
                                    <View className="mb-4 flex-row gap-3">
                                        <Image source={{ uri: item.user_avatar }} className="w-8 h-8 rounded-full bg-gray-200" />
                                        <View className="flex-1 bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                                            <Text className="font-bold text-xs text-gray-500 mb-1">{item.username}</Text>
                                            <Text className="text-gray-800">{item.content}</Text>
                                        </View>
                                    </View>
                                )}
                            />
                        )}

                        <View className="p-4 border-t border-gray-100 flex-row gap-2 bg-white pb-8">
                            <TextInput
                                className="flex-1 bg-gray-100 rounded-full px-4 py-3"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChangeText={setNewComment}
                            />
                            <TouchableOpacity
                                onPress={submitComment}
                                className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center"
                            >
                                <Ionicons name="arrow-up" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
