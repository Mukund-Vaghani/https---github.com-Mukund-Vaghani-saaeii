var express = require('express');
var router = express.Router();
var middleware = require('../../../middleware/validation');
var auth = require('./auth_model');
var multer = require('multer');
var path = require('path');
// const { request } = require('http');

router.post('/signup', function (req, res) {
    middleware.decryption(req.body, function (request) {
        var rules = {
            login_type: 'required|in:s,f,g',
            social_id: 'required_if:login_type,f,g',
            name: 'required',
            email: 'required|email',
            password: 'required_if:login_type,s',
            office_phone: 'required',
            organization_name: 'required',
            cell_phone: 'required',
            office_address: 'required',
            office_city: 'required',
            office_state: 'required'
        }
        
        var message = {
            required: req.language.reset_keyword_required_message,
            email: req.language.reset_keyword_invalid_email_message
        }

        if (middleware.checkValidationRules(res, request, rules, message)) {
            auth.signup(request, function (code, message, data) {
                middleware.send_response(req, res, code, message, data);
            })
        }
    })
})

router.post('/login', function (req, res) {
    // var request = req.body;
    console.log(req.body)
    middleware.decryption(req.body, function (request) {

        console.log("1111111111111", request);
        var rules = {
            login_type: 'required|in:s,f,g',
            email: 'required|email',
            password: 'required_if:login_type,s'
        }

        var message = {
            required: req.language.reset_keyword_required_message,
            email: req.language.reset_keyword_invalid_email_message
        }

        if (middleware.checkValidationRules(res, request, rules, message)) {
            auth.loginUser(request, function (code, message, data) {
                middleware.send_response(req, res, code, message, data);
            })
        }
    })
})

router.post("/logout", function (req, res) {
    // var request = req.body;
    var id = req.user_id
    middleware.decryption(req.body, function (request) {
        auth.logoutUser(request, id, function (code, message, data) {
            middleware.send_response(req, res, code, message, data);
        })
    })
})


// forgot password
router.post('/forgotpass', function (req, res) {
    // var request = req.body;

    middleware.decryption(req.body, function (request) {
        var rules = {
            login_type: 'required',
            email: 'required|email'
        }

        var message = {
            required: req.language.reset_keyword_required_message,
            email: req.language.reset_keyword_invalid_email_message
        }

        if (middleware.checkValidationRules(res, request, rules, message)) {
            auth.forgotpassword(request, function (code, message, data) {
                middleware.send_response(req, res, code, message, data);
            })
        }
    })
})

router.get('/resetform/:id', function (req, res) {
    auth.getUserDetail(req.params.id, function (userdata) {
        if (userdata != null) {
            var token_time = userdata[0].token_time;
            var current_time = new Date();
            var diffTime = current_time.getHours() - token_time.getHours();
            if (diffTime < '1') {
                if (userdata[0].is_forgot == '1') {
                    res.render('forgotpass.html', { id: req.params.id });
                } else {
                    res.send(req.language.reset_keyword_link_used);
                }
            } else {
                res.send(req.language.reset_keyword_link_expired);
            }
        } else {
            console.log(req.language.reset_keyword_something_wrong_message);
        }
    })
})

router.post('/resetpass/:id', function (req, res) {

    var request = req.body;
    var id = req.params.id;
    auth.getUserDetail(id, function (user_data) {
        if (user_data[0].is_forgot == '1') {
            auth.resetpassword(request, id, function (code, message, data) {
                middleware.send_response(req, res, code, message, data);
            })
        } else {
            res.send(req.language.reset_keyword_link_used);
        }
    })
})

// upload user image
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../exam/public/user')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({
    storage: storage,
    limits: {
        fileSize: (12 * 1024 * 1024)
    }
}).single('profile');


router.post('/uploadprofilepicture', function (req, res) {
    upload(req, res, function (error) {
        if (error) {
            console.log(error);
            middleware.send_response(req, res, "0", "fail to upload restaurant image", null);
        } else {
            middleware.send_response(req, res, "1", "upload success", { image: req.file.filename });
        }
    })
})

module.exports = router;