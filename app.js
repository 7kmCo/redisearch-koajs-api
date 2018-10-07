const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const koaqs = require('koa-qs')
const cors = require('@koa/cors')
const router = require('./routes')

const app = new Koa()
koaqs(app)

app
  .use(bodyParser())
  .use(cors())
  .use(router.routes())
	.use(router.allowedMethods())

app.listen(3000)
