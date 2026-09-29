using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace asp.net_react_template.Server.Controllers;

[ApiController]
[Route("api/drivers")]
public class DriversController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public DriversController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<List<Driver>>> Get(CancellationToken cancellationToken)
    {
        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "data",
            "azerbaijan-2026-drivers.json"
        );
        var json = await System.IO.File.ReadAllTextAsync(filePath, cancellationToken);
        var drivers = JsonSerializer.Deserialize<List<Driver>>(json) ?? new List<Driver>();

        return Ok(drivers.OrderBy(driver => driver.DriverNumber).ToList());
    }
}
