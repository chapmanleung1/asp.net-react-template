using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace asp.net_react_template.Server.Controllers;

[ApiController]
[Route("api/replay")]
public class ReplayController : ControllerBase
{
    private const string CommentaryFileName = "Formula1.2026.Round15.Azerbaijan.Race.SKY.F1TV.WEB-DL.1080p.H264.English-MWR.mp3";
    // fallback to local .mp3
    private const string CommentaryUrl = "https://drive.usercontent.google.com/download?id=1pRLaZ7_4diyf2pvTdirMJ9Y4T-LF0UD6&export=download&confirm=t";
    // unreliable source using Google Drive
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpClientFactory _httpClientFactory;

    public ReplayController(IWebHostEnvironment environment, IHttpClientFactory httpClientFactory)
    {
        _environment = environment;
        _httpClientFactory = httpClientFactory;
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

    [HttpGet("commentary")]
    public async Task<IActionResult> GetCommentary(CancellationToken cancellationToken)
    {
        if (_environment.IsDevelopment())
        {
            var localPath = Environment.GetEnvironmentVariable("COMMENTARY_MP3_PATH") // EDIT THE LOCAL PATH HERE
                ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", CommentaryFileName);
            if (System.IO.File.Exists(localPath))
                return PhysicalFile(localPath, "audio/mpeg", enableRangeProcessing: true);
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, CommentaryUrl);
        if (Request.Headers.TryGetValue("Range", out var range))
            request.Headers.TryAddWithoutValidation("Range", range.ToString());

        try
        {
            using var response = await _httpClientFactory.CreateClient().SendAsync( // waiting until firm connection via http
                request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!response.IsSuccessStatusCode || response.Content.Headers.ContentType?.MediaType != "audio/mpeg") // failure to fetch fallback
                return StatusCode(StatusCodes.Status502BadGateway, "Commentary is unavailable from Google Drive.");

            Response.StatusCode = (int)response.StatusCode;
            Response.ContentType = "audio/mpeg";
            Response.Headers.AcceptRanges = "bytes";
            if (response.Content.Headers.ContentRange is { } contentRange) // parts of contents sent
                Response.Headers.ContentRange = contentRange.ToString();
            if (response.Content.Headers.ContentLength is { } contentLength) // bytes in the response
                Response.ContentLength = contentLength;

            await using var audio = await response.Content.ReadAsStreamAsync(cancellationToken); // open as a stream from drive
            await audio.CopyToAsync(Response.Body, cancellationToken); // stream progressively
            return new EmptyResult();
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, "Commentary is unavailable from Google Drive.");
        }
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
