namespace RecruitmentAgent.Chunker;

/// <summary>
/// Small self-contained port of form-filling <c>agent/Chunker/WeKnoraChunker.cs</c>
/// (recursive separator splitter + two-level parent/child chunking).
/// Protected-pattern handling (tables, code fences, LaTeX) was intentionally left
/// out to keep zero new dependencies; CV plain-text chunking does not need it.
/// Signature-compatible core: <c>SplitText</c> + <c>SplitTextParentChild</c>.
/// </summary>
public static class SimpleChunker
{
    public const int DefaultChunkSize = 1024;
    public const int DefaultChunkOverlap = 100;
    public const int AbsoluteMaxSize = 7500;

    public static List<Chunk> SplitText(string text, SplitterConfig cfg)
    {
        if (string.IsNullOrEmpty(text)) return [];

        var chunkSize = cfg.ChunkSize <= 0 ? DefaultChunkSize : cfg.ChunkSize;
        var chunkOverlap = cfg.ChunkOverlap < 0 ? 0 : cfg.ChunkOverlap;

        var units = SplitBySeparators(text, cfg.Separators, chunkSize);
        return MergeUnits(text, units, chunkSize, chunkOverlap);
    }

    public static ParentChildResult SplitTextParentChild(string text, SplitterConfig parentCfg, SplitterConfig childCfg)
    {
        if (string.IsNullOrEmpty(text)) return new ParentChildResult();

        var parents = SplitText(text, parentCfg);
        if (parents.Count == 0) return new ParentChildResult();

        var newParents = new List<Chunk>();
        var children = new List<ChildChunk>();
        var childSeq = 0;

        foreach (var parent in parents)
        {
            var subs = SplitText(parent.Content, childCfg);

            var parentIndex = -1;
            if (subs.Count > 1 || (subs.Count == 1 && subs[0].Content != parent.Content))
            {
                parentIndex = newParents.Count;
                newParents.Add(parent);
            }

            foreach (var sub in subs)
            {
                sub.Seq = childSeq;
                sub.Start += parent.Start;
                sub.End += parent.Start;
                children.Add(new ChildChunk { Chunk = sub, ParentIndex = parentIndex });
                childSeq++;
            }
        }

        return new ParentChildResult { Parents = newParents, Children = children };
    }

    private static List<string> SplitBySeparators(string text, string[] separators, int chunkSize)
    {
        if (string.IsNullOrEmpty(text) || separators.Length == 0) return [text];
        if (chunkSize > 0 && text.Length <= chunkSize) return [text];

        for (var i = 0; i < separators.Length; i++)
        {
            var sep = separators[i];
            if (sep.Length == 0) continue;

            var parts = text.Split(sep, StringSplitOptions.None);
            if (parts.Length <= 1) continue;

            var result = new List<string>();
            var remaining = separators.Skip(i + 1).ToArray();
            foreach (var p in parts)
            {
                if (chunkSize > 0 && p.Length > chunkSize && remaining.Length > 0)
                    result.AddRange(SplitBySeparators(p, remaining, chunkSize));
                else
                    result.Add(p);
            }
            return result;
        }

        return [text];
    }

    private static List<Chunk> MergeUnits(string text, List<string> units, int chunkSize, int chunkOverlap)
    {
        var chunks = new List<Chunk>();
        var current = new List<string>();
        var curLen = 0;
        var offset = 0;

        foreach (var u in units)
        {
            if (curLen + u.Length > chunkSize && current.Count > 0)
            {
                var content = string.Join("", current);
                var start = text.IndexOf(content, offset, StringComparison.Ordinal);
                if (start < 0) start = offset;
                chunks.Add(new Chunk { Content = content, Seq = chunks.Count, Start = start, End = start + content.Length });
                offset = start + content.Length;

                if (chunkOverlap > 0)
                {
                    var overlap = new List<string>();
                    var overlapLen = 0;
                    for (var i = current.Count - 1; i >= 0; i--)
                    {
                        if (overlapLen + current[i].Length > chunkOverlap) break;
                        overlapLen += current[i].Length;
                        overlap.Insert(0, current[i]);
                    }
                    current = overlap;
                    curLen = overlapLen;
                }
                else
                {
                    current = [];
                    curLen = 0;
                }
            }

            current.Add(u);
            curLen += u.Length;
        }

        if (current.Count > 0)
        {
            var content = string.Join("", current);
            var start = text.IndexOf(content, offset, StringComparison.Ordinal);
            if (start < 0) start = offset;
            if (content.Length > AbsoluteMaxSize)
                content = content[..AbsoluteMaxSize];
            chunks.Add(new Chunk { Content = content, Seq = chunks.Count, Start = start, End = start + content.Length });
        }

        return chunks;
    }
}
