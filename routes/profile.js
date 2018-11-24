var express = require('express');
var router = express.Router();

var webapi = require('request-promise');

/* GET home page. */
router.get('/', function(req, res, next) {
  new Promise((resolve, reject) => {
    resolve({});
  })
    .then(function(data) {
      console.log(`Bearer ${req.session.access_token}`);
      return webapi.post({
        url: 'https://userinfo.yahooapis.jp/yconnect/v2/attribute',
        auth: {
          bearer: req.session.access_token,
        },
        json: true,
      });
    })
    .then(function(data) {
      return new Promise(function(resolve, reject) {
        console.log(data);
        var profile = {
          name: data.name,
          gender: data.gender,
          email: data.email,
          locale: data.locale,
          timezone: data.zoneinfo,
        };
        resolve(profile);
      });
    })
    .then(function(profile) {
      var data = {};
      data.profile = profile;
      data.title = 'Profile';
      res.render('profile', data);
    })
    .catch(function(data) {
      throw data;
      console.log(data);
      res.render('profile', { title: 'Express' });
    });
});

module.exports = router;
