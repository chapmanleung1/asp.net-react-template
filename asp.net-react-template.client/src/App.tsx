import { useEffect, useState } from 'react';
import './App.css';

interface Lap {
    session_key: number;
    driver_number: number;
    lap_number: number;
    lap_duration: number | null;
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
    const [laps, setLaps] = useState<Lap[]>([]); // updated via function setLaps
    const [loading, setLoading] = useState(true); // loading updated via function setLoading
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadResults() {
            try {
                const response = await fetch('/api/laps');

                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }

                const data: Lap[] = await response.json();
                setLaps(data);
                // update data continuously
            } catch {
                setError('Could not load lap data.');
            } finally {
                setLoading(false);
                // confirm successful data loaded
            }
        }

        loadResults();
    }, []);

    return (
        <div>
            <h1>Max Verstappen - Azerbaijan 2026 Laps</h1>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Lap</th>
                            <th>Lap time (m:ss:ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {laps.map(lap => (
                            <tr key={lap.lap_number}>
                                <td>{lap.lap_number}</td>
                                <td>{formatLapTime(lap.lap_duration)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default App;