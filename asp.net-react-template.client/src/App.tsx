import { useEffect, useState } from 'react';
import './App.css';

interface RaceResult {
    position: number;
    driverName: string;
    points: number;
}

function App() {
    const [results, setResults] = useState<RaceResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadResults() {
            try {
                const response = await fetch('/api/race-results');

                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }

                const data: RaceResult[] = await response.json();
                setResults(data);
            } catch {
                setError('Could not load race results.');
            } finally {
                setLoading(false);
            }
        }

        loadResults();
    }, []);

    return (
        <div>
            <h1>F1 Race Results</h1>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Position</th>
                            <th>Driver</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(result => (
                            <tr key={result.position}>
                                <td>{result.position}</td>
                                <td>{result.driverName}</td>
                                <td>{result.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default App;