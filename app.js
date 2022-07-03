require('dotenv').config();//keep at top
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
	secret: "Some Secret",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

mongoose.connect("mongodb://localhost:27017/secretsAppDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  // googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//mongoose-encryption plugin --- NOTE : add before making mongoose model
// const secret = process.env.MY_SECRET_KEY;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  	console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


/*************************************************************/
app.get("/", function (req,res) {
	res.render("home");
});

app.get("/login", function (req,res) {
	res.render("login");
});

app.get("/register", function (req,res) {
	res.render("register");
});

app.get("/secrets", (req, res)=>{
	if(req.isAuthenticated()){
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

/***********************************************************/
app.post("/register", function (req, res) {
	User.register({username: req.body.username}, req.body.password, (err, user)=>{
		if(err){
			console.log(err);
			res.redirect("/register");
		} else {
			passport.authenticate("local") (req, res, ()=>{
				res.redirect("/secrets");
			})
		}
	})
});

app.post("/login", function (req, res) {
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user, (err)=>{
		if(err) {
			console.log(err);
			res.redirect("/login");
		} else {
			passport.authenticate("local") (req, res, ()=>{
				res.redirect("/secrets")
			})
		}
	})
})

app.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});