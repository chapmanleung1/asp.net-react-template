# Azerbaijan 2026 map replay

Source: https://api.openf1.org/v1/location?session_key=11377&driver_number=DRIVER_NUMBER
Lap timing source: ../azerbaijan-2026-laps.json (OpenF1 session 11377).

The local files cover all 22 drivers. Location samples were filtered to the race window and each driver's recorded lap end; earlier-session and post-race points were removed. Approximately one position per elapsed second was retained, with timestamps preserved. Coordinates use the same aspect-preserving transform for every driver and the circuit.

The SVG circuit outline is a trace of Verstappen's third recorded lap. It is an approximate centreline, not an official surveyed circuit map. Playback interpolates only between samples separated by at most three seconds; markers are hidden when data is stale. End of a driver's recorded laps is labelled without assuming retirement or classification. Driver lap numbers come from recorded lap-start timestamps. This is a position-data replay, not race video or exact live timing.

manifest.json contains the shared clock and map; NUMBER.json contains one driver's positions and lap timeline. JSON tuple fields are documented in src/replayMath.ts in the client.

Race order source: https://api.openf1.org/v1/position?session_key=11377 . Each driver's latest pre-start order is retained at time zero, followed by position changes up to the end of the replay. The leaderboard uses the latest recorded position at or before the shared clock time; it does not infer order from map coordinates or imply final classification. Position-history tuples are [elapsed seconds, recorded position].

Leaderboard intervals come from OpenF1 `/v1/intervals?session_key=11377`, stored in `manifest.json` as per-driver time histories. Each displayed interval is the latest recorded gap to the car ahead at the replay time; updates are discrete, not interpolated.

Bottas (77) exception: his incomplete lap 50 has no lap duration, so the original lap-end cut removed the final ~91 seconds of movement. His location trace is retained until its stable stop near Turn 15 at approximately 12:40:52 UTC. The `incident` field marks the observed stop as a crash on race leader lap 51, supported by the Formula 1 race report and results; Bottas had completed 49 laps and was on his own lap 50. The red crash marker remains at the last recorded position for the rest of the replay. This approximate stop time is inferred from the location trace, not an official incident timestamp.
