const express = require("express");
const authController = require("../controller/auth");
const router = express.Router();

router.post("/Registration", authController.Registration);

router.post("/SignIn", authController.SignIn);

router.post("/Vault", authController.Vault);

router.get("/Logout", authController.Logout);

module.exports = router;
