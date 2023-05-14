var express = require('express');
var router = express.Router();
var middleware = require('../../../middleware/validation');
var market = require('./fish_market');
var multer = require('multer');
var path = require('path');


router.post('/market_listing', function (req, res) {
    middleware.decryption(req.body, function (request) {
        var rules = {
            service_category_id: 'required',
        }

        var messages = {
            required: req.language.reset_keyword_required_message
        }

        if (middleware.checkValidationRules(res, request, rules, messages)) {
            market.market_listing(request, function (code, message, data) {
                middleware.send_response(res, req, code, message, data);
            });
        }
    })
})

// var contactstorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/contact');
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// })

// var uploadcontact = multer({
//     storage: contactstorage,
//     limits: {
//         fileSize: (12 * 1024 * 1024)
//     }
// })

// var uploadmultiimage = uploadcontact.fields([
//     {
//         name: 'contact_image',
//         maxCount: 3
//     }
// ]);

// router.post('/uploadcontactimage', function (req, res) {
//     uploadmultiimage(req, res, function (error) {
//         if (error) {
//             console.log(error)
//             middleware.send_response(req, res, "0", "fail to upload image", null);
//         } else {
//             var image = [];
//         req.files.contact_image.forEach(element => {
//             image.push(element);
//         });
        
//         middleware.send_response(req, res, "1", "upload success", { image: image });
//             // middleware.send_response(req, res, "1", "upload success", { image: req.files.contact_image[0].filename });
//         }
//     })
// })


module.exports = router;