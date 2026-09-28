using Microsoft.AspNetCore.Mvc;

namespace asp.net_react_template.Server.Controllers;

[ApiController]
[Route("api/race-results")]
public class RaceResultsController : ControllerBase
{
    [HttpGet]
    public IEnumerable<RaceResult> Get()
    {
        return new[]
        {
            // dummy data
            new RaceResult { Position = 1, DriverName = "Driver A", Points = 25 },
            new RaceResult { Position = 2, DriverName = "Driver B", Points = 18 },
            new RaceResult { Position = 3, DriverName = "Driver C", Points = 15 }
        };
    }
}