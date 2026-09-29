export type SectorStatus = 'purple' | 'green' | 'yellow' | 'unavailable';

// Compare the same millisecond precision that the table displays.
export function toMilliseconds(seconds: number | null): number | null {
    if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.round(seconds * 1000);
}

export function bestSector(values: (number | null)[]): number | null {
    const valid = values.map(toMilliseconds).filter((value): value is number => value !== null);
    return valid.length > 0 ? Math.min(...valid) : null;
}

export function sectorStatus(
    seconds: number | null,
    personalBest: number | null,
    overallBest: number | null
): SectorStatus {
    const milliseconds = toMilliseconds(seconds);
    if (milliseconds === null) return 'unavailable';
    if (milliseconds === overallBest) return 'purple';
    if (milliseconds === personalBest) return 'green';
    return 'yellow';
}

export const sectorLabels: Record<SectorStatus, string> = {
    purple: 'Fastest recorded across all drivers',
    green: "Driver’s best recorded sector",
    yellow: "Slower than driver’s best recorded sector",
    unavailable: 'Sector time unavailable'
};
