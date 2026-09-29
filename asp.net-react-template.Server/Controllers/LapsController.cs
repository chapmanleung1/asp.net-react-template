using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace asp.net_react_template.Server.Controllers;

[ApiController]
[Route("api/laps")]
public class LapsController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public LapsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<List<Lap>>> Get([FromQuery] int? driverNumber, CancellationToken cancellationToken)
    {
        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "data",
            "azerbaijan-2026-laps.json"
        );

        if (driverNumber.HasValue && driverNumber.Value <= 0)
        {
            return BadRequest("Driver number must be positive.");
        }

        var json = await System.IO.File.ReadAllTextAsync(filePath, cancellationToken);

        var laps = JsonSerializer.Deserialize<List<Lap>>(json) ?? new List<Lap>();

        // Without a driver number, return laps for every driver in this race.
        var selectedLaps = laps.Where(lap =>
            !driverNumber.HasValue || lap.DriverNumber == driverNumber.Value);

        return Ok(selectedLaps
            .OrderBy(lap => lap.DriverNumber)
            .ThenBy(lap => lap.LapNumber)
            .ToList());
    }
}
