const router = require('express').Router()
const fs = require('fs');
const multer = require('multer');
const { upload_flickr_photo, get_photo_info } = require(`${process.env.PWD}/services/flickr`)


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('DESTINATION MULTER MIDDLEWARE', file)
        if (fs.existsSync(`${process.env.PWD}/public${req.body.path || ''}`)) {
            cb(null, `./public${req.body.path || ''}`)
        } else {
            console.log('MAKING DIRECTORY')
            fs.mkdir(`./public${req.body.path || ''}`, (err) => {
                if (err) { return console.error(err) }
                cb(null, `./public${req.body.path || ''}`)
            })
        }
    },
    filename: function (req, file, cb) {
      cb(null, `${req.body.title || req.body.name || file.originalname.replace(/\.png|\.jpeg|\.jpg/, '')}_${Date.now()}.${file.mimetype.split('/')[1]}`)
    }
  })
   
const upload = multer({ storage: storage })

router.route('/multiple')
.post(upload.array('photo', 20), async (req, res) => {
    if (!req.body) { return res.status(401).json({ error: 'Body required' })}

    let created_photos = []
    await Promise.all(
        req.files.map((async photo => {
            try {
                console.log('ASK FLICKR:' + photo.filename)
                let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo })
                let photos_details = await get_photo_info ({ id: upload.photoid._content })
                let { farm, server, id, secret, originalsecret } = photos_details.photo
                let photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}.png`
                let _photo = await models.photos.create({
                    folderId: req.body.folderId / 1,
                    file: photoUrl
                })
                created_photos.push(_photo)
                fs.access(`${process.env.PWD}/${photo.path}`, fs.constants.F_OK, (err) => {
                    if (err) { return console.error(err) }
                    fs.unlink(`${process.env.PWD}/${photo.path}`, (err) => {
                        if(err) { return console.error(err) }
                    })
                });
                return _photo
            } catch (error) {
                console.error({
                    error,
                    photo
                })
                return error
            }
        }))
    )
    return res.json(created_photos)
})

router.route('/:id?')
.get(async (req, res) => {
    if (req.params.id) {
        let photo = await models.photos.findByPk(req.params.id / 1, {
            include: [
                {
                    model: models.folder,
                    as: 'folder'
                }
            ]
        })
        return res.json(photo)
    }
    let photos = await models.photos.findAll({
        include: [
            {
                model: models.folder,
                as: 'folder'
            }
        ]
    })
    return res.json(photos)
})

.post(upload.single('photo'), async (req, res) => {

    if (!req.body) { return res.status(401).json({ error: 'Body required' })}
    // Upload to Flickr

    let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo: req.file })
    let photos_details = await get_photo_info ({ id: upload.photoid._content })
    let { farm, server, id, secret, originalsecret } = photos_details.photo
    let photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}.png`

    let photo = await models.photos.create({
        folderId: req.body.folderId / 1,
        title: req.body.title,
        file: photoUrl,
        year: req.body.date || Date.now(),
        description: req.body.description
    })
    fs.access(`${process.env.PWD}/${req.file.path}`, fs.constants.F_OK, (err) => {
        if (err) { return console.error(err) }
        fs.unlink(`${process.env.PWD}/${req.file.path}`, (err) => {
            if(err) { return console.error(err) }
        })
    });
    return res.json(photo)
})

.put(upload.single('photo'), async (req, res) => {
    if (!req.body || !req.params.id) { return res.status(401).json({ error: 'Body and id of folder required' })}
    let photo = await models.photos.findByPk(req.params.id / 1)
    if (req.file) {
        let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo: req.file })
        let photos_details = await get_photo_info ({ id: upload.photoid._content })
        let { farm, server, id, secret, originalsecret } = photos_details.photo
        var photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}.png`
    }

    await photo.update({
        ...(req.body.title ? { title: req.body.title } : { }),
        ...(req.body.description ? { description: req.body.description } : { }),
        ...(req.body.year ? { year: req.body.year } : { }),
        ...(req.body.folderId ? { folderId: req.body.folderId } : { }),
        ...(photoUrl ? { file: photoUrl } : {})
    })
    return res.json(photo)
})

.delete(async (req, res) => {
    if (!req.params.id) { return res.status(401).json({ error: 'id of folder required' })}
    let photo = await models.photos.findByPk(req.params.id);
    if (!photo) { return res.json({ message: 'This photo does not exists'})}

    //Deleting the file in the file system
    fs.access(`${process.env.PWD}/${photo.file}`, fs.constants.F_OK, (err) => {
        if (err) { return console.error(err) }
        fs.unlink(`${process.env.PWD}/${photo.file}`, (err) => {
            if(err) { return console.error(err) }
        })
    });

    //Delete photo from database
    let deleted_photo = await models.photos.destroy({
        where: {
            id: req.params.id
        }
    })

    return res.json({
        deleted_photo,
        photo
    })
})

module.exports = router