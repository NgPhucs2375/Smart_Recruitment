namespace Application.Services.Embedding
{
    public static class SemanticSimilarity
    {
        /// <summary>
        /// Tính tích vô hướng của hai vector.
        /// A · B = Σ(Ai * Bi)
        /// </summary>
        private static double DotProduct(
            float[] a,
            float[] b)
        {
            if (a.Length != b.Length)
            {
                throw new ArgumentException(
                    "Vector dimensions do not match.");
            }

            double score = 0;

            for (var i = 0; i < a.Length; i++)
            {
                score += a[i] * b[i];
            }

            return score;
        }


        /// <summary>
        /// Chuẩn hóa vector về vector đơn vị.
        /// v_normalized = v / ||v||
        /// </summary>
        private static float[] Normalize(float[] vector)
        {
            double sumSquares = 0;

            foreach (var value in vector)
            {
                sumSquares += value * value;
            }

            var magnitude = Math.Sqrt(sumSquares);

            if (magnitude == 0)
            {
                return vector;
            }

            return vector
                .Select(x => (float)(x / magnitude))
                .ToArray();
        }


        /// <summary>
        /// Tính Cosine Similarity giữa hai vector.
        /// </summary>
        public static double CosineSimilarity(
            float[] vectorA,
            float[] vectorB)
        {
            var a = Normalize(vectorA);
            var b = Normalize(vectorB);

            return DotProduct(a, b);
        }
    }
}