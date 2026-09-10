using Microsoft.Agents.AI;

namespace RecruitmentAgent.AgentFactories;

/// <summary>
/// Mirrors form-filling <c>agent/AgentFactories/IAgentFactory.cs</c>.
/// <c>Route</c> is informational only: this project has NO Minimal API
/// (no <c>MapEndpoints</c>/<c>EndpointGroupBase</c>), so agents are exposed
/// through the existing <c>MapAGUIServer</c> + Controllers pipeline.
/// </summary>
public interface IAgentFactory
{
    string Route { get; }
    AIAgent CreateAgent();
}
