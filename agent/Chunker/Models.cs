namespace RecruitmentAgent.Chunker;

/// <summary>
/// Configures the text splitter. Mirrors form-filling
/// <c>agent/Chunker/Models.cs :: SplitterConfig</c>.
/// </summary>
public sealed class SplitterConfig
{
    public int ChunkSize { get; set; } = SimpleChunker.DefaultChunkSize;
    public int ChunkOverlap { get; set; } = SimpleChunker.DefaultChunkOverlap;
    public string[] Separators { get; set; } = ["\n\n", "\n", "。"];
}

/// <summary>Mirrors form-filling <c>Chunk</c>.</summary>
public sealed class Chunk
{
    public string Content { get; set; } = "";
    public int Seq { get; set; }
    public int Start { get; set; }
    public int End { get; set; }

    public string EmbeddingContent() => Content.Trim();
}

/// <summary>Mirrors form-filling <c>ChildChunk</c>.</summary>
public sealed class ChildChunk
{
    public Chunk Chunk { get; set; } = new();
    public int ParentIndex { get; set; } = -1;
}

/// <summary>Mirrors form-filling <c>ParentChildResult</c>.</summary>
public sealed class ParentChildResult
{
    public List<Chunk> Parents { get; set; } = [];
    public List<ChildChunk> Children { get; set; } = [];
}
