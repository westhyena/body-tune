import { View, Text, Switch, ScrollView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Pedometer } from 'expo-sensors';

export default function HomeScreen() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [pastStepCount, setPastStepCount] = useState(0);

  useEffect(() => {
    const subscribe = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(String(isAvailable));

      if (isAvailable) {
        // Watch for updates
        const subscription = Pedometer.watchStepCount(result => {
          setCurrentStepCount(result.steps);
        });

        // Get past successful steps (e.g. from midnight)
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const pastSteps = await Pedometer.getStepCountAsync(start, end);
        if (pastSteps) {
          setPastStepCount(pastSteps.steps);
        }

        return subscription;
      }
    };

    let subscription: any;
    subscribe().then(sub => subscription = sub);

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const totalSteps = pastStepCount + currentStepCount;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6 pt-12 items-center">
        <Text className="text-3xl font-bold text-gray-900 mb-2">BodyTune</Text>
        <Text className="text-blue-500 font-semibold mb-8">Defy Gravity</Text>

        <View className="bg-blue-50 w-64 h-64 rounded-full items-center justify-center shadow-lg border-4 border-blue-200">
          <Text className="text-6xl font-extrabold text-blue-600">{totalSteps}</Text>
          <Text className="text-gray-500 text-lg mt-2">Steps Today</Text>
        </View>

        <View className="mt-10 w-full p-4 bg-gray-50 rounded-xl">
          <Text className="text-lg font-bold mb-4">Status</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Pedometer Available</Text>
            <Text className="font-semibold">{isPedometerAvailable}</Text>
          </View>
          {Platform.OS === 'web' && (
            <Text className="text-orange-500 text-sm mt-2">
              Note: Pedometer is not available on Web. Please test on a real device.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
