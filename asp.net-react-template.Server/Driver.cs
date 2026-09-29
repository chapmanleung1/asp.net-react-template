using System.Text.Json.Serialization;

namespace asp.net_react_template.Server;

public class Driver
{
    [JsonPropertyName("driver_number")]
    public int DriverNumber { get; set; }

    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = "";

    [JsonPropertyName("team_name")]
    public string TeamName { get; set; } = "";
}
