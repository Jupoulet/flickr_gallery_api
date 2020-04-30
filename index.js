const express = require('express')
require('dotenv').config();
const colors = require('colors')
const app = express()
const router = express.Router();
let cors = require('cors')
const bodyParser = require('body-parser');

const env = process.env.NODE_ENV || 'development'
global.BASE_URL = require('./config/endpoints.json')[env].baseUrl
global.FRONT_URL = require('./config/endpoints.json')[env].frontUrl
global.db = {
	users: new Map(),
	oauth: new Map()
}

global.models = require('./models');
global.Op = models.Sequelize.Op;

app.use(bodyParser.json());
app.use(cors())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use('/flickr', require(`${process.env.PWD}/routes/flickr.js`))
// app.use('/public', require(`${process.env.PWD}/routes/public.js`))
app.use('/folders', require(`${process.env.PWD}/routes/folders.js`))
app.use('/photos', require(`${process.env.PWD}/routes/photos.js`))

app.listen(process.env.PORT || 4000, function () {
  console.log(`[${env.toUpperCase()}]`[{ production: 'red' }[env] || 'blue'] + `Gallery API running on port `+  `${process.env.PORT || 4000}`.yellow)
})
