var express = require('express');
var router = express.Router();
var monk = require('monk');
var QRCode = require('qrcode');

var Cryptr = require('cryptr');
var cryptr = new Cryptr('myTotalySecretKey');

/* Database SetUpd */
var db = monk('localhost:27017/OnlineNoticeBoard');
var image = db.get('image');
var users = db.get('users');
var admin = db.get('admin');

/* saving image */
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
  if(req.session && req.session.user){
    console.log(req.session.user);
    res.locals.user = req.session.user;
    res.render('User/userhome');
  }
  else{
    req.session.reset();
    res.redirect('/');
  }
});

router.get('/adminprofile', function(req, res, next) {
  if(req.session && req.session.admin){
    // console.log(req.session.user);
    res.locals.admin = req.session.admin;
    res.render('Admin/adminprofile');
  }
  else{
    req.session.reset();
    res.redirect('/admin');
  }
});

router.get('/profile', function(req, res, next) {
  if(req.session && req.session.user){
    // console.log(req.session.user);
    res.locals.user = req.session.user;
    res.render('User/userprofile');
  }
  else{
    req.session.reset();
    res.redirect('/');
  }
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
  if(req.session && req.session.admin){
    // console.log(req.session.user);
    res.locals.admin = req.session.admin;
    res.render('Admin/postnotice');
  }
  else{
    req.session.reset();
    res.redirect('/admin');
  }
});

router.get('/dashboard', function(req, res, next) {
  if(req.session && req.session.admin){
    // console.log(req.session.user);
    res.locals.admin = req.session.admin;
    res.render('Admin/admindashboard');
  }
  else{
    req.session.reset();
    res.redirect('/admin');
  }
});

router.get('/image', function(req,res){
  image.find({}, function(err,docs){
    console.log(docs);
    res.render('image', { users : docs });
  })
});

router.get('/logout', function(req, res){
  req.session.reset();
  res.redirect('/');
});

router.get('/adminlogout', function(req, res){
  req.session.reset();
  res.redirect('/admin');
});

router.get('/forgot', function(req, res){
  res.render('forgot');
});

router.get('/getuser', function(req, res) {
  users.find({}, function(err,docs){
    if(err){
      console.log(err);
    }
    else{
      //console.log(docs);
      res.send(docs);
    }
  })
});

router.post('/imageupload', upload.single('image'), function(req, res) {
  console.log(req.file);
  image.insert({"image":req.file.originalname});
  res.redirect('/image');
});

router.post('/postuser', function(req, res){
  //console.log(req.body);
  col.insert(req.body, function(err, docs){
    if(err) {
      console.log(err);
    }
    else{
      //console.log(docs);
      res.send(docs);
    }
  })
})

/* LoginSignUp */
router.post('/postsignup', function(req, res) {
  var data = {
    firstname : req.body.firstname,
    lastname : req.body.lastname,
    username : req.body.username,
    gender : req.body.gender,
    email : req.body.email,
    password : cryptr.encrypt(req.body.password),
    // password : req.body.password,
    phone : req.body.phone,
    dob : req.body.dob
  }
  console.log(data);
  users.insert(data, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  });
});

router.post('/postuserlogin', function(req, res) {
  users.findOne({ 'email' : req.body.email }, function(err, data) {
    var password1 = req.body.password;
    var password2 = cryptr.decrypt(data.password);
    // var password2 = data.password;
    delete data.password;
    // console.log(password1);
    // console.log(password2);
    // console.log(data);
    req.session.user = data[0];
    // req.session.user = data[0];
    if(password1 == password2) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });
});

router.post('/postadminlogin', function(req, res) {
  admin.findOne({ 'email' : req.body.email }, function(err, data) {
    var password1 = req.body.password;
    var password2 = cryptr.decrypt(data.password);
    // var password2 = data.password;
    delete data.password;
    // console.log(password1);
    // console.log(password2);
    // console.log(data);
    req.session.admin = data;
    // req.session.user = data[0];
    if(password1 == password2) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });
});

module.exports = router;
