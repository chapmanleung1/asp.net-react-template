using System.Text.Json.Serialization;

namespace asp.net_react_template.Server;

public class Lap
{
    [JsonPropertyName("session_key")]
    public int SessionKey { get; set; }

    [JsonPropertyName("driver_number")]
    public int DriverNumber { get; set; }

    [JsonPropertyName("lap_number")]
    public int LapNumber { get; set; }

    [JsonPropertyName("lap_duration")]
    public double? LapDuration { get; set; }

    [JsonPropertyName("duration_sector_1")]
    public double? DurationSector1 { get; set; }

    [JsonPropertyName("duration_sector_2")]
    public double? DurationSector2 { get; set; }

    [JsonPropertyName("duration_sector_3")]
    public double? DurationSector3 { get; set; }

    [JsonPropertyName("is_pit_out_lap")]
    public bool IsPitOutLap { get; set; }
}
