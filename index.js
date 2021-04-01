const express = require('express')
require('dotenv').config();
const colors = require('colors')
const app = express()
const router = express.Router();
let cors = require('cors')
const axios = require('axios')
const bodyParser = require('body-parser');

const { get_user_photos, get_photo_info } = require(`${process.env.PWD}/services/flickr`)

const env = process.env.NODE_ENV || 'development'
global.BASE_URL = require('./config/endpoints.json')[env].baseUrl
global.FRONT_URL = require('./config/endpoints.json')[env].frontUrl
global.db = {
	users: new Map(),
  oauth: new Map(),
  request: 'Terminé'
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

let scrapPhotTitle = (string) => {
  if (!string) return '';
  string = string.replace(/\.[A-Za-z]*|-[A-Za-z]*/g, '')
  if (string.length !== 11) return '';

  return string.slice(0,4)
}

app.use('/tools', require(`${process.env.PWD}/routes/tools.js`))
app.use('/flickr', require(`${process.env.PWD}/routes/flickr.js`))
app.use('/status', require(`${process.env.PWD}/routes/status.js`))
// app.use('/public', require(`${process.env.PWD}/routes/public.js`))
app.use('/folders', require(`${process.env.PWD}/routes/folders.js`))
app.use('/photos', require(`${process.env.PWD}/routes/photos.js`))
app.get('/regen/:user_id', async (req, res) => {
  console.log('HELLOOOO', req.params.user_id);
  return res.end()
  let photos = await get_user_photos({ id: req.params.user_id, per_page: 300, page: 11 })
  console.log ('PHOTOS', photos)

  let photos_ = photos.photos.photo
  let list_of_photo_uploaded = []

  let count = 1;
  res.end()

  for (let photo of photos_) {
    console.log (count)
    count ++;

    let info = await get_photo_info({ id: photo.id })
    let { farm, server, id, originalsecret } = info.photo
    let photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}.png`

    let title_folder = scrapPhotTitle(photo.title)

    if (!title_folder) {
      console.log ('No title ?', photo.title)
      continue
    };
    let [existing_folder] = await models.folder.findAll({ where: { name: title_folder }})

    if (!existing_folder) {

        existing_folder = await models.folder.create({
            name: title_folder,
            mainPhoto: photoUrl,
            description: `C'etait en ${title_folder}`,
            year: null
        })
        //Send Slack message
        axios.get(`https://hook.integromat.com/p8nyyz9kjx8wduqg5q6vr8esia7lp3jf?message=Nouveau dossier créé: ${existing_folder.name}`)
    }


    let [existing_photo] = await models.photos.findAll({ where: { title: photo.title }})

    if (existing_photo) continue;

    await models.photos.create({
      folderId: existing_folder.id,
      file: photoUrl,
      title: photo.title,
      data: {}
    })

    list_of_photo_uploaded.push(photo.title)

  }

  axios.get(`https://hook.integromat.com/p8nyyz9kjx8wduqg5q6vr8esia7lp3jf?message=Requete terminee, ${list_of_photo_uploaded.length} photos ont du etre uploadé sur la DB`)

  return
})

app.listen(process.env.PORT || 4000, function () {
  console.log(`[${env.toUpperCase()}]`[{ production: 'red' }[env] || 'blue'] + `Gallery API running on port `+  `${process.env.PORT || 4000}`.yellow)
})
