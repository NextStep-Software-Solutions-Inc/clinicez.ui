export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DATABASE_URL_UNPOOLED
    }
  }
}
