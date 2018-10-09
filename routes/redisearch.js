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
    ctx.body = await command('FT.INFO', [indexName])
  } catch (error) {
    ctx.body = {
      message: 'There is some errors while retriving inex info.',
      error
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
    ctx.body = await command('FT.CREATE', schema)
  } catch (error) {
    ctx.body = {
      message: 'Error creating index',
      error
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

  ctx.body = await indexIt(indexName, language, id, fields)
})

/**
* Bulk add to index
*
* @param request
* @returns
*/
router.post('/bulk', async (ctx, next) => {
  const indexName = ctx.request.body.indexName
  const posts = ctx.request.body.posts
  for (let post of posts) {
    const language = post.language
    const id = post.id
    const fields = post.fields
    await indexIt(indexName, language, id, fields)
  }
  ctx.body = {
    code: 201,
    message: 'Documents are inserted'
  }
})

const indexIt = async (indexName, language, id, fields) => {
  const insert = [ indexName, id , 1, 'LANGUAGE', language, 'FIELDS', ...fields ] 
  try {
    return await command('FT.ADD', insert)
  } catch (error) {
    return {
      message: 'Error inserting into index.',
      error
    }
  }
}
/**
* Update individual document
*
* @param request
* @returns
*/
router.patch('/update', async (ctx, next) => {
  const indexName = ctx.request.body.indexName
  const language = ctx.request.body.language
  const id = ctx.request.body.id
  const fields = ctx.request.body.fields
  // Since there is no update command, we need to first delete the document then insert it with new data.
  try {
    const deleted = await command('FT.DEL', [indexName, id, 'DD'])
    if (deleted) {
      const insert = [ indexName, id , 1, 'LANGUAGE', language, 'FIELDS', ...fields ] 
      try {
        ctx.body = await command('FT.ADD', insert)
      } catch (error) {
        ctx.body = {
          message: 'Error inserting into index.',
          error
        }
      }
    }
  } catch (error) {
    ctx.body = {
      message: 'Error deleting old document.',
      error
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
  const noContent = ctx.request.body.noContent || false
  const from = ctx.request.body.from
  const offset = ctx.request.body.offset
  
  const searchCommand = [ indexName, query, 'LIMIT', from, offset ] 
  if (noContent) {
    searchCommand.push('NOCONTENT')
  }
  try {
    ctx.body = await command('FT.SEARCH', searchCommand)
  } catch (error) {
    ctx.body = {
      message: 'Error searching.',
      error
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
    ctx.body = await command('FT.DROP', [indexName])
  } catch (error) {
    ctx.body = {
      message: 'There is some errors dropping the index.',
      error
    } 
  }
})

module.exports = router
