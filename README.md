# Redisearch api

This repository is an rest api wrapper for RediSearch, for those who can't install redis and redisearch on their servers.


## Starting App

First of all, make sure redis-server is running with RediSearch module properly loaded. 

Then as usual, install node modules by running `npm install` and run `npm run dev` or `npm start`

This will start the application on port 3000 and is ready for serving api requests.

### Available endpoints and request payloads

For list of available endpoints and request body objects, please take a look at [/routes/redisearch.js](https://github.com/7kmCo/redisearch-koajs-api/blob/dev/routes/redisearch.js)

If there was enough enterests in this project, I will add more RediSearch functionality and complete documentation. 

**example search:**

request body to `http://localhost:3000/redisearch/search`:

```js
{
	"indexName": "indexName",
	"from": 0,
	"offset": 20,
	"query": "@title:%euo%@content:dolorem@date:[15253780 1525378723]",
	"noContent": false
}
```

For complete list of RediSearch commands, please check [redisearch official website](https://oss.redislabs.com/redisearch/Commands.html).


Any kind of suggestions pull requests and issues are highly appreciated.