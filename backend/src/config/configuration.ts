export default (): Record<string, unknown> => ({
  port: parseInt(process.env.PORT ?? '4001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret',
    expiresIn: '7d',
  },
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3001').split(','),
});
