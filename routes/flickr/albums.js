const router = require('express').Router()
const { get_photos_album, get_albums, get_album } = require(`${process.env.PWD}/services/flickr`)

router.route('/photos/:albumId/:userId?')
.get (async (req, res) => {
    if (!req.params.albumId) { return res.status(403).json('Need an explciit album id')}
    console.log('GET photos albums', {
        user_id: req.params.user_id || '188154180@N06',
        albumId: req.params.albumId
    })
    let photos = await get_photos_album({
        user_id: req.params.user_id || '188154180@N06',
        albumId: req.params.albumId
    })

    return res.json(photos)
})


router.route('/:id?')
.get (async (req, res) => {
    if (req.params.id) {
        let photoset = await get_album({ album_id: req.params.id, user_id: '188154180@N06' })
        return res.json(photoset)
    }
    let galleries = await get_albums({ id: req.params.id || '188154180@N06' })
    return res.json(galleries)
})


module.exports = router