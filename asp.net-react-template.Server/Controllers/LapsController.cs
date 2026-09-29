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
    public async Task<ActionResult<List<Lap>>> Get()
    {
        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "data",
            "azerbaijan-2026-max-laps.json"
        );

        var json = await System.IO.File.ReadAllTextAsync(filePath);

        var laps = JsonSerializer.Deserialize<List<Lap>>(json);

        return Ok(laps);
    }
}