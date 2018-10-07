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
  try {
    const info = await command('FT.INFO', [indexName])
    ctx.body = info
  } catch (error) {
    ctx.body = {
      error: 'There is some errors while retriving inex info.'
    }
  }
})


/**
* Create index with passed settings
*
* @param request
* @returns
*/
router.post('/create', async (ctx, next) => {

  const indexName = ctx.request.body.indexName
  const fieldsSchema = ctx.request.body.schema

  const schema = [indexName, 'SCHEMA', ...fieldsSchema]
  try {
    const created = await command('FT.CREATE', schema)
    ctx.body = created
  } catch (error) {
    ctx.body = {
      error: 'Error creating index'
    }
  }
})

/**
* Add to index
*
* @param request
* @returns
*/
router.post('/add', async (ctx, next) => {
  const indexName = ctx.request.body.indexName
  const language = ctx.request.body.language
  const id = ctx.request.body.id
  const fields = ctx.request.body.fields
  
  const insert = [ indexName, id , 1, 'LANGUAGE', language, 'FIELDS', ...fields ] 
  try {
    const inserted = await command('FT.ADD', insert)
    ctx.body = inserted
  } catch (error) {
    ctx.body = {
      error: 'Error inserting into index.'
    }
  }
})

/**
* Search
*
* @param request
* @returns
*/
router.post('/search', async (ctx, next) => {
  const query = ctx.request.body.query
  const indexName = ctx.request.body.indexName
  const from = ctx.request.body.from
  const offset = ctx.request.body.offset
  
  const searchCommand = [ indexName, query, 'NOCONTENT', 'LIMIT', from, offset ] 
  try {
    const searchResult = await command('FT.SEARCH', searchCommand)
    ctx.body = searchResult
  } catch (error) {
    ctx.body = {
      error: 'Error searching.'
    }
  }
})

/**
* Drop the index
*
* @param string idx       index name to be dropped
* @returns
*/
router.delete('/drop/:idx', async (ctx, next) => {
  const indexName = ctx.params.idx
  try {
    const dropped = await command('FT.DROP', [indexName])
    ctx.body = dropped
  } catch (error) {
    ctx.body = {
      error: 'There is some errors dropping the index.'
    } 
  }
})

module.exports = router