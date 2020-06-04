var express = require('express');
var router = express.Router();
var monk = require('monk');
var QRCode = require('qrcode');
var moment = require('moment');

var Cryptr = require('cryptr');
var cryptr = new Cryptr('myTotalySecretKey');

/* Database SetUpd */
var db = monk('localhost:27017/OnlineNoticeBoard');
var image = db.get('image');
var users = db.get('users');
var admin = db.get('admin');
var notices = db.get('notices');
var feedbacks = db.get('feedbacks');

/* Mailer */
var randomstring = require("randomstring");
var nodemailer = require('nodemailer');

/* saving image */
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profiles/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() +'.'+ file.originalname.split('.')[1])
  }
}) 
var upload = multer({ storage: storage })

// var profile = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'public/uploads/Profiles/')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// })
// var userprofileupload = multer({ profile : profile })

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/home', function(req, res, next) {
  if(req.session && req.session.user){
    // console.log(req.session.user);
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
    var noticeboard = notices.find({});
    console.log(noticeboard);
    res.locals.notices = noticeboard;
    res.render('Admin/admindashboard');
  }
  else{
    req.session.reset();
    res.redirect('/admin');
  }
});

router.get('/changeadminpassword', function(req, res, next) {
  if(req.session && req.session.admin){
    // console.log(req.session.user);
    res.locals.admin = req.session.admin;
    res.render('Admin/changepassword');
  }
  else{
    req.session.reset();
    res.redirect('/admin');
  }
});

router.get('/changepassword', function(req, res, next) {
  if(req.session && req.session.user){
    // console.log(req.session.user);
    res.locals.user = req.session.user;
    res.render('User/changepassword');
  }
  else{
    req.session.reset();
    res.redirect('/');
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

router.get('/forgotpassword', function(req, res){
  res.render('User/forgotpassword');
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

router.get('/getnotices', function(req, res) {
  notices.find({}, function(err,docs) {
    if(err){
      console.log(err);
    } else {
      // console.log(docs);
      res.send(docs);
    }
  });
});

router.post('/imageupload', upload.single('image'), function(req, res) {
  console.log(req.file);
  image.insert({"image":req.file.originalname});
  res.redirect('/image');
});

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
    dob : moment(req.body.dob).format('YYYY-MM-DD')
  }

  /* Adds an avatar based on gender */
  if (data.gender = 'male') {
    data.img = '/uploads/profiles/user-m.jpg';
  } else if (data.gender = 'female') {
    data.img = '/uploads/profiles/user-f.jpg';
  } else {
    data.img = '/uploads/profiles/user.jpg';
  }

  // console.log(data);
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
    // console.log(data)
    if (data != null) {
      var password1 = req.body.password;
      var password2 = cryptr.decrypt(data.password);
      // var password2 = data.password;
      delete data.password;
      // console.log(password1);
      // console.log(password2);
      // console.log(data);
      req.session.user = data;
      // req.session.user = data[0];
      if(password1 == password2) {
        res.sendStatus(200);
      } else {
        res.send('Invalid Credentials...');
      }
    } else {
      res.send('Invalid Credentials...');
    }
  });
});

router.post('/postadminlogin', function(req, res) {
  admin.findOne({ 'email' : req.body.email }, function(err, data) {
    // console.log(data)
    if (data != null) {
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
        res.send('Invalid Credentials...');
      }
    } else {
      res.send('Invalid Credentials...');
    }
  });
});

router.post('/postnotice', function(req, res) {
  var notice = {
    title : req.body.title,
    subject : req.body.subject,
    description : req.body.description,
    postedOn : moment().format('YYYY-MM-DD hh:mm:ss A')
  }
  // console.log(notice);
  notices.insert(notice, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  })
});

/* Chnage Password */
router.put('/changeadminpwd/', function(req, res) {
  if (req.body.password == req.body.retypepassword) {
    admin.update({ email : req.session.admin.email }, 
      { $set : { password : cryptr.encrypt(req.body.password)} }, function(err, docs) {
      if (err) {
        console.log(err);
      } else {
        // console.log(docs);
        res.send('Changed Password Successfully...');
      }
    })
  } else {
    res.send('Passwords not matched')
  }
});

router.put('/changeuserpwd', function(req, res) {
  if (req.body.password == req.body.retypepassword) {
    users.update({ email : req.session.user.email }, 
      { $set : { password : cryptr.encrypt(req.body.password)} }, function(err, docs) {
      if (err) {
        console.log(err);
      } else {
        // console.log(docs);
        res.send('Changed Password Successflly...');
      }
    })
  } else {
    res.send('Passwords not matched')
  }
});

router.put('/updateadminprofile', function(req, res) {
  // var data = {
  //   firstname : req.body.firstname,
  //   lastname : req.body.lastname,
  //   username : req.body.username,
  //   gender : req.body.gender,
  //   email : req.body.email,
  //   phone : req.body.phone,
  //   dob : moment(req.body.dob).format('YYYY-MM-DD')
  // }
  // console.log(data);
  admin.update({ email : req.session.admin.email }, { $set : {
      firstname : req.body.firstname,
      lastname : req.body.lastname,
      username : req.body.username,
      gender : req.body.gender,
      email : req.body.email,
      phone : req.body.phone,
      dob : moment(req.body.dob).format('YYYY-MM-DD')
    } 
  }, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      // console.log(docs);
      res.sendStatus(200);  
    }
  })
});

router.put('/updateprofile', function(req, res) {
  // var data = {
  //   firstname : req.body.firstname,
  //   lastname : req.body.lastname,
  //   username : req.body.username,
  //   gender : req.body.gender,
  //   email : req.body.email,
  //   phone : req.body.phone,
  //   dob : moment(req.body.dob).format('YYYY-MM-DD')
  // }
  // console.log(data);
  users.update({ email : req.session.user.email }, { $set : {
      firstname : req.body.firstname,
      lastname : req.body.lastname,
      username : req.body.username,
      gender : req.body.gender,
      email : req.body.email,
      phone : req.body.phone,
      dob : moment(req.body.dob).format('YYYY-MM-DD')
    } 
  }, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      // console.log(docs);
      res.sendStatus(200);  
    }
  })
});

// On clicking forgot link and generating OTP to our registered mail
router.put('/postforgot',function(req,res)
{
	var email = req.body.email;
  var newpassword = randomstring.generate(8);
  console.log(newpassword);
	users.update({ email: email }, { $set : { password : cryptr.encrypt(newpassword) } });
  // res.sendStatus(200);
	var transporter = nodemailer.createTransport({
		service : 'gmail',
		auth:{
			user : 'pm961.cse@gmail.com',
			pass : 'PrasadM@cse961'
		}
	});

	var mailOptions={
		from : 'Online Notice Board',
		to : email,
		subject : 'Online Notice Board Account Password Resetted',
    // text : 'Your New is '+newpassword, // plain text
    html: "<p>Your New is <b>"+newpassword+"</b></p>" // html body
	};

	transporter.sendMail(mailOptions,function(err,info)
	{
		if(err)
		{
			console.log(err);
		}
		else{
			// console.log('Email sent...');  
			res.send(info);
		}
  });

});

/* Upload Profile Image */
// router.post('/userprofileimgupload', upload.single('image'), function(req, res) {
//   console.log(req.file);
//   users.update({ email : req.session.user.email }, {$set : { img : req.file.originalname } }, function(err, docs) { 
//       if (err) {
//         res.send(err);
//       } else {
//         res.send(docs);
//       }
//     })
//   // res.redirect('/lo');
//   // res.redirect('/logout')
// });

router.post('/userprofileimgupload', upload.single('image'), function(req, res) {
  // console.log(req.file);
  if (req.file) {
    // console.log(req.session.user);
    // console.log(req.file.filename);
    if (users.update({ email : req.session.user.email}, {$set : {"img": '/uploads/profiles/'+req.file.filename}})) {
      res.redirect('/profile')
    } else {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(500);
  }
});

router.post('/adminprofileimgupload', upload.single('image'), function(req, res) {
  // console.log(req.file);
  if (req.file) {
    // console.log(req.session.user);
    // console.log(req.file.filename);
    if (users.update({ email : req.session.admin.email}, {$set : {"img": '/uploads/profiles/'+req.file.filename}})) {
      res.redirect('/profile')
    } else {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(500);
  }
});

router.post('/postfeedback', function(req, res) {
  var feedback = {
    name : req.body.name,
    email : req.body.email,
    message : req.body.message,
    postedOn : moment().format('YYYY-MM-DD hh:mm:ss A')
  }
  // console.log(notice);
  feedbacks.insert(feedback, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.send(docs);
    }
  })
});

module.exports = router;
