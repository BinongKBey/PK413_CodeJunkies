var express = require('express');
const { Router } = require('express');
var router = express.Router()
const User = require('../models/user');
const { auth } = require('../middlewares/auth');

router.post('/signup', function (req, res) {
    // taking a user
    const newuser = new User(req.body);

    if (newuser.password != newuser.password2) return res.status(400).json({ message: "password not match" });

    User.findOne({ email: newuser.email }, function (err, user) {
        if (user) return res.status(400).json({ auth: false, message: "email exits" });

        newuser.save((err, doc) => {
            if (err) {
                console.log(err);
                return res.status(400).json({ success: false, error: err });
            }
            res.status(200).json({
                succes: true,
                user: doc
            });
        });
    });
});

router.post('/login', function (req, res) {
    let token = req.cookies.auth;
    User.findByToken(token, (err, user) => {
        if (err) return res(err);
        if (user) return res.status(400).json({
            error: true,
            message: "You are already logged in"
        });

        else {
            User.findOne({ 'email': req.body.email }, function (err, user) {
                if (!user) return res.json({ isAuth: false, message: ' Auth failed ,email not found' });

                user.comparepassword(req.body.password, (err, isMatch) => {
                    if (!isMatch) return res.json({ isAuth: false, message: "password doesn't match" });

                    user.generateToken((err, user) => {
                        if (err) return res.status(400).send(err);
                        res.cookie('auth', user.token).json({
                            isAuth: true,
                            id: user._id
                            , email: user.email
                        });
                    });
                });
            });
        }
    });
});

router.get('/profile', auth, function (req, res) {
    res.json({
        isAuth: true,
        id: req.user._id,
        email: req.user.email,
        name: req.user.firstname + req.user.lastname,
        district: req.user.district,
        state: req.user.state,
        phone: req.user.phone
    })
});

router.get('/logout', auth, function (req, res) {
    req.user.deleteToken(req.token, (err, user) => {
        if (err) return res.status(400).send(err);
        res.sendStatus(200);
    });

});

module.exports = router;