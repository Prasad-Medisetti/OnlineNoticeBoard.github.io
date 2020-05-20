var express = require('express');
var router = express.Router();
var QRCode = require('qrcode');
var multer = require('multer');
var upload = multer({ dest : 'uploads/' });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/qrcode', function(req, res, next) {
  QRCode.toDataURL('Prasad', function (err, qrcode) {
    res.render('qrcode', {qrcode : qrcode});
  });
});

router.get('/about', function(req, res, next) {
  res.render('about');
});

router.get('/contact', function(req, res, next) {
  res.render('contact');
});

router.get('/admin', function(req, res, next) {
  res.render('adminlogin');
});

router.get('/image', function(req, res, next) {
  res.render('image');
});

router.post('/imageupload', upload.single('image'), function(req, res) {
  console.log(req.file);
  res.redirect('/image');
});

module.exports = router;
