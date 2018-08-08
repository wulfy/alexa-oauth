'use strict'
const app = require('./app')
const port = process.env.PORT || 4400

// Start listening for requests.
app.listen(port,function () {
  console.log(` app listening on port ${port}!`)
});