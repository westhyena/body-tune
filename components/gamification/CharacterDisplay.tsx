import { View, Text, Image } from 'react-native';
import { CharacterMood } from '../../context/CharacterContext';

// Placeholder Assets (In a real app, these would be local requires or remote URIs)
// Using simple color/shape representations for MVP if images aren't responding, but here simulating "Pixel Art" with simple blocks
// or using the `generate_image` tool later. For now, we will use View blocks with Pixel Art style styling.

const PixelChar = ({ mood, color }: { mood: CharacterMood, color: string }) => (
    <View className="items-center justify-center">
        {/* Head */}
        <View style={{ backgroundColor: color, width: 120, height: 100, marginBottom: 5 }} />

        {/* Eyes */}
        <View className="absolute flex-row gap-8" style={{ top: 30 }}>
            <View className="bg-black w-4 h-4" />
            <View className="bg-black w-4 h-4" />
        </View>

        {/* Mouth */}
        <View className="absolute" style={{ top: 60 }}>
            {mood === 'happy' && <View className="bg-black w-10 h-2" />}
            {mood === 'neutral' && <View className="bg-black w-8 h-2" />}
            {mood === 'sad' && <View className="bg-black w-6 h-2 mt-2" style={{ transform: [{ rotate: '180deg' }] }} />}
            {mood === 'sick' && <View className="bg-green-800 w-6 h-4 rounded-full" />}
        </View>

        {/* Body */}
        <View style={{ backgroundColor: color, width: 80, height: 60, opacity: 0.8 }} />

        {/* Legs */}
        <View className="flex-row gap-4">
            <View style={{ backgroundColor: color, width: 20, height: 30 }} />
            <View style={{ backgroundColor: color, width: 20, height: 30 }} />
        </View>
    </View>
);

export default function CharacterDisplay({ mood = 'happy', level }: { mood?: CharacterMood, level: number }) {
    // Determine Color based on Level (Evolution)
    const getColor = (lvl: number) => {
        if (lvl < 5) return '#fbbf24'; // Yellow (Baby)
        if (lvl < 10) return '#60a5fa'; // Blue (Teen)
        return '#a855f7'; // Purple (Adult)
    };

    return (
        <View className="items-center justify-center py-10">
            <View className="bg-blue-50 w-full aspect-square rounded-full items-center justify-center border-4 border-blue-100 shadow-inner">
                <PixelChar mood={mood} color={getColor(level)} />
            </View>

            <View className="mt-4 bg-gray-800 px-4 py-1 rounded-full">
                <Text className="text-yellow-400 font-bold font-mono">Lvl.{level} PixelPet</Text>
            </View>
        </View>
    );
}
