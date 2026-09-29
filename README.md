# Azerbaijan GP 2026 Race Replay

An interactive replay of the 2026 Azerbaijan Grand Prix, built with ASP.NET Core, React and TypeScript. It uses saved OpenF1 data to show lap and sector times, compare drivers, and follow the field around an approximate Baku circuit map.

## Features
- View each driver’s lap times and sector times.
- Compare two drivers lap by lap.
- Replay the positions of all 22 drivers on a shared race clock.
- Click a name in the leaderboard to focus on that driver.
- Follow recorded race positions and intervals as the replay progresses.
- Play synchronised race commentary with a volume control.

## Prerequisites
- **.NET 10 SDK**
- **Node.js and npm** (developed using Node.js 26)
- A browser that supports local HTTPS connections

A database and Docker are **not required**. The app reads saved JSON files from the server project.

## Guide to running it locally
Open a terminal in the repository’s root directory `asp.net-react-template`.
1. Install the frontend dependencies:
   ```bash
   cd asp.net-react-template.client
   npm ci
   cd ..
   ```

2. Restore the .NET dependencies:
   ```bash
   dotnet restore asp.net-react-template.slnx
   ```

3. If your browser does not trust the local development certificate, run:
   ```bash
   dotnet dev-certs https --trust
   ```

4. Start the application:
   ```bash
   dotnet run --project asp.net-react-template.Server --launch-profile https
   ```

The development setup starts the ASP.NET Core server and the Vite frontend. Open **https://localhost:60435** to use the app. The API runs at **https://localhost:7166**.

If the frontend does not start automatically, open a second terminal in `asp.net-react-template.client` and run:

```bash
npm run dev
```

Stop the running process with `Ctrl+C`.

## Commentary audio
The MP3 is **not included in this repository**. You can [download the commentary MP3 from Google Drive](https://drive.google.com/file/d/1pRLaZ7_4diyf2pvTdirMJ9Y4T-LF0UD6/view?usp=drive_link). Google Drive may temporarily limit downloads if its quota is exceeded.

After downloading it, open `asp.net-react-template.Server/Controllers/ReplayController.cs` and edit the `localPath` assignment in `GetCommentary` to point to your copy:

```csharp
var localPath = "/absolute/path/to/your/commentary.mp3";
```

On Windows, use a path such as `@"C:\Users\YourName\Downloads\commentary.mp3"`. Keep the MP3 outside the repository. The rest of the app works without commentary.

## Project structure
```text
asp.net-react-template.Server/
  Controllers/       ASP.NET Core API endpoints
  data/              Saved driver, lap and replay JSON data

asp.net-react-template.client/
  src/App.tsx         Main views and lap table
  src/RaceReplay.tsx  Map, leaderboard and replay controls
  src/replayMath.ts   Position and timing lookup helpers
```
The React app requests data from the ASP.NET Core API through Vite’s development proxy. Useful endpoints include `/api/drivers`, `/api/laps` and `/api/replay`.

## Checks

From `asp.net-react-template.client`:
```bash
npm run lint
npm run build
```

From `asp.net-react-template`:
```bash
dotnet build asp.net-react-template.slnx
```
These checks help catch code errors before sharing the project, but they do not replace opening the app and testing the features yourself.

## Data and limitations

The saved race data comes from [OpenF1](https://openf1.org/docs/). The circuit outline is traced from recorded car positions, so it is an approximate map rather than an official circuit drawing. Driver markers use sampled positions; they may disappear where location data is missing. Leaderboard positions and intervals show the latest recorded updates at the selected replay time, rather than continuously calculated live timing.

Bottas’s Turn 15 crash is marked using his final recorded location. He had completed 49 laps and was partway through his own lap 50 when the leaders were on race lap 51.

**Known limitation**: The Albon crash at lap 31, Franco-Gasly–Lando crash at lap 36 are not yet represented accurately in the race replay.