import { useEffect, useRef, useState } from 'react';
import { formatRaceClock, formatRaceInterval, lapAt, positionAt, raceIntervalAt, racePositionAt } from './replayMath';
import type { ReplaySample, ReplayLap, RacePosition, RaceInterval } from './replayMath';

interface Driver { driver_number: number; full_name: string; team_name: string; }
interface ReplayManifest {
    sessionKey: number;
    startUtc: string;
    durationSeconds: number;
    circuitPoints: [number, number][];
    positionHistory: Record<string, RacePosition[]>;
    intervalHistory: Record<string, RaceInterval[]>;
    drivers: { driverNumber: number; sampleCount: number }[];
}
interface DriverReplay {
    driverNumber: number;
    endSeconds: number;
    samples: ReplaySample[];
    laps: ReplayLap[];
    incident?: { timeSeconds: number; kind: 'crash'; raceLap: number; location: string };
}

export default function RaceReplay({ drivers }: { drivers: Driver[] }) {
    const [first, setFirst] = useState(3);
    const [second, setSecond] = useState(63);
    const [nextFocus, setNextFocus] = useState(0);
    const [manifest, setManifest] = useState<ReplayManifest | null>(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        async function loadManifest() {
            try {
                const response = await fetch('/api/replay', { signal: controller.signal });
                if (!response.ok) throw new Error('Replay unavailable');
                const data: ReplayManifest = await response.json();
                if (!controller.signal.aborted) setManifest(data);
            } catch {
                if (!controller.signal.aborted) setError('Could not load the replay. Check that the backend has restarted.');
            }
        }
        loadManifest();
        return () => controller.abort();
    }, []);
    if (error) return <p role="alert">{error}</p>;
    if (!manifest) return <p role="status">Loading Baku circuit...</p>;
    const available = drivers.filter(driver => manifest.drivers.some(item => item.driverNumber === driver.driver_number && item.sampleCount > 0));
    const firstDriver = available.find(driver => driver.driver_number === first);
    const secondDriver = available.find(driver => driver.driver_number === second);
    return (
        <section aria-label="Azerbaijan race map replay">
            <h2>Baku - Race Replay</h2>
            <p className="replay-description">Watch all drivers on a shared race clock. Click a driver’s name in the leaderboard to focus on them. New selections alternate between the two focus spots.</p>
            {firstDriver && secondDriver ? <ReplayPlayer first={firstDriver} second={secondDriver} drivers={available} manifest={manifest}
                onFocus={number => {
                    if (number === first || number === second) return;
                    if (nextFocus === 0) setFirst(number);
                    else setSecond(number);
                    setNextFocus(nextFocus === 0 ? 1 : 0);
                }} /> : <p>No replay available for this selection.</p>}
            <p className="replay-source">Approximate recorded positions from <a href="https://openf1.org/docs/#location" target="_blank" rel="noreferrer">OpenF1</a>, sampled about once per second and interpolated between nearby samples. The circuit outline is traced from a recorded lap. Gaps in position data hide a marker; this is a data replay rather than race video.</p>
        </section>
    );
}

function ReplayPlayer({ first, second, drivers, manifest, onFocus }: { first: Driver; second: Driver; drivers: Driver[]; manifest: ReplayManifest; onFocus: (number: number) => void }) {
    const [field, setField] = useState<DriverReplay[] | null>(null);
    const [error, setError] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    useEffect(() => {
        const controller = new AbortController();
        async function loadField() {
            try {
                const data = await Promise.all(manifest.drivers.filter(driver => driver.sampleCount > 0).map(async driver => {
                    const number = driver.driverNumber;
                    const response = await fetch(`/api/replay/drivers/${number}`, { signal: controller.signal });
                    if (!response.ok) throw new Error('Position data unavailable');
                    return response.json() as Promise<DriverReplay>;
                }));
                if (!controller.signal.aborted) setField(data);
            } catch {
                if (!controller.signal.aborted) setError('Could not load the full field’s positions. Please refresh to retry.');
            }
        }
        loadField();
        return () => controller.abort();
    }, [manifest.drivers]);

    useEffect(() => {
        if (!playing) return;
        let frame = 0;
        let previous: number | null = null;
        let accumulated = elapsed;
        let lastPaint = 0;
        function tick(now: number) {
            if (previous !== null) accumulated = Math.min(manifest.durationSeconds, accumulated + Math.min((now - previous) / 1000, 0.25) * speed);
            previous = now;
            if (now - lastPaint >= 33 || accumulated >= manifest.durationSeconds) {
                setElapsed(accumulated);
                lastPaint = now;
            }
            if (accumulated >= manifest.durationSeconds) setPlaying(false);
            else frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
        // Read elapsed at playback start; advancing the clock must not restart the animation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, speed, manifest.durationSeconds]);

    if (error) return <p role="alert">{error}</p>;
    if (!field) return <p role="status">Loading positions for all drivers...</p>;
    const selected = [first, second];
    const colours = ['#fb7185', '#38bdf8'];
    const markers = field.map(item => ({
        item,
        point: item.incident && elapsed >= item.incident.timeSeconds
            ? { x: item.samples[item.samples.length - 1][1], y: item.samples[item.samples.length - 1][2] }
            : positionAt(item.samples, elapsed),
        focusIndex: selected.findIndex(driver => driver.driver_number === item.driverNumber),
        driver: drivers.find(driver => driver.driver_number === item.driverNumber)
    })).sort((a, b) => a.focusIndex - b.focusIndex);
    const visibleCount = markers.filter(marker => marker.point !== null).length;
    const path = manifest.circuitPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';
    const start = manifest.circuitPoints[0];
    const nextPoint = manifest.circuitPoints[1];
    const startDirection = start && nextPoint ? Math.hypot(nextPoint[0] - start[0], nextPoint[1] - start[1]) : 0;
    const startNormal = startDirection ? [-(nextPoint[1] - start[1]) / startDirection, (nextPoint[0] - start[0]) / startDirection] : [0, 1];
    const leaderboard = field.map(item => ({
        item,
        driver: drivers.find(driver => driver.driver_number === item.driverNumber),
        position: racePositionAt(manifest.positionHistory?.[String(item.driverNumber)] ?? [], elapsed),
        interval: raceIntervalAt(manifest.intervalHistory?.[String(item.driverNumber)] ?? [], elapsed),
        lap: lapAt(item.laps, elapsed),
        focusIndex: selected.findIndex(driver => driver.driver_number === item.driverNumber)
    })).sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || a.item.driverNumber - b.item.driverNumber);
    return (
        <>
            <div className="replay-layout">
            <div className="replay-map-panel">
            <div className="replay-map">
                <svg viewBox="0 0 900 560" role="img" aria-labelledby="replay-map-title replay-map-description">
                    <title id="replay-map-title">Baku City Circuit with all drivers, focused on {first.full_name} and {second.full_name}</title>
                    <desc id="replay-map-description">Circuit reconstructed from recorded positions. All available drivers have numbered markers. Red and blue highlights follow the two focused drivers.</desc>
                    <path d={path} fill="none" stroke="#334155" strokeWidth="19" strokeLinejoin="round" strokeLinecap="round" />
                    <path d={path} fill="none" stroke="#cbd5e1" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
                    {start && <g>
                        <line x1={start[0] - startNormal[0] * 12} y1={start[1] - startNormal[1] * 12}
                            x2={start[0] + startNormal[0] * 12} y2={start[1] + startNormal[1] * 12}
                            stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        <text x={start[0]} y={start[1] - 23} textAnchor="middle" fill="#f8fafc" fontSize="13"
                            paintOrder="stroke" stroke="#0f172a" strokeWidth="4">Start / finish</text>
                    </g>}
                    {markers.map(({ item, point, focusIndex, driver }) => {
                        if (!point) return null;
                        const isFocused = focusIndex >= 0;
                        const crashed = !!item.incident && elapsed >= item.incident.timeSeconds;
                        const colour = crashed ? '#ef4444' : isFocused ? colours[focusIndex] : '#94a3b8';
                        return (
                            <g key={item.driverNumber} className={isFocused ? 'replay-marker focused' : 'replay-marker'}
                                transform={`translate(${point.x}, ${point.y})`}>
                                {isFocused && <circle r="18" fill={colour} fillOpacity="0.25" />}
                                <circle r={isFocused ? 12 : 8} fill={colour} stroke={isFocused ? '#fff' : '#0f172a'} strokeWidth={isFocused ? 2 : 1} />
                                <text textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontSize={isFocused ? 10 : 7} fontWeight="800">{crashed ? '×' : item.driverNumber}</text>
                                <title>{driver?.full_name ?? `Driver ${item.driverNumber}`}{crashed ? ` — crashed at ${item.incident?.location} on race lap ${item.incident?.raceLap}` : isFocused ? ' — focused' : ''}</title>
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="replay-controls">
                <button type="button" onClick={() => {
                    if (!playing && elapsed >= manifest.durationSeconds) setElapsed(0);
                    setPlaying(!playing);
                }}>{playing ? 'Pause' : 'Play'}</button>
                <button type="button" onClick={() => { setPlaying(false); setElapsed(0); }}>Restart</button>
                <Commentary elapsed={elapsed} playing={playing} speed={speed} />
                <label htmlFor="replay-speed">Speed
                    <select id="replay-speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
                        {[1, 5, 10, 25, 50].map(value => <option key={value} value={value}>{value}×</option>)}
                    </select>
                </label>
                <output aria-label="Race elapsed time">{formatRaceClock(elapsed)} / {formatRaceClock(manifest.durationSeconds)}</output>
            </div>
            <label className="replay-timeline" htmlFor="race-timeline">Race timeline
                <input id="race-timeline" type="range" min="0" max={manifest.durationSeconds} step="0.1" value={elapsed}
                    aria-valuetext={formatRaceClock(elapsed)} onChange={event => { setPlaying(false); setElapsed(Number(event.target.value)); }} />
            </label>
            <p className="replay-field-status">{visibleCount}/{field.length} driver positions available · Red and blue mark focus drivers · × marks a crash</p>
            </div>
            <aside className="replay-leaderboard" aria-label="Race leaderboard">
                <h3>Race leaderboard</h3>
                <p>Latest recorded order at {formatRaceClock(elapsed)}</p>
                <div className="leaderboard-scroll">
                    <table>
                        <thead><tr><th scope="col">Pos</th><th scope="col">Driver</th><th scope="col">Lap</th><th scope="col" title="Gap to the car ahead">Int</th></tr></thead>
                        <tbody>{leaderboard.map(({ item, driver, position, interval, lap, focusIndex }) => (
                            <tr key={item.driverNumber} className={focusIndex === 0 ? 'leaderboard-first' : focusIndex === 1 ? 'leaderboard-second' : undefined}>
                                <td>{position ?? '—'}</td>
                                <td>
                                    <button type="button" className="leaderboard-driver" aria-pressed={focusIndex >= 0}
                                        aria-label={`Focus ${driver?.full_name ?? item.driverNumber}, ${driver?.team_name ?? 'unknown team'}`} title={driver?.team_name} onClick={() => onFocus(item.driverNumber)}>
                                        {item.driverNumber} · {driver?.full_name ?? 'Unknown driver'}
                                    </button>
                                </td>
                                <td>{lap ?? '—'}{item.incident && elapsed >= item.incident.timeSeconds ? <small title={`Crashed at ${item.incident.location} on race lap ${item.incident.raceLap}`}>Crash</small> : elapsed > item.endSeconds && <small title="The driver's recorded lap data has ended">Ended</small>}</td>
                                <td className="leaderboard-interval">{formatRaceInterval(interval, position === 1)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                <p className="leaderboard-note">Int = gap to car ahead. “Crash” marks Bottas at Turn 15; “Ended” means recorded lap data ended.</p>
            </aside>
            </div>
        </>
    );
}

const DRIVE_COMMENTARY_URL = '/api/replay/commentary';

function Commentary({ elapsed, playing, speed }: { elapsed: number; playing: boolean; speed: number }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [volume, setVolume] = useState(0.7);
    const [message, setMessage] = useState('');
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ready) return;
        audio.volume = volume;
        const target = Math.min(elapsed + 533, Number.isFinite(audio.duration) ? audio.duration : elapsed + 533);
        if (!playing || Math.abs(audio.currentTime - target) > 0.5) audio.currentTime = target;
    }, [elapsed, volume, playing, ready]);
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ready) return;
        let cancelled = false;
        if (playing && speed === 1) {
            audio.play().catch(() => { if (!cancelled) setMessage('Audio could not play. Pause and press Play to retry.'); });
        } else audio.pause();
        return () => { cancelled = true; audio.pause(); };
    }, [playing, speed, ready]);
    return <div className="commentary-volume">
        <label htmlFor="commentary-volume">Commentary volume</label>
        <input id="commentary-volume" type="range" min="0" max="1" step="0.01" value={volume}
            onChange={event => setVolume(Number(event.target.value))} />
        <output>{Math.round(volume * 100)}%</output>
        <audio ref={audioRef} src={DRIVE_COMMENTARY_URL} preload="metadata" onLoadedMetadata={() => setReady(true)}
            onError={() => setMessage('Commentary could not load. Check the local MP3 in Downloads or the Google Drive link.')} />
        {message && <span role="alert" className="commentary-error">{message}</span>}
    </div>;
}
