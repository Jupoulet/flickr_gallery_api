var Flickr = require('flickr-sdk');
const router = require('express').Router()

var oauth = new Flickr.OAuth(
	process.env.FLICKR_CONSUMER_KEY,
	process.env.FLICKR_CONSUMER_SECRET
);

router.use('/photos', require(`${process.env.PWD}/routes/flickr/photos.js`))
router.use('/albums', require(`${process.env.PWD}/routes/flickr/albums.js`))
// var db = {
// 	users: new Map(),
// 	oauth: new Map()
// };

function getRequestToken(req, res) {
	oauth.request(`${BASE_URL}/flickr/oauth/callback`).then(function (_res) {
		var requestToken = _res.body.oauth_token;
		var requestTokenSecret = _res.body.oauth_token_secret;

		// store the request token and secret in the database
		db.oauth.set(requestToken, requestTokenSecret);

		// redirect the user to flickr and ask them to authorize your app.
		// perms default to "read", but you may specify "write" or "delete".
		res.statusCode = 302;
		res.setHeader('location', oauth.authorizeUrl(requestToken, 'delete'));
		res.end();

	}).catch(function (err) {
		res.statusCode = 400;
		res.end(err.message);
	});
}

function verifyRequestToken(req, res, query) {
	var requestToken = query.oauth_token;
	var oauthVerifier = query.oauth_verifier;

	// retrieve the request secret from the database
	var requestTokenSecret = db.oauth.get(requestToken);

	oauth.verify(requestToken, oauthVerifier, requestTokenSecret).then(function (_res) {
		var userNsid = _res.body.user_nsid;
		var oauthToken = _res.body.oauth_token;
		var oauthTokenSecret = _res.body.oauth_token_secret;
		var flickr;

		// store the oauth token and secret in the database
		db.users.set(userNsid, {
			oauthToken: oauthToken,
			oauthTokenSecret: oauthTokenSecret
		});

		// we no longer need the request token and secret so we can delete them
		db.oauth.delete(requestToken);

		// create a new Flickr API client using the oauth plugin
		flickr = new Flickr(oauth.plugin(
			oauthToken,
			oauthTokenSecret
        ));

        // make an API call on behalf of the user
        flickr.test.login().then((info, err) => {
        res.statusCode = 302;
        if (err) { 
            console.error(err)
            res.setHeader('location', `${FRONT_URL}/?auth=failed`);
        } else {
            res.setHeader('location', `${FRONT_URL}/admin?userId=${userNsid}`);
        }
        return res.end()
        })

	}).catch(function (err) {
		res.statusCode = 400;
		res.end(err.message);
	});
}

router.route('/').get (async (req, res) => {
    return getRequestToken(req, res)
})

router.route('/oauth/callback').get (async (req, res) => {
    return verifyRequestToken(req, res, req.query)
})

router.route('/verify_login/:userId').get (async (req, res) => {

    let user = db.users.get (req.params.userId)

    if (!user) {
        return res.json(false)
    }

    flickr = new Flickr(oauth.plugin(
        user.oauthToken,
        user.oauthTokenSecret
    ));

    // make an API call on behalf of the user
    flickr.test.login().then((info, err) => {
        if (err) {
            console.error(err)
            return res.json(false)
        } else {
            if (!['188154180@N06'].includes(info.body.user.id)) { return res.json(false) }
            return res.json(true)
        }
    })
})

module.exports = router;