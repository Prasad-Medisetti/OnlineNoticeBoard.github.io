var express = require('express');
var router = express.Router();
var monk = require('monk');
var QRCode = require('qrcode');
var db = monk('localhost:27017/codeheat');
var image = db.get('image');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/home', function(req, res, next) {
  res.render('User/userhome');
});

router.get('/profile', function(req, res, next) {
  res.render('User/userprofile');
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
  res.render('Admin/adminlogin');
});

router.get('/postnotice', function(req, res, next) {
  res.render('Admin/postnotice');
});

router.get('/dashboard', function(req, res, next) {
  res.render('Admin/admindashboard');
});

router.get('/image', function(req,res){
  image.find({}, function(err,docs){
    console.log(docs);
    res.render('image', { users : docs });
  })
});

router.post('/imageupload', upload.single('image'), function(req, res) {
  console.log(req.file);
  image.insert({"image":req.file.originalname});
  res.redirect('/image');
});

module.exports = router;
