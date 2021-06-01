const express = require("express");
const mysql = require("mysql");
const path = require("path");
const router = express.Router();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { encrypt, decrypt } = require("./crypto");

dotenv.config({ path: "./.env" });
//create connection

const app = express();

const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "my_db",
});

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));

//parsing url-encoded body
app.use(express.urlencoded({ extended: false }));

//json object
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// connect
db.connect((err) => {
	if (err) {
		throw err;
	}
	console.log("Mysql Connected...");
});

//define routes

app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));
app.use("/Registration", require("./routes/pages"));



app.get("/ShowPasswords", async (req, res) => {
	try {
		const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

		if (decoded.id) {
			let sql = "Select PasswordIv,fieldName,passwords FROM passwordvault WHERE id = ?";
			db.query(sql, [decoded.id], (error, results) => {
				if (error) throw error;

				for (let index = 0; index < results.length; index++) {
					console.log(results[index].PasswordIv.length);

					results[index].passwords = decrypt({
						iv: results[index].PasswordIv,
						content: results[index].passwords,
					});
				}

				return res.render("ShowPasswords", { results });
			});
		} else {
			res.clearCookie("jwt");
			res.status(200).redirect("/");
		}
	} catch (error) {
		res.clearCookie("jwt");
		res.status(200).redirect("/");
	}
});

app.listen("3000", () => {
	console.log("Server started on port 3000");
});
