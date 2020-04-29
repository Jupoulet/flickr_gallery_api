const router = require('express').Router()
const multer = require('multer');
const fs = require('fs')
const { upload_flickr_photo, get_photo_info } = require(`${process.env.PWD}/services/flickr`)

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (fs.existsSync(`${process.env.PWD}/public${req.body.path || ''}`)) {
            cb(null, `./public${req.body.path || ''}`)
        } else {
            fs.mkdir(`./public${req.body.path || ''}`, (err) => {
                if (err) { return console.error(err) }
                cb(null, `./public${req.body.path || ''}`)
            })
        }
    },
    filename: function (req, file, cb) {
      cb(null, `${req.body.name || file.originalname}_${Date.now()}.${file.mimetype.split('/')[1]}`)
    }
  })
   
const upload = multer({ storage: storage })

router.route('/:id?')
.get(async (req, res) => {
    if (req.params.id) {
        let folder = await models.folder.findByPk(req.params.id / 1, {
            include: [
                {
                    model: models.folder,
                    as: 'parent'
                },
                {
                    model: models.folder,
                    as: 'children'
                },
                {
                    model: models.photos,
                    as: 'photos'
                }
            ]
        })
        return res.json(folder)
    }
    let folders = await models.folder.findAll({
        include: [
            {
                model: models.folder,
                as: 'parent'
            },
            {
                model: models.folder,
                as: 'children'
            }
        ]
    })
    return res.json(folders)
})

.post(upload.single('photo'), async (req, res) => { // upload.single('photo')
    if (!req.body) { return res.status(401).json({ error: 'Body required' })}

    let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo: req.file })
    let photos_details = await get_photo_info ({ id: upload.photoid._content })

    let { farm, server, id, secret } = photos_details.photo
    let photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}.png`
    let folder = await models.folder.create({
        name: req.body.name,
        mainPhoto: photoUrl,
        description: req.body.description || ''
    })

    //Deleting the file in the file system
    fs.access(`${process.env.PWD}/${req.file.path}`, fs.constants.F_OK, (err) => {
        if (err) { return console.error(err) }
        fs.unlink(`${process.env.PWD}/${req.file.path}`, (err) => {
            if(err) { return console.error(err) }
        })
    });

    return res.json(folder)
})

.put(async (req, res) => {
    if (!req.body || !req.params.id) { return res.status(401).json({ error: 'Body and id of folder required' })}
    let folder = await models.folder.findByPk(req.params.id)
    await folder.update({
        ...(req.body.name ? { name: req.body.name } : { }),
        ...(req.body.description ? { description: req.body.description } : { }),
        ...(req.body.parentId ? { parentId: req.body.parentId } : { }),
        ...(req.body.mainPhoto ? { mainPhoto: req.body.mainPhoto } : { })
    })
    return res.json(folder)
})

.delete(async (req, res) => {
    if (!req.params.id) { return res.status(401).json({ error: 'id of folder required' })}
    let folder = await models.folder.destroy({
        where: {
            id: req.params.id
        }
    })

    return res.json(folder)
})

module.exports = router