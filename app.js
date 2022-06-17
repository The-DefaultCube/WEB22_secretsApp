const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

mongoose.connect("mongodb://localhost:27017/secretsAppDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model("User", userSchema);

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


/***********************************************************/
app.post("/register", function (req, res) {
	const newUser = new User({
		username: req.body.username,
		password: req.body.password
	});
	newUser.save(function (err) {
		if(err)
			console.log(err);
		else
			res.render("secrets");
	})

});

app.post("/login", function (req, res) {
	const existingUsername = req.body.username;
	const existingPassword = req.body.password;
	User.findOne({username: existingUsername}, function(err, foundUser) {
		if(err)
			console.log(err);
		else
			if(foundUser)//i.e foundUser != null
				if(foundUser.password === existingPassword)
					res.render("secrets");
				else
					console.log("Invalid Password.")
			else
				console.log("User not found.")
	})
})
