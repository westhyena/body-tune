import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { Pedometer } from 'expo-sensors';
import { differenceInMinutes } from 'date-fns'; // Assuming date-fns might be needed, or use native Math

// Define Character State Types
export type CharacterMood = 'happy' | 'neutral' | 'sad' | 'sick';

export interface CharacterState {
    user_id: string;
    level: number;
    exp: number;
    hp: number;
    fullness: number;
    energy: number;
    mood: CharacterMood;
    last_interaction_at: string;
}

interface CharacterContextType {
    character: CharacterState | null;
    loading: boolean;
    feed: (amount: number) => Promise<void>;
    exercise: (intensity: number) => Promise<void>;
    refreshCharacter: () => Promise<void>;
}

const CharacterContext = createContext<CharacterContextType>({
    character: null,
    loading: true,
    feed: async () => { },
    exercise: async () => { },
    refreshCharacter: async () => { },
});

export const useCharacter = () => useContext(CharacterContext);

export const CharacterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [character, setCharacter] = useState<CharacterState | null>(null);
    const [loading, setLoading] = useState(true);
    const [stepCount, setStepCount] = useState(0);

    // Initial Load & Subscription
    useEffect(() => {
        let subscription: any;

        const init = async () => {
            await fetchCharacter();
            // Start Pedometer
            const isAvailable = await Pedometer.isAvailableAsync();
            if (isAvailable) {
                // Watch local steps for session
                subscription = Pedometer.watchStepCount(result => {
                    handleStepChange(result.steps);
                });
            }
        };

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                fetchCharacter(); // Re-sync and apply decay on resume
            }
        };

        const appStateSub = AppState.addEventListener('change', handleAppStateChange);

        init();

        return () => {
            subscription && subscription.remove();
            appStateSub.remove();
        };
    }, []);

    const handleStepChange = async (steps: number) => {
        // Simple Logic: Every 100 steps = 1 EXP + 1 Energy
        // In real app, we'd debounce this or aggregate
        if (steps > 0 && steps % 100 === 0) {
            // We would update local state here
            console.log("Steps synced: ", steps);
            // syncing every step is too heavy, skipping auto-sync for MVP Pedometer inside this simple loop
            // Ideally we store 'last_synced_steps' and compare.
        }
    };

    const fetchCharacter = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            let { data, error } = await supabase
                .from('character_state')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Not found, create default
                const newChar = {
                    user_id: session.user.id,
                    level: 1,
                    exp: 0,
                    hp: 100,
                    fullness: 100,
                    energy: 100,
                    mood: 'happy',
                    last_interaction_at: new Date().toISOString(),
                };
                const { data: created } = await supabase.from('character_state').insert(newChar).select().single();
                data = created;
            }

            if (data) {
                // Apply Decay based on time passed
                const now = new Date();
                const last = new Date(data.last_interaction_at);
                const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);

                // Decay Rules:
                // -1 Fullness every 60 mins
                // -1 HP every 120 mins if Fullness < 50

                const hoursPassed = Math.floor(diffMinutes / 60);

                if (hoursPassed > 0) {
                    let newFullness = Math.max(0, data.fullness - (hoursPassed * 5));
                    let newHp = data.hp;

                    if (newFullness < 50) {
                        newHp = Math.max(0, newHp - (hoursPassed * 2));
                    }

                    // Update if changed
                    if (newFullness !== data.fullness || newHp !== data.hp) {
                        const { data: updated } = await supabase
                            .from('character_state')
                            .update({
                                fullness: newFullness,
                                hp: newHp,
                                last_interaction_at: now.toISOString()
                            })
                            .eq('user_id', session.user.id)
                            .select()
                            .single();
                        data = updated;
                    }
                }

                setCharacter(data as CharacterState);
            }
        } catch (e) {
            console.error('Failed to fetch character', e);
        } finally {
            setLoading(false);
        }
    };

    const feed = async (amount: number) => {
        if (!character) return;

        const newFullness = Math.min(100, character.fullness + amount);
        const newExp = character.exp + 5; // Eat Bonus

        // Optimistic
        setCharacter({ ...character, fullness: newFullness, exp: newExp });

        await supabase
            .from('character_state')
            .update({
                fullness: newFullness,
                exp: newExp,
                last_interaction_at: new Date().toISOString()
            })
            .eq('user_id', character.user_id);
    };

    const exercise = async (intensity: number) => {
        // Placeholder for workout integration
        if (!character) return;
        const newEnergy = Math.max(0, character.energy - 10); // Workout costs energy initially!
        const newExp = character.exp + (intensity * 2);

        await supabase
            .from('character_state')
            .update({
                energy: newEnergy,
                exp: newExp,
                last_interaction_at: new Date().toISOString()
            })
            .eq('user_id', character.user_id);

        refreshCharacter();
    };

    const refreshCharacter = async () => {
        await fetchCharacter();
    };

    return (
        <CharacterContext.Provider value={{ character, loading, feed, exercise, refreshCharacter }}>
            {children}
        </CharacterContext.Provider>
    );
};
