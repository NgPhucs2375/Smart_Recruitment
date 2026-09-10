using System.Text.Json.Serialization;

namespace WebApp.Server.Extensions;

[JsonSerializable(typeof(CVStateSnapshot))]
internal sealed partial class SmartAgentSerializerContext : JsonSerializerContext;
