const router = require('express').Router()
const { get_user_photos, delete_flickr_photo } = require(`${process.env.PWD}/services/flickr`)

router.route('/')
.get(async (req, res) => {
    // default 188154180@N06
    let photos = await get_user_photos({ id: req.body.id || '188154180@N06' })
    return res.json(photos)
})

// router.route('/delete_all')
// .delete (async (req, res) => {
//     let { photos } = await get_user_photos({ id: req.body.id || '188154180@N06' })
//     await Promise.all(
//         photos.photo.map(async (photo) => {
//             console.log('PHOTO ID ', photo.id )
//             try {
//                 let deletion = await delete_flickr_photo(req, res, {
//                     user: req.body.id || '188154180@N06',
//                     id: photo.id
//                 })

//                 return deletion
                    
//             } catch (error) {
//                 return error;
//             }
//         })
//     )
//     return res.json(photos)
// })



module.exports = router