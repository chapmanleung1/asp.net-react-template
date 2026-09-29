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
}