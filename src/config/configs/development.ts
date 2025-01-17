export const config = {
  application: {
    PORT: Number(process.env.PORT),
    BCRYPT_SALT: Number(process.env.BCRYPT_SALT),
    HOST: process.env.HOST,
    ENV: 'development',
    isProd: false,
    CLIENT_URL: process.env.CLIENT_URL,
  },
  database: {
    DB_CONNECTOR: process.env.DB_CONNECTOR,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_PORT: Number(process.env.DB_PORT),
    DATABASE_URL: process.env.DATABASE_URL,
  },

  redis: {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: Number(process.env.REDIS_PORT),
    REDIS_URL: process.env.REDIS_URL,
  },
  secrets: {
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    JWT_REFRESH_PRIVATE_KEY: process.env.JWT_REFRESH_PRIVATE_KEY,
    JWT_CLIENT_PRIVATE_KEY: process.env.JWT_CLIENT_PRIVATE_KEY,
    JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
    JWT_ALGORITHM: process.env.JWT_ALGORITHM,
    JWT_EXPIRE_TIME: Number(process.env.JWT_EXPIRE_TIME),
    JWT_EXPIRE_REFRESH_TIME: Number(process.env.JWT_EXPIRE_REFRESH_TIME),
    SESSION_SECRET: process.env.SESSION_SECRET,
  },

  s3Bucket: {
    AWS_S3_BUCKET_REGION: process.env.AWS_S3_BUCKET_REGION,
    AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    AWS_S3_API_VERSION: process.env.AWS_S3_API_VERSION,
  },

  urls: {
    infura_url: process.env.INFURA_URL,
    infura_api_key: process.env.INFURA_API_KEY,
    infura_secret: process.env.INFURA_SECRET,
    bsc_rpc: process.env.BSC_NODE,
  },
};
