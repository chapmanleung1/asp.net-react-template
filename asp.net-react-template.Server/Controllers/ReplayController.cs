using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace asp.net_react_template.Server.Controllers;

[ApiController]
[Route("api/replay")]
public class ReplayController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public ReplayController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet]
    public Task<ActionResult<JsonElement>> Get(CancellationToken cancellationToken)
    {
        return ReadReplayFile("manifest.json", cancellationToken);
    }

    [HttpGet("drivers/{driverNumber:int}")]
    public Task<ActionResult<JsonElement>> GetDriver(int driverNumber, CancellationToken cancellationToken)
    {
        if (driverNumber <= 0)
            return Task.FromResult<ActionResult<JsonElement>>(BadRequest("Driver number must be positive."));

        return ReadReplayFile($"{driverNumber}.json", cancellationToken);
    }

    private async Task<ActionResult<JsonElement>> ReadReplayFile(string name, CancellationToken cancellationToken)
    {
        var path = Path.Combine(_environment.ContentRootPath, "data", "replay", name);
        if (!System.IO.File.Exists(path))
            return NotFound("Replay data is unavailable for this driver or race.");

        var json = await System.IO.File.ReadAllTextAsync(path, cancellationToken);
        using var document = JsonDocument.Parse(json);
        return Ok(document.RootElement.Clone());
    }
}
