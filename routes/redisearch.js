const Router = require('koa-router')
const router = new Router()
const { promisify } = require('util')
const redis = require('redis')

// Create Redis Client
let client = redis.createClient()
const command = promisify(client.send_command).bind(client)

client.on('connect', () => {
  console.log('Connected to Redis client')
})

/**
* Redisearch index info.
*
* @param string index     index name
* @returns
*/
router.get('/info/:idx', async (ctx, next) => {
  const indexName = ctx.params.idx
  const info = await command('FT.INFO', [indexName])
  if (!info) {
    ctx.body = {
      error: 'There is some errors while retriving inex info.'
    }
  } else {
    ctx.body = info
  }
})

module.exports = router