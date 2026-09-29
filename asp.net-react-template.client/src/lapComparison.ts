import { toMilliseconds } from './sectorTiming';

export interface ComparisonLap {
    driver_number: number;
    lap_number: number;
    lap_duration: number | null;
    is_pit_out_lap: boolean;
}

export function compareLaps(laps: ComparisonLap[], firstDriver: number, secondDriver: number) {
    const first = new Map(laps.filter(lap => lap.driver_number === firstDriver).map(lap => [lap.lap_number, lap]));
    const second = new Map(laps.filter(lap => lap.driver_number === secondDriver).map(lap => [lap.lap_number, lap]));
    const lapNumbers = [...new Set([...first.keys(), ...second.keys()])].sort((a, b) => a - b);

    return lapNumbers.map(lapNumber => {
        const firstLap = first.get(lapNumber);
        const secondLap = second.get(lapNumber);
        const firstTime = toMilliseconds(firstLap?.lap_duration ?? null);
        const secondTime = toMilliseconds(secondLap?.lap_duration ?? null);
        return {
            lapNumber,
            firstLap,
            secondLap,
            // Positive means the first driver's lap took longer.
            difference: firstTime !== null && secondTime !== null ? firstTime - secondTime : null
        };
    });
}
