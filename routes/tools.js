const router = require('express').Router()
const moment = require('moment');

router.route('/sort_folders_by_years')
.get(async (req, res) => {
    const folders = await models.folder.findAll ()

    for (let folder of folders) {
        let date = folder.name.match (/2[0-9]{3}/g)
        await folder.update ({
            year: date / 1 ? moment(date) : moment('1993', 'YYYY')
        })
    }

    return res.json(folders.map(f => moment(f.year).format('YYYY') ))
})

module.exports = router;