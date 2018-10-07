const Router = require('koa-router')
const router = new Router()

// Redis routes
const redisearch = require('./redisearch')
router.use('/redisearch', redisearch.routes())

module.exports = router