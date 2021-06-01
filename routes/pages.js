const express = require("express");
const authController = require("../controller/auth");
const router = express.Router();

router.get("/", authController.isLoggedIn, (req, res) => {
	res.render("Home", {
		user: req.user,
	});
});

// router.get("/", (req, res) => {
// 	res.render("Home");
// });

router.get("/Registration", (req, res) => {
	res.render("Registration");
});

router.get("/SignIn", (req, res) => {
	res.render("SignIn");
});

// router.get("/PasswordsLists", (req, res) => {
// 	res.render("/PasswordsLists");
// });
// router.get("/Profile", (req, res) => {
// 	res.render("Profile");
// });

router.get("/Profile", authController.isLoggedIn, (req, res) => {
	console.log(req.user);
	if (req.user) {
		res.render("Profile", {
			user: req.user,
		});
	} else {
		res.redirect("/SignIn");
	}
});

module.exports = router;
