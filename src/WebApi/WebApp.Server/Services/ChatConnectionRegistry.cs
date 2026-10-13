using System.Collections.Concurrent;
using System.Security.Claims;

namespace WebApp.Server.Services;

// In-process subscriptions, never used as proof of authorization. Every delivery
// rechecks the stored principal against current DB permissions and membership.
public sealed class ChatConnectionRegistry
{
    private readonly ConcurrentDictionary<string, (ClaimsPrincipal User, int ConversationId)> _subscriptions = new();
    public void Join(string connectionId, ClaimsPrincipal user, int conversationId) => _subscriptions[connectionId] = (user, conversationId);
    public void Leave(string connectionId, int conversationId)
    {
        if (_subscriptions.TryGetValue(connectionId, out var entry) && entry.ConversationId == conversationId) Remove(connectionId);
    }
    public void Remove(string connectionId) => _subscriptions.TryRemove(connectionId, out _);
    public IEnumerable<(string ConnectionId, ClaimsPrincipal User)> ForConversation(int id) => _subscriptions
        .Where(x => x.Value.ConversationId == id).Select(x => (x.Key, x.Value.User)).ToArray();
}
