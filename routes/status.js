const router = require('express').Router()

router.route('/')
.get(async (req, res) => {
    return res.json(db.request);
})


module.exports = router