var express = require("express");
var router = express.Router();
const mysql = require("mysql");

const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "my_db",
});

// another routes also appear here
// this script to fetch data from MySQL databse table
module.exports = router;
