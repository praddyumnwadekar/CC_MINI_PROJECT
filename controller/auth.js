const mysql = require("mysql");
const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const { encrypt, decrypt } = require("../crypto");

const jwtKey = "QHhpZGlvCg==";
const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "my_db",
});

exports.Registration = (req, res) => {
	// console.log(req.body);

	const { name, email, password, cnfpassword, MobileNo } = req.body;

	db.query("SELECT MailId FROM user WHERE MailId = ?", [email], (error, result) => {
		if (error) throw error;

		if (result.length > 0) {
			return res.render("Registration", {
				message: "That email already in use",
			});
		} else if (password !== cnfpassword) {
			return res.render("Registration", {
				message: "password do not match",
			});
		}

		db.query(
			"INSERT INTO user SET ?",
			{ name: name, MailId: email, password: password, Mobile: MobileNo },
			(error, result) => {
				if (error) throw error;
				console.log(result);
				return res.render("Registration", {
					message: "User Registered",
				});
			}
		);
	});

	// res.send("form submitted");
};

exports.SignIn = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).render("SignIn", {
				message: "Please provide an email and password",
			});
		}
		db.query("SELECT * FROM user WHERE MailId = ?", [email], async (error, result) => {
			// console.log(result[0].password);

			if (Object.entries(result).length === 0 || password != result[0].password) {
				res.status(401).render("SignIn", {
					message: "Email or Password is incorrect",
				});
			} else {
				const id = result[0].UserId;

				const token = jwt.sign({ id }, process.env.JWT_SECRET, {
					expiresIn: process.env.JWT_EXPIRES_IN,
				});

				console.log("The Token is : " + token);

				const cookieOptions = {
					expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
					httpOnly: true,
				};

				res.cookie("jwt", token, cookieOptions);
				res.status(200).redirect("/Profile");
			}
		});
	} catch (error) {
		throw error;
	}
};

exports.isLoggedIn = async (req, res, next) => {
	console.log(req.cookies);

	if (req.cookies.jwt) {
		try {
			//1) verify the token
			const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

			console.log(decoded);

			//2) Check if the user still exists
			db.query("SELECT * FROM user WHERE UserId = ?", [decoded.id], (error, result) => {
				console.log(result);

				if (!result) {
					return next();
				}

				req.user = result[0];
				console.log("user is");
				console.log(req.user);

				return next();
			});
		} catch (error) {
			console.log(error);
			return next();
		}
	} else {
		next();
	}
};

exports.Vault = async (req, res) => {
	if (req.cookies.jwt) {
		try {
			let { fields, password } = req.body;
			password = encrypt(password);
			//1) verify the token
			const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

			console.log(decoded);
			let vault1 = {
				PasswordIv: password.iv,
				id: decoded.id,
				fieldName: fields,
				passwords: password.content,
			};
			db.query("SELECT * FROM user WHERE UserId = ?", [decoded.id], (error, result) => {
				if (!result) {
					return res.render("./Profile", {
						message: "try again..",
					});
				}

				req.user = result[0];
				console.log("user in Profile add vault");

				db.query(
					"SELECT id,passwords FROM passwordvault WHERE fieldName = ? and id = ?",
					[fields, decoded.id],
					(error1, result1) => {
						// console.log(result1);
						if (Object.entries(result1).length === 0) {
							let sql = "INSERT INTO passwordvault SET ?";
							db.query(sql, vault1, (error2, results) => {
								if (results) {
									return res.render("./Profile", {
										message: "Added Succefully",
									});
								}
							});
						} else if (result1) {
							if (result1[0].id != decoded.id) {
								let sql = "INSERT INTO passwordvault SET ?";
								db.query(sql, vault1, (error2, results) => {
									if (results) {
										return res.render("./Profile", {
											message: "Added Succefully",
										});
									}
								});
							} else {
								let sql =
									"UPDATE passwordvault SET PasswordIv = ?, passwords = ?  WHERE fieldName = ? and id = ?";
								db.query(
									sql,
									[vault1.PasswordIv, vault1.passwords, fields, decoded.id],
									(error2, results) => {
										console.log(results);
										if (results) {
											return res.render("./Profile", {
												message: "password Update Successfully",
											});
										} else {
											return res.render("./Profile", {
												message: "Try again",
											});
										}
									}
								);
							}
						}
					}
				);
			});
		} catch (error) {
			console.log(error);
			res.clearCookie("jwt");
			return res.redirect("/Logout");
		}
	} else {
		return res.render("./Profile", {
			message: "try again..",
		});
	}
};


exports.Logout = async (req, res) => {
	res.clearCookie("jwt");
	res.status(200).redirect("/");
};
