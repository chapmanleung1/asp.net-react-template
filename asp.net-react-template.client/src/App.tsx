import { useEffect, useState } from 'react';
import './App.css';
import { bestSector, sectorStatus, sectorLabels } from './sectorTiming';

interface Driver {
    driver_number: number;
    full_name: string;
    team_name: string;
}

interface Lap {
    session_key: number;
    driver_number: number;
    lap_number: number;
    lap_duration: number | null;
    duration_sector_1: number | null;
    duration_sector_2: number | null;
    duration_sector_3: number | null;
    is_pit_out_lap: boolean;
}

function formatLapTime(duration: number | null): string {
    if (duration === null || !Number.isFinite(duration) || duration <= 0) {
        return 'N/A';
    }

    const totalMilliseconds = Math.round(duration * 1000);
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = totalMilliseconds % 1000;

    return `${minutes}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
}

function App() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverNumber, setSelectedDriverNumber] = useState(3);
    const [driversLoading, setDriversLoading] = useState(true);
    const [driversError, setDriversError] = useState('');
    const selectedDriver = drivers.find(driver => driver.driver_number === selectedDriverNumber);

    useEffect(() => {
        const controller = new AbortController();

        async function loadDrivers() {
            try {
                const response = await fetch('/api/drivers', { signal: controller.signal });
                if (!response.ok) throw new Error(`Request failed: ${response.status}`);
                const data: Driver[] = await response.json();
                if (!controller.signal.aborted) setDrivers(data);
            } catch {
                if (!controller.signal.aborted) setDriversError('Could not load drivers. Please refresh to retry.');
            } finally {
                if (!controller.signal.aborted) setDriversLoading(false);
            }
        }

        loadDrivers();
        return () => controller.abort();
    }, []);

    return (
        <main>
            <h1>Azerbaijan 2026 - Lap Times</h1>
            {driversLoading ? (
                <p role="status">Loading drivers...</p>
            ) : driversError ? (
                <p role="alert">{driversError}</p>
            ) : drivers.length === 0 ? (
                <p>No drivers available for this race.</p>
            ) : (
                <>
                    <label htmlFor="driver-select">Driver: </label>
                    <select
                        id="driver-select"
                        value={selectedDriverNumber}
                        onChange={event => setSelectedDriverNumber(Number(event.target.value))}
                    >
                        {drivers.map(driver => (
                            <option key={driver.driver_number} value={driver.driver_number}>
                                {driver.driver_number} - {driver.full_name} ({driver.team_name})
                            </option>
                        ))}
                    </select>
                    <h2 style={{ marginTop: '1.5rem' }}>{selectedDriver?.full_name}</h2>
                    {/* A new key resets the table's loading state when the driver changes. */}
                    <DriverLapTable key={selectedDriverNumber} driverNumber={selectedDriverNumber} />
                </>
            )}
        </main>
    );
}

function DriverLapTable({ driverNumber }: { driverNumber: number }) {
    const [laps, setLaps] = useState<Lap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadLaps() {
            try {
                const response = await fetch('/api/laps', {
                    signal: controller.signal
                });
                if (!response.ok) throw new Error(`Request failed: ${response.status}`);
                const data: Lap[] = await response.json();
                if (!controller.signal.aborted) {
                    setLaps([...data].sort((a, b) => a.lap_number - b.lap_number));
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError('Could not load lap data. Select another driver or refresh to retry.');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        loadLaps();
        // Cancel the previous request when this table is replaced or removed.
        return () => controller.abort();
    }, [driverNumber]);

    if (loading) return <p role="status">Loading laps...</p>;
    if (error) return <p role="alert">{error}</p>;
    const driverLaps = laps.filter(lap => lap.driver_number === driverNumber);
    if (driverLaps.length === 0) return <p>No lap data available for this driver.</p>;

    const sectorFields = ['duration_sector_1', 'duration_sector_2', 'duration_sector_3'] as const;
    const personalBests = sectorFields.map(field => bestSector(driverLaps.map(lap => lap[field])));
    const overallBests = sectorFields.map(field => bestSector(laps.map(lap => lap[field])));

    return (
        <div style={{ overflowX: 'auto' }}>
            <ul className="sector-legend" aria-label="Sector colour legend">
                <li><span className="sector-badge sector-purple">Purple</span> Fastest across all drivers</li>
                <li><span className="sector-badge sector-green">Green</span> Driver’s best</li>
                <li><span className="sector-badge sector-yellow">Yellow</span> Slower than driver’s best</li>
            </ul>
            <p className="sector-note">Compared within each sector across the saved race data, not live timing. Ties share a colour; missing times stay neutral.</p>
            <table>
                <caption>Lap and sector times (minutes:seconds:milliseconds). N/A means unavailable.</caption>
                <thead>
                    <tr>
                        <th scope="col">Lap</th>
                        <th scope="col">Lap time</th>
                        <th scope="col">Sector 1</th>
                        <th scope="col">Sector 2</th>
                        <th scope="col">Sector 3</th>
                        <th scope="col">Pit-out lap</th>
                    </tr>
                </thead>
                <tbody>
                    {driverLaps.map(lap => (
                        <tr key={`${lap.session_key}-${lap.driver_number}-${lap.lap_number}`}>
                            <td>{lap.lap_number}</td>
                            <td>{formatLapTime(lap.lap_duration)}</td>
                            {sectorFields.map((field, index) => {
                                const status = sectorStatus(lap[field], personalBests[index], overallBests[index]);
                                return (
                                    <td key={field}>
                                        <span
                                            className={`sector-badge sector-${status}`}
                                            title={sectorLabels[status]}
                                            aria-label={`Sector ${index + 1}: ${formatLapTime(lap[field])}. ${sectorLabels[status]}`}
                                        >
                                            {formatLapTime(lap[field])}
                                        </span>
                                    </td>
                                );
                            })}
                            <td>{lap.is_pit_out_lap ? 'Yes' : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default App;
