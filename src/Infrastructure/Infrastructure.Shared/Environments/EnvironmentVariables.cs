using System;


namespace Infrastructure.Shared.Environments
{
    public static class EnvironmentVariables
    {
        #region Database
        public const string PostgresConnectionString = "POSTGRES_CONNECTION_STRING";
        public static bool HasPostgresConnectionString() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(PostgresConnectionString));
        public const string MySQLConnectionString = "MYSQL_CONNECTION_STRING";
        public static bool HasMySQLConnectionString() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(MySQLConnectionString));
        public const string SQLServerConnectionString = "SQLSERVER_CONNECTION_STRING";
        public static bool HasSQLServerConnectionString() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(SQLServerConnectionString));

        #endregion

        #region Redis Cache

        public const string RedisHost = "REDIS_HOST";
        public static bool HasRedisHost() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(RedisHost));
        public const string RedisPort = "REDIS_PORT";
        public static bool HasRedisPort() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(RedisPort));
        public const string RedisPassword = "REDIS_PASSWORD";
        public static bool HasRedisPassword() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(RedisPassword));

        #endregion

        #region ElasticSearch

        public const string ElasticCloudId = "ELASTIC_CLOUD_ID";
        public static bool HasElasticCloudId() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(ElasticCloudId));
        public const string ElasticApiKey = "ELASTIC_API_KEY";
        public static bool HasElasticApiKey() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(ElasticApiKey));

        #endregion

        #region Cloudinary
        public const string CloudinaryCloudUrl = "CLOUDINARY_URL";
        public static bool HasCloudinaryCloudUrl() => !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(CloudinaryCloudUrl));

        #endregion
    }
}
