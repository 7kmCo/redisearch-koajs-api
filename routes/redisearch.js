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
  ctx.body = typeof posts
  if (typeof posts == 'object') {
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
  } else {
    ctx.body = {
      code: 500,
      message: 'Can not inser data'
    }
  }
})

/**
* Add data to index
*
* @param string indexName     Index name
* @param string language      Language of data
* @param integer id           Post id
* @param object fields        Fields data to be added to index
* @returns object
*/
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
* Get suggestion
*
* @param request
* @returns
*/
router.post('/suggest/get', async (ctx, next) => {
  const indexName = ctx.request.body.indexName + 'Sugg'
  const query = ctx.request.body.query
  const fuzzy = ctx.request.body.fuzzy || 'FUZZY'
  const withPayloads = ctx.request.body.withPayloads || 'WITHPAYLOADS'
  const max = ctx.request.body.max || 10
  const suggCommand = [ indexName, query, fuzzy, withPayloads, 'MAX', max ] 
  try {
    ctx.body = await command('FT.SUGGET', suggCommand)
  } catch (error) {
    ctx.body = {
      message: 'Error getting suggestion.',
      error
    }
  }
})

/**
* Add suggestion
*
* @param request
* @returns
*/
router.post('/suggest/add', async (ctx, next) => {
  const indexName = ctx.request.body.indexName + 'Sugg'
  const title = ctx.request.body.title
  const score = ctx.request.body.score || 1
  const payload = ctx.request.body.payload
  ctx.body = await addSuggestion(indexName, title, score, payload)
})


/**
* Add suggestion in bulk
*
* @param request
* @returns
*/
router.post('/suggest/bulk', async (ctx, next) => {
  const indexName = ctx.request.body.indexName + 'Sugg'
  const posts = ctx.request.body.posts
  if (typeof posts == 'object') {
    for (let post of posts) {
      const title = post.title
      const score = post.score
      const payload = post.payload
      await addSuggestion(indexName, title, score, payload)
    }
    ctx.body = {
      code: 201,
      message: 'Documents are added to suggestion'
    }
  } else {
    ctx.body = {
      code: 500,
      message: 'Can not inser data'
    }
  }
})


/**
* Add suggestion to index
*
* @param string indexName     Index name
* @param string title         Title of the post
* @param integer score        Score given to a title
* @param string payload       Some extra data like post id to be used later
* @returns bool
*/
const addSuggestion = async (indexName, title, score, payload) => {
  const suggesyCommand = [ indexName, title, score, 'PAYLOAD', payload ] 
  try {
    return await command('FT.SUGADD', suggesyCommand)
  } catch (error) {
    return {
      message: 'Error inserting suggestion into index.',
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
