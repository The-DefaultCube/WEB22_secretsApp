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
  password: String
});

userSchema.plugin(passportLocalMongoose);

//mongoose-encryption plugin --- NOTE : add before making mongoose model
// const secret = process.env.MY_SECRET_KEY;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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

// app.get("/logout", (req, res)=>{
// 	req.logout();
// 	res.redirect("/"); 
// })