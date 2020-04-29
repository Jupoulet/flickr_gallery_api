var Flickr = require('flickr-sdk');
const fs = require('fs')
const flickr = new Flickr (process.env.FLICKR_CONSUMER_KEY)

const get_photo_info = async ({ id } = { }) => {
    if (!id) { return }
    return new Promise(function (resolve, reject) {
        flickr.photos.getInfo({ photo_id: id })
        .then((result) => {
            resolve(result.body)
        })
        .catch((err) => {
            reject(err)
        })
    })
}

const upload_flickr_photo = async (req, res, { user, photo } = { }) => {
    user = db.users.get(user);
    if (!user) {
        res.statusCode = 302;
        res.setHeader('location', `${BASE_URL}/flickr`);
        return res.end()
    }
    var auth = Flickr.OAuth.createPlugin(
      process.env.FLICKR_CONSUMER_KEY,
      process.env.FLICKR_CONSUMER_SECRET,
      user.oauthToken,
      user.oauthTokenSecret
    );

    return new Promise(function (resolve, reject) {
        new Flickr.Upload(auth, `${process.env.PWD}/${photo.path}`, {
          title: photo.filename || '',
          is_public: 1,
          content_type: photo.mimetype
        }).then(function (result) {
            resolve(result.body)
        }).catch(function (err) {
            reject(err)
        })

    })
}

module.exports = { upload_flickr_photo, get_photo_info }