export type ReplaySample = [number, number, number]; // elapsed seconds, SVG x, SVG y
export type ReplayLap = [number, number, number | null]; // start seconds, lap number, end seconds

export function positionAt(samples: ReplaySample[], elapsed: number): { x: number; y: number } | null {
    if (samples.length === 0) return null;
    const first = samples[0];
    if (elapsed < first[0]) return first[0] - elapsed <= 2 ? { x: first[1], y: first[2] } : null;
    let low = 0;
    let high = samples.length;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (samples[mid][0] <= elapsed) low = mid + 1;
        else high = mid;
    }
    const before = samples[low - 1];
    const after = samples[low];
    if (!after || after[0] - before[0] > 3) {
        return elapsed - before[0] <= 1.5 ? { x: before[1], y: before[2] } : null;
    }
    const fraction = (elapsed - before[0]) / (after[0] - before[0]);
    return { x: before[1] + (after[1] - before[1]) * fraction, y: before[2] + (after[2] - before[2]) * fraction };
}

export function lapAt(laps: ReplayLap[], elapsed: number): number | null {
    let low = 0;
    let high = laps.length;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (laps[mid][0] <= elapsed) low = mid + 1;
        else high = mid;
    }
    return low === 0 ? null : laps[low - 1][1];
}

export function formatRaceClock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    return `${Math.floor(total / 3600).toString().padStart(2, '0')}:${Math.floor((total % 3600) / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

export type RacePosition = [number, number]; // elapsed seconds, recorded race position

export function racePositionAt(history: RacePosition[], elapsed: number): number | null {
    let low = 0;
    let high = history.length;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (history[mid][0] <= elapsed) low = mid + 1;
        else high = mid;
    }
    return low === 0 ? null : history[low - 1][1];
}
