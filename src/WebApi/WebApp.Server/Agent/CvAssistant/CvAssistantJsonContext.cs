using System.Text.Json.Serialization;

namespace WebApp.Server.Agent.CvAssistant;

[JsonSerializable(typeof(CvStateSnapshot))]
internal sealed partial class CvAssistantJsonContext : JsonSerializerContext;
