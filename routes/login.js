var express = require('express');
var router = express.Router();

var webapi = require('request-promise');
var jwt = require('jsonwebtoken');
var jsonpath = require('jsonpath');

var uuidv4 = require('uuid/v4');
var CSRF = require('csrf');
var csrf = new CSRF();

// Load ENV VAR
var YAHOO_JP_CLIENT = process.env.YAHOO_JP_CLIENT;
var YAHOO_JP_SECRET = process.env.YAHOO_JP_SECRET;

/* GET home page. */
router.get('/', function(req, res, next) {
  var secret = csrf.secretSync();
  var state = csrf.create(secret);
  var nonce = uuidv4();
  console.log(secret);
  req.session.csrf = state;
  req.session.nonce = nonce;

  res.render('login', {
    title: 'Express',
    clientId: YAHOO_JP_CLIENT,
    secretCd: YAHOO_JP_SECRET,
    state: state,
    nonce: nonce,
  });
});

router.get('/callback', function(req, res, next) {
  var auth_code = req.query.code;
  var auth_state = req.query.state;

  if (req.session.csrf != req.query.state) {
    // エラー処理
  }

  new Promise((resolve, reject) => {
    resolve({});
  })
    .then(function(data) {
      return webapi.post({
        url: 'https://auth.login.yahoo.co.jp/yconnect/v2/token',
        auth: { user: YAHOO_JP_CLIENT, pass: YAHOO_JP_SECRET },
        form: {
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3000/login/callback',
          code: auth_code,
        },
        json: true,
      });
    })
    .then(function(data) {
      console.log(data); // 200
      req.session.id_token = data.id_token;
      req.session.access_token = data.access_token;
      req.session.refresh_token = data.refresh_token;
    })
    .then(function(data) {
      return webapi.get({
        url: 'https://auth.login.yahoo.co.jp/yconnect/v2/jwks',
        json: true,
      });
    })
    .then(function(data) {
      // console.log(typeof data);
      // console.log(data);
      // var decoded = jwt.decode(req.session.id_token, {complete: true});
      // console.log(`$.keys[?(@.kid == "${decoded.header.kid}")]`);
      // var key = jsonpath.query(data,`$.keys[?(@.kid == "${decoded.header.kid}")]`)[0];
      // console.log(key);
      // jwt.verify(
      //   req.session.id_token,
      //   key.n,
      //   {algorithms: key.alg, nonce: req.session.nonce},
      //   function(err, decoded) {
      //     console.log(decoded)
      //     console.log(err)
      //   }
      // )
    })
    .then(function(data) {
      return webapi.get({
        url: 'https://auth.login.yahoo.co.jp/yconnect/v2/public-keys',
        json: true,
      });
    })
    .then(function(data) {
      return new Promise(function(resolve, reject) {
        console.log(data);
        var decoded = jwt.decode(req.session.id_token, { complete: true });
        console.log(decoded.header);
        jwt.verify(
          req.session.id_token,
          data[decoded.header.kid],
          {
            algorithms: decoded.header.alg,
            audience: YAHOO_JP_CLIENT,
            issuer: 'https://auth.login.yahoo.co.jp/yconnect/v2',
            nonce: req.session.nonce,
          },
          function(err, decoded) {
            req.session.nonce = null;
            console.log(decoded);
            console.log(err);
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          }
        );
      });
    })
    .then(function(data) {
      //res.render('profile', {
      //  title: 'Express',
      //});
      res.redirect('/profile');
    });
});

module.exports = router;
