import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useCharacter } from '../../context/CharacterContext';
import CharacterDisplay from '../../components/gamification/CharacterDisplay';
import StatusBars from '../../components/gamification/StatusBars';
import { Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const { character, loading, refreshCharacter } = useCharacter();
  const [steps, setSteps] = useState(0);

  // Example Pedometer Display (Optional overlay or just rely on Context logic in background)
  useEffect(() => {
    Pedometer.isAvailableAsync().then(available => {
      if (available) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        Pedometer.getStepCountAsync(start, end).then(result => {
          setSteps(result.steps);
        });
      }
    });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Loading BodyTune...</Text>
      </View>
    );
  }

  if (!character) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-xl font-bold mb-2">Welcome to BodyTune!</Text>
        <Text className="text-gray-500 text-center">Creating your digital twin...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshCharacter} />}
    >
      <View className="p-6 pt-12 items-center">
        <Text className="text-3xl font-bold text-gray-900 mb-2">BodyTune</Text>
        <Text className="text-blue-500 font-semibold mb-8">Digital Twin</Text>

        <CharacterDisplay mood={character.mood} level={character.level} />

        <View className="mt-8 w-full">
          <StatusBars
            hp={character.hp}
            fullness={character.fullness}
            energy={character.energy}
            exp={character.exp}
          />
        </View>

        <View className="mt-6 w-full bg-blue-50 p-4 rounded-xl flex-row justify-between items-center">
          <View>
            <Text className="text-blue-800 font-bold text-lg">Daily Activity</Text>
            <Text className="text-blue-600 text-xs">Based on Pedometer</Text>
          </View>
          <Text className="text-2xl font-extrabold text-blue-600">{steps} Steps</Text>
        </View>
      </View>
    </ScrollView>
  );
}
