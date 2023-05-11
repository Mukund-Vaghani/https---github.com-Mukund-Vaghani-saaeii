var Validator = require('Validator');
const { default: localizify } = require('localizify');
const en = require('../language/en');
const gu = require('../language/gu');
var { t } = require('localizify');
var con = require('../config/database');
var cryptoLib = require('cryptlib')
var shakey = cryptoLib.getHashSha256(process.env.KEY, 32)

var middleware = {

    checkValidationRules: function (res, request, rules, message) {
        // console.log("QQQQQQQ",request.lang);
        const v = Validator.make(request, rules, message);
        if (v.fails()) {
            const errors = v.getErrors();
            for (var key in errors) {
                var error = errors[key][0];
                console.log(error);
                var response_data = {
                    code: '0',
                    message: error
                }
                // var response = response_data;
                middleware.encryption(response_data, function (response) {
                    res.status(200);
                    res.send(response);
                })
                return false;
            }
        } else {
            return true;
        }
    },

    send_response: function (res, req, code, message, data) {
        this.getMessage(req.lang, message, (trans_message) => {
            if (data == null) {
                var response_data = {
                    code: code,
                    message: trans_message
                }
                var response = response_data
                middleware.encryption(response_data, function (response) {
                    res.status(200);
                    res.send(response);
                })
            } else {
                // console.log(data);
                var response_data = {
                    code: code,
                    message: trans_message,
                    data: data
                }
                var response = response_data;
                middleware.encryption(response_data, function (response) {
                    // res.status(200);
                    res.status(200).send(response);
                })
            }
        })
    },

    getMessage: function (langauge, message, callback) {
        localizify
            .add('en', en)
            .add('gu', gu)
            .setLocale(langauge);
        callback(t(message));
    },

    extractheaderlanguage: function (req, res, callback) {
        var headerlang = (req.headers['accept-language'] != undefined && req.headers['accept-language'] != "") ? req.headers['accept-language'] : "en";
        req.lang = headerlang;
        // console.log("ssssss",headerlang)

        req.language = (headerlang == 'en') ? en : gu;
        // console.log("get header",req.language);

        callback();
    },

    validateApiKey: function (req, res, callback) {
        // bypass of api key
        var end_point = req.path.split('/');
        var uni_end_point = new Array("resetform", "resetpass")

        var api_key = (req.headers['api-key'] != undefined && req.headers['api-key'] != "") ? req.headers['api-key'] : "";


        if (uni_end_point.includes(end_point[end_point.length - 2])) {
            callback();
        } else {

            if (api_key != "") {
                try {
                    var dec_apikey = cryptoLib.decrypt(api_key, shakey, process.env.IV)
                    if (dec_apikey != "" && dec_apikey == process.env.API_KEY) {
                        callback()
                    } else {
                        var response_data = {
                            code: '0',
                            message: req.language.reset_keyword_invalid_user_api_message
                        }
                        middleware.encryption(response_data, function (response) {
                            res.status(401);
                            res.send(response);
                        })
                    }
                } catch (error) {
                    var response_data = {
                        code: '0',
                        message: req.language.reset_keyword_invalid_user_api_message
                    }
                    middleware.encryption(response_data, function (response) {
                        res.status(401);
                        res.send(response);
                    })
                }
            } else {
                var response_data = {
                    code: '0',
                    message: req.language.reset_keyword_invalid_user_api_message
                }
                middleware.encryption(response_data, function (response) {
                    res.status(401);
                    res.send(response);
                })
            }
        }
    },

    validateUserToken: function (req, res, callback) {
        var end_point = req.path.split('/');
        var uni_end_point = new Array("login", "signup", "validate", "resetform", "resetpass", "addproduct");

        var valid_token = (req.headers['token'] != undefined && req.headers['token'] != "") ? req.headers['token'] : "";

        // console.log(uni_end_point.indexOf(end_point[4])=='-1');
        if (uni_end_point.includes(end_point[4])) {
            callback();
        } else {
            if (valid_token != "") {
                try {
                    var dec_token = cryptoLib.decrypt(valid_token, shakey, process.env.IV)
                    console.log(dec_token);
                    if (dec_token != "") {
                        con.query(`SELECT * FROM tbl_user_deviceinfo WHERE token = ?`, [dec_token], function (error, result) {
                            if (!error && result.length > 0) {
                                req.user_id = result[0].user_id;
                                callback()
                            } else {
                                var response_data = {
                                    code: '0',
                                    message: req.language.reset_keyword_invalid_user_message
                                }
                                middleware.encryption(response_data, function (response) {
                                    res.status(401);
                                    res.send(response);
                                })
                            }
                        })
                    } else {
                        var response_data = {
                            code: '0',
                            message: req.language.reset_keyword_invalid_user_message
                        }
                        middleware.encryption(response_data, function (response) {
                            res.status(401);
                            res.send(response);
                        })
                    }
                } catch (error) {
                    var response_data = {
                        code: '0',
                        message: req.language.reset_keyword_invalid_user_message
                    }
                    middleware.encryption(response_data, function (response) {
                        res.status(401);
                        res.send(response);
                    })
                }
            } else {
                var response_data = {
                    code: '0',
                    message: req.language.reset_keyword_invalid_user_message
                }
                middleware.encryption(response_data, function (response) {
                    res.status(401);
                    res.send(response);
                })
            }
        }
    },


    decryption: function (req, callback) {
        if (req != undefined && Object.keys(req).length !== 0) {
            try {
                var request = JSON.parse(cryptoLib.decrypt(req, shakey, process.env.IV));
                // request.lang = req.lang;
                callback(request);
            } catch(error) {
                console.log("Error : ", error)
                callback('wqw');
            }
        } else {
            callback('abv');
        }
    },

    encryption: function (response_data, callback) {
        var response = cryptoLib.encrypt(JSON.stringify(response_data), shakey, process.env.IV);
        callback(response);
    }

}

module.exports = middleware;