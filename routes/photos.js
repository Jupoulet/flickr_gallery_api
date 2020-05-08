const router = require('express').Router()
const fs = require('fs');
const multer = require('multer');
const { upload_flickr_photo, get_photo_info, delete_flickr_photo, get_user_photos } = require(`${process.env.PWD}/services/flickr`)


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        db.request = 'Transfert...'
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
      cb(null, `${file.originalname.replace(/\.png|\.jpeg|\.jpg/, '')}.${file.mimetype.split('/')[1]}`)
    }
  })
   
const upload = multer({ storage: storage })

router.route('/multiple')
.post(upload.array('photo', 20), async (req, res) => {
    if (!req.body) { return res.status(401).json({ error: 'Body required' })}
    db.request = 'Transfert vers Flickr'

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
                    file: photoUrl,
                    title: photo.filename,
                    data: {
                        ...photo
                    }
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
    db.request = 'Terminé'

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
        ],
        order: [
            ['id', 'DESC']
        ]
    })
    return res.json(photos)
})

.post(upload.single('photo'), async (req, res) => {

    if (!req.body) { return res.status(401).json({ error: 'Body required' })}
    // Upload to Flickr
    db.request = 'Transfert vers Flickr'

    let upload = await upload_flickr_photo(req, res, { user: req.body.id, photo: req.file })
    let photos_details = await get_photo_info ({ id: upload.photoid._content })
    let { farm, server, id, secret, originalsecret } = photos_details.photo
    let photoUrl = `https://farm${farm}.staticflickr.com/${server}/${id}_${originalsecret}.png`

    let photo = await models.photos.create({
        folderId: req.body.folderId / 1,
        title: req.body.title,
        file: photoUrl,
        year: req.body.date || Date.now(),
        description: req.body,
        data: {
            ...req.file
        }
    })
    fs.access(`${process.env.PWD}/${req.file.path}`, fs.constants.F_OK, (err) => {
        if (err) { return console.error(err) }
        fs.unlink(`${process.env.PWD}/${req.file.path}`, (err) => {
            if(err) { return console.error(err) }
        })
    });
    db.request = 'Terminé'
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

    //Delete photo from Flickr
    await delete_flickr_photo(req, res, { user: req.body.id || '188154180@N06', id: photo.file.split('/').reverse()[0].split('_')[0] / 1 })

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

// router.route('/delete/all')
// .delete(async (req, res) => {
//     const photos =  await models.photos.findAll({
//         attributes: ['file', 'id']
//     })

//     photos.map((photo) => {
//         photo.photoId = photo.file.split('/').reverse()[0].split('_')[0] / 1
//     })

//     await Promise.all(
//         photos.map(async (photo) => {
//             try {
//                 let deletion = await delete_flickr_photo(req, res, { user: req.body.id, id: photo.photoId / 1 })

//                 return deletion
                    
//             } catch (error) {
//                 return error;
//             }
//         })
//     )

//     await models.photos.destroy({ truncate : true })


//     return res.json({ message: 'Finish' })

// })

module.exports = router