import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BarProps = {
    label: string,
    value: number,
    max?: number,
    color: string,
    icon: keyof typeof Ionicons.glyphMap
};

const StatusBar = ({ label, value, max = 100, color, icon }: BarProps) => {
    const widthPercent = `${Math.min(100, (value / max) * 100)}%`;

    return (
        <View className="mb-3 w-full">
            <View className="flex-row justify-between mb-1">
                <View className="flex-row items-center gap-1">
                    <Ionicons name={icon} size={14} color="#555" />
                    <Text className="text-gray-600 text-xs font-bold uppercase">{label}</Text>
                </View>
                <Text className="text-gray-500 text-xs">{Math.floor(value)}/{max}</Text>
            </View>
            <View className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <View
                    style={{ width: widthPercent, backgroundColor: color }}
                    className="h-full rounded-full"
                />
            </View>
        </View>
    );
};

export default function StatusBars({ hp, fullness, energy, exp }: { hp: number, fullness: number, energy: number, exp: number }) {
    return (
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
            <StatusBar label="HP" value={hp} color="#ef4444" icon="heart" />
            <StatusBar label="Fullness" value={fullness} color="#f97316" icon="fast-food" />
            <StatusBar label="Energy" value={energy} color="#eab308" icon="flash" />
            <StatusBar label="EXP" value={exp} max={100} color="#3b82f6" icon="star" />
        </View>
    );
}
