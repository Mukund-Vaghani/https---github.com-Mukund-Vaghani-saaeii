var express = require('express');
var router = express.Router();
var middleware = require('../../../middleware/validation');
var auth = require('./user');
var multer = require('multer');
var path = require('path');


router.post('/add_receiver', function (req, res) {
    var id = req.user_id;
    middleware.decryption(req.body, function (request) {
        var rules = {
            receiver_name: 'required',
            country_code: 'required',
            phone_number: 'required'
        }

        var message = {
            required: req.language.reset_keyword_required_message
        }

        if (middleware.checkValidationRules(res, request, rules, message)) {
            auth.addReceiver(request, id, function (code, message, data) {
                middleware.send_response(res, req, code, message, data);
            })
        }
    })
})

router.post('/save_receiver', function (req, res) {
    var id = req.user_id;
    middleware.decryption(req.body, function (request) {
        auth.SavedReceiver(id, request, function (code, message, data) {
            middleware.send_response(res, req, code, message, data);
        });
    })
});

router.post('/tax', function (req, res) {
    middleware.decryption(req.body, function (request) {
        auth.getTax(request, function (code, message, data) {
            middleware.send_response(res, req, code, message, data);
        });
    })
});

router.post('/add_cards', function (req, res) {
    middleware.decryption(req.body, function (request) {
        request.user_id = req.user_id;
        var rules = {
            card_holder_name: "required",
            card_type_id: "required|in:1,2",
            card_number: "required|numeric|digits_between:16,19",
            expiry_date: "required"
        };
        var messages = {
            "required": req.language.reset_keyword_required_message,
            "in": req.language.rest_keywords_in,
        };
        if (middleware.checkValidationRules(res, request, rules, messages)) {
            auth.addCard(request, function (code, message, data) {
                middleware.send_response(res, req, code, message, data);
            });
        };
    })
});

router.post('/saved_cards', function (req, res) {
    var id = req.user_id
    middleware.decryption(req.body, function (request) {
        auth.getSavedCards(request,id, function (code, message, data) {
            middleware.send_response(res, req, code, message, data);
        });
    })
});

router.post('/cardtype', function (req, res) {
    middleware.decryption(req.body, function (request) {
        auth.cardTypes(request, function (code, message, data) {
            middleware.send_response(res, req, code, message, data);
        });
    })
});

router.post('/shop_distance', function (req, res) {
    var id = req.user_id;
    middleware.decryption(req.body, function (request) {
        auth.FindDistance(id, request, function (code, message, data) {
            middleware.send_response(res, req, code, message, data);
        });
    })
});

router.post('/saveaddress', function (req, res) {
    var id = req.user_id;
    middleware.decryption(req.body, function (request) {
        auth.SavedAddress(id, request, function (code, message, data) {
            middleware.send_response(res, req, code, message, data);
        });
    })
});

router.post('/addnewaddress', function (req, res) {
    middleware.decryption(req.body, function (request) {
        id = req.user_id;
        var rules = {
            property: "required|in:apartment,hotel,hospital,villa,other",
            street_name: "required",
            nearby_landmark: "required",
            city_id: "required",
            area_name: "required",
            villa_number: "required_if:property,villa",
            building_number: "required_if:property,apartment",
            apartment_number: "required_if:property,apartment",
            hotel_name: "required_if:property,hotel",
            room_number: "required_if:property,hotel",
            hospital_name: "required_if:property,hospital",
            section: "required_if:property,hospital",
            floor: "required_if:property,hospital",
            location_name: "required_if:property,other",
            location_number: "required_if:property,other"

        };
        var messages = {
            required: req.language.required
        }
        if (middleware.checkValidationRules(res, request, rules, messages)) {
            auth.addNewAddress(request,id, function (code, message, data) {
                middleware.send_response(res, req, code, message, data);
            });
        };
    });
});

router.post('/add_favorite', function (req, res) {
    var id = req.user_id;
    middleware.decryption(req.body, function (request) {
        var rules = {
            product_id: 'required',
        }
        var messages = {
            required: req.language.required,
        }
        if (middleware.checkValidationRules(res, request, rules, messages)) {
            auth.favorite(request,id, function (code, message, data) {
                middleware.send_response(res, req, code, message, data);
            });
        }
    })
});

router.post('/favourites',function(req,res){
    auth.favouriteProduct(req,function(code,message,data){
        middleware.send_response(res, req,code,message,data);
    });
});


// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, '../exam/public/event')
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname))
//     }
// });

// var event = multer({
//     storage: storage,
//     limits: {
//         fileSize: (12 * 1024 * 1024)
//     }
// }).single('event');

// router.post('/uploadeventpicture', function (req, res) {
//     event(req, res, function (error) {
//         if (error) {
//             console.log(error);
//             middleware.send_response(req, res, "0", "fail to upload event image", null);
//         } else {
//             middleware.send_response(req, res, "1", "upload success", { image: req.file.filename });
//         }
//     })
// })

module.exports = router;
