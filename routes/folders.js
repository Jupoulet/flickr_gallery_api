const router = require('express').Router()
const moment = require ('moment');
const multer = require('multer');
const fs = require('fs')
const { upload_flickr_photo, get_photo_info, delete_flickr_photo } = require(`${process.env.PWD}/services/flickr`)

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        db.request = 'Transfert...'

        console.log('DESTINATION MULTER MIDDLEWARE', file)
        if (fs.existsSync(`${process.env.PWD}/public${req.body.path || ''}`)) {
            console.log('Should store');
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
        console.log('FILENAME MULTER MIDDLEWARE', file)
      cb(null, `${file.originalname.replace(/\.png|\.jpeg|\.jpg/, '')}.${file.mimetype.split('/')[1]}`)
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
                    as: 'children',
                    include: [
                        {
                            model: models.photos,
                            as: 'photos',
                            order: [
                                ['id', 'DESC']
                            ]
                        }
                    ]
                },
                {
                    model: models.photos,
                    as: 'photos',
                    order: [
                        ['id', 'DESC']
                    ]
                }
            ]
        })

        return res.json({
            ...folder.dataValues,
            photos: folder.photos.sort((a, b) => a.title.replace(/\.[a-zA-Z]*/g, '') - b.title.replace(/\.[a-zA-Z]*/g, ''))
        })
    }
    let folders = await models.folder.findAll({
        where: {
            parentId: { [Op.eq]: null }
        },
        order: [
            ['year', 'DESC']
        ],
        include: [
            {
                model: models.folder,
                as: 'parent'
            },
            {
                model: models.folder,
                as: 'children',
                include: [
                    {
                        model: models.photos,
                        as: 'photos',
                        order: [
                            ['id', 'DESC']
                        ]
                    }
                ]
            },
            {
                model: models.photos,
                as: 'photos',
                order: [
                    ['id', 'DESC']
                ]
            }
        ]
    })
    return res.json(folders.sort((a,z) => {
        return z.date - a.date
    }))
})

.post(upload.single('photo'), async (req, res) => { // upload.single('photo')
    if (!req.body) { return res.status(401).json({ error: 'Body required' })}
    try {

        db.request = 'Transfert photo vers Flickr'
        let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo: req.file })
        let photos_details = await get_photo_info ({ id: upload.photoid._content })

        let { farm, server, id, secret } = photos_details.photo
        let photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}.png`
        var folder = await models.folder.create({
            name: req.body.name,
            mainPhoto: photoUrl,
            description: req.body.description || '',
            year: req.body.year || null,
            ...(req.body.parentId && { parentId: req.body.parentId / 1 } || { })
        })
    } catch (error) {
        console.error(error)
        db.request = 'Terminé'
        return res.end()
    }

    //Deleting the file in the file system
    fs.access(`${process.env.PWD}/${req.file.path}`, fs.constants.F_OK, (err) => {
        if (err) { return console.error(err) }
        fs.unlink(`${process.env.PWD}/${req.file.path}`, (err) => {
            if(err) { return console.error(err) }
        })
    });
    db.request = 'Terminé';
    return res.json(folder)
})

.put(upload.single('photo'), async (req, res) => {
    if (!req.body || !req.params.id) { return res.status(401).json({ error: 'Body and id of folder required' })}
    let folder = await models.folder.findByPk(req.params.id)

    if (req.file) {
        let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo: req.file })
        let photos_details = await get_photo_info ({ id: upload.photoid._content })
        let { farm, server, id, secret } = photos_details.photo
        var photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}.png`

        //Deleting the file in the file system
        fs.access(`${process.env.PWD}/${req.file.path}`, fs.constants.F_OK, (err) => {
            if (err) { return console.error(err) }
            fs.unlink(`${process.env.PWD}/${req.file.path}`, (err) => {
                if(err) { return console.error(err) }
            })
        });
    }
    await folder.update({
        ...(req.body.name ? { name: req.body.name } : { }),
        ...(req.body.description ? { description: req.body.description } : { }),
        ...(req.body.parentId ? { parentId: req.body.parentId } : { }),
        ...(photoUrl ? { mainPhoto: photoUrl } : { }),
        ...(req.body.year ? { year: moment(req.body.year, 'YYYY') } : { })
    })
    return res.json(folder)
})

.delete(async (req, res) => {
    if (!req.params.id) { return res.status(401).json({ error: 'id of folder required' })}
    const folder = await models.folder.findByPk(req.params.id)
    await models.folder.destroy({
        where: {
            id: req.params.id
        }
    })

    try {
        await delete_flickr_photo(req, res, { user: req.body.id || '188154180@N06', id: folder.mainPhoto.split('/').reverse()[0].split('_')[0] })
    } catch (error) {
        console.log(error)
    }

    return res.json(folder)
})

module.exports = router