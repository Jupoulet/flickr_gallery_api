const router = require('express').Router()
const fs = require('fs')
const sharp = require('sharp')

const resize = ({ path, format, width, height }) => {
    const readStream = fs.createReadStream(path)
    let transform = sharp()
    if (!['png', 'jpg', 'jpeg'].includes(format)) {
        return readStream.pipe()
    }
    if (format) {
        transform = transform.toFormat(format)
    }

    if (width || height) {
        transform = transform.resize(width, height, { fit: 'inside' })
    }
    return readStream.pipe(transform)
}

router.route('/*').get(async (req, res) => {
    let type = req.params[0].split('/').reverse()[0].split('.')[1]
    res.type(`image/${type}`);
    fs.access(`${process.env.PWD}/public/${req.params[0]}`, fs.constants.F_OK, (err) => {
        if (err) { return res.status(404).end() }
        return resize({
            path: `${process.env.PWD}/public/${req.params[0]}`,
            format: type,
            width: req.query.width / 1 || null,
            height: req.query.height / 1 || null
        }).pipe(res)
    })
})


module.exports = router;