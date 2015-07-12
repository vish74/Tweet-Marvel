var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var Twitter = require('twitter');
var config = require("../config");

var client = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});


exports.index = function (req, res) {
    res.render('index');
};
exports.tweet = function (req, res) {
    var tw = req.body.tweetinput;
    var sw = req.body.statusinput;


    var ts = parseInt(Date.now() / 1000, 10);
    var preHash = ts + config.privatekey + config.publickey, hash = crypto.createHash('md5').update(preHash).digest('hex');

    request({
        url: 'http://gateway.marvel.com/v1/public/characters'
        , json: true
        , qs: {
            ts: ts
            , apikey: config.publickey
            , hash: hash
            , name: tw
        }
    }, function (err, response) {
        if (err) {
            console.log(err);
            res.render('index');
        }
        else {
            try {
                var post_image = response.body.data.results[0].thumbnail.path + '.jpg';

                var download = function (uri, filename, callback) {
                    request.head(uri, function (err, res, body) {
                        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
                    });
                };
                download(post_image, 'image.jpg', function () {

                    var post_image_get = fs.readFileSync('image.jpg');

                    client.post('media/upload', {media: post_image_get}, function (error, media, response) {

                        if (!error) {
                            var status = {
                                status: sw,
                                media_ids: media.media_id_string // Pass the media id string
                            }
                            client.post('statuses/update', status, function (error, tweet, response) {
                                res.render('index',{state: 'Image Posted with Status'});
                            });

                        }
                    });


                });
            }
            catch (err) {
                res.render('index', {state: 'No Character Found / Character Image Not Found'});
            }
        }
    })
};

