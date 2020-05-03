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

const get_albums = async ({ id } = { }) => {
    if (!id) { return }
    return new Promise(function (resolve, reject) {
        flickr.photosets.getList({ user_id: id })
        .then((result) => {
            resolve(result.body)
        })
        .catch((err) => {
            reject(err)
        })
    })
}

const get_album = async ({ album_id, user_id } = { }) => {
    if (!album_id) { return }
    return new Promise(function (resolve, reject) {
        flickr.photosets.getInfo({ user_id, photoset_id: album_id })
        .then((result) => {
            resolve(result.body)
        })
        .catch((err) => {
            reject(err)
        })
    })
}

const get_photos_album = async ({ user_id, album_id } = { }) => {
    if (!user_id || album_id) { return }
    return new Promise(function (resolve, reject) {
        flickr.photosets.getPhotos({ user_id, photoset_id: album_id })
        .then((result) => {
            resolve(result.body)
        })
        .catch((err) => {
            reject (err)
        })
    })
}

const get_user_photos = async ({ id } = { }) => {
    if (!id) { return }
    return new Promise(function (resolve, reject) {
        flickr.people.getPhotos({ user_id: id })
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


const delete_flickr_photo = async (req, res, { user, id } = { }) => {
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
        flickr.photos.delete({ photo_id: id })
        .then((result) => {
            console.log('HELLO DELETION', result.body)
            resolve(result)
        })
        .catch((err) => {
            console.log('Error')
            resolve(err)
        })
    })
}
module.exports = {
    upload_flickr_photo,
    get_photo_info,
    delete_flickr_photo,
    get_user_photos,
    get_albums,
    get_photos_album,
    get_album
}