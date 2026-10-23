using System.Reflection;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.Server.Middlewares;

// Guards the AG-UI history normalisation that runs before MAF/Gemini.
// Regression target: an earlier "nuclear" sanitizer wiped every role=tool and
// every assistant toolCall, so on each tool-resume run the model no longer saw
// that the tool had already executed -> re-planned the whole flow -> tool ->
// resume -> infinite loop -> 429. These checks assert the tool context survives.

int checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception("FAIL " + name);
    checks++;
    Console.WriteLine("PASS " + name);
}

JsonObject User(string text) => new() { ["role"] = "user", ["content"] = text };
JsonObject Reasoning(string text) => new() { ["role"] = "reasoning", ["content"] = text };

JsonObject Assistant(string? text, params string[] callIds)
{
    var message = new JsonObject { ["role"] = "assistant" };
    if (text is not null) message["content"] = text;
    if (callIds.Length > 0)
    {
        var calls = new JsonArray();
        foreach (var id in callIds)
            calls.Add(new JsonObject
            {
                ["id"] = id,
                ["type"] = "function",
                ["function"] = new JsonObject { ["name"] = "navigateToCvEditor", ["arguments"] = "{}" }
            });
        message["toolCalls"] = calls;
    }
    return message;
}

JsonObject Tool(string callId, string text) => new()
{
    ["role"] = "tool",
    ["toolCallId"] = callId,
    ["content"] = text
};

JsonArray History(params JsonObject[] messages)
{
    var array = new JsonArray();
    foreach (var message in messages) array.Add(message);
    return array;
}

string[] Roles(JsonArray messages) => messages.Select(m => m!["role"]!.GetValue<string>()).ToArray();
int CallCount(JsonArray messages, int index) => messages[index]!["toolCalls"] is JsonArray calls ? calls.Count : 0;
bool HasCall(JsonArray messages, int index, string id)
    => messages[index]!["toolCalls"] is JsonArray calls
       && calls.Any(c => c!["id"]!.GetValue<string>() == id);
string? TextAt(JsonArray messages, int index) => messages[index]!["content"]?.GetValue<string>();

var type = typeof(AguiReasoningRoleMiddleware);
var middleware = Activator.CreateInstance(
    type,
    new object?[] { (RequestDelegate)(_ => Task.CompletedTask), NullLogger<AguiReasoningRoleMiddleware>.Instance })!;
var sanitize = type.GetMethod("Sanitize", BindingFlags.NonPublic | BindingFlags.Instance)!;
var repair = type.GetMethod("RepairOrphanToolTurns", BindingFlags.NonPublic | BindingFlags.Instance)!;
var fixArgs = type.GetMethod("SanitizeToolCallArguments", BindingFlags.NonPublic | BindingFlags.Instance)!;

void Run(JsonArray messages)
{
    sanitize.Invoke(middleware, new object[] { messages });
    repair.Invoke(middleware, new object[] { messages, "check" });
    fixArgs.Invoke(middleware, new object[] { messages, "check" });
}

// 1. The anti-loop invariant: a tool-resume run keeps the assistant toolCall
//    that produced the result, so the model resumes instead of re-planning.
var h = History(User("tạo cv"), Assistant("đang mở trình soạn", "c1"), Tool("c1", "ok"));
Run(h);
Check(h.Count == 3 && Roles(h).SequenceEqual(new[] { "user", "assistant", "tool" }), "Valid tool resume keeps user/assistant/tool turns");
Check(HasCall(h, 1, "c1"), "Assistant toolCall survives so model does not re-plan (loop guard)");

// 2. reasoning messages removed (MAF 500 "Unknown chat role: reasoning").
h = History(User("a"), Reasoning("..."), Assistant("trả lời"));
Run(h);
Check(Roles(h).SequenceEqual(new[] { "user", "assistant" }), "reasoning message removed");

// 3. consecutive assistant turns merged: an assistant(toolCall) sitting right
//    after assistant(text) triggers Gemini 400.
h = History(User("a"), Assistant("Bước 1"), Assistant(null, "c1"), Tool("c1", "ok"));
Run(h);
Check(h.Count == 3 && Roles(h).SequenceEqual(new[] { "user", "assistant", "tool" }), "Adjacent assistant turns merged before tool result");
Check(TextAt(h, 1) == "Bước 1" && CallCount(h, 1) == 1, "Merged assistant keeps text and the tool call");

// 4. orphan toolCall (tool result lost on navigation unmount): drop the call,
//    keep the assistant text so the turn is still valid.
h = History(User("a"), Assistant("đã mở editor", "c1"));
Run(h);
Check(h.Count == 2 && CallCount(h, 1) == 0 && TextAt(h, 1) == "đã mở editor", "Orphan toolCall drops the call but keeps assistant text");

// 5. orphan tool result (no preceding call) dropped.
h = History(User("a"), Tool("c1", "ok"));
Run(h);
Check(Roles(h).SequenceEqual(new[] { "user" }), "Orphan tool result dropped");

// 6. leading non-user trimmed (Gemini forbids a model turn first).
h = History(Assistant(null, "c1"), Tool("c1", "ok"), User("a"));
Run(h);
Check(Roles(h).SequenceEqual(new[] { "user" }), "Leading non-user turns trimmed");

// 7. multiple independent tool turns all preserved.
h = History(User("a"), Assistant("t1", "c1"), Tool("c1", "ok"), Assistant("xong"), User("b"), Assistant("t2", "c2"), Tool("c2", "ok"));
Run(h);
Check(h.Count == 7 && HasCall(h, 1, "c1") && HasCall(h, 5, "c2") && Roles(h)[3] == "assistant", "Multiple tool turns all preserved");

// 8. plain conversation untouched.
h = History(User("a"), Assistant("hello"));
Run(h);
Check(h.Count == 2 && Roles(h).SequenceEqual(new[] { "user", "assistant" }), "Plain conversation passes through unchanged");

Console.WriteLine($"Completed {checks} AG-UI history sanitize checks.");
