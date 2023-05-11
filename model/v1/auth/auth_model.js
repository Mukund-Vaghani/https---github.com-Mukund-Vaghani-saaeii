const common = require('../../../config/common');
var con = require('../../../config/database');
var global = require('../../../config/constant');
var middleware = require('../../../middleware/validation');
var cryptoLib = require('cryptlib');
var shakey = cryptoLib.getHashSha256(process.env.KEY, 32)

var auth = {

    signup: function (request, callback) {

        if (request.login_type == 's') {
            var password;
            middleware.encryption(request.password, function (response) {
                password = response;
            })
        }

        var userDetail = {
            login_type: request.login_type,
            social_id: (request.login_type == "s") ? "" : request.social_id,
            name: request.name,
            email: request.email,
            password: (request.login_type == "s") ? password : "",
            office_phone: request.office_phone,
            organization_name: request.organization_name,
            cell_phone: request.cell_phone,
            office_address: request.office_address,
            office_city: request.office_city,
            office_state: request.office_state,
            user_profile: (request.user_profile == undefined) ? 'user.png' : request.user_profile
        }
        auth.checkUserEmail(request, function (isExist) {
            if (isExist) {
                callback("0", "email is already exist", null)
            } else {
                con.query(`INSERT INTO tbl_user SET ?`, [userDetail], function (error, result) {
                    if (!error) {
                        var id = result.insertId;
                        common.checkUpdateToken(id, request, function (token) {
                            if (token) {
                                auth.getUserDetail(id, function (user_data) {
                                    user_data[0].token = token;
                                    common.sendEmail(request.email, "Welcome to Bathroom App", `<h4>${request.user_name} You are signup successfully in bathroom app</h4>`, function (isSent) {
                                        callback('1', 'reset_keyword_add_message', user_data);
                                    })
                                })
                            } else {
                                callback("0", 'reset_keyword_something_wrong_message', error);
                            }
                        })
                    } else {
                        console.log(error);
                        callback('0', "reset_keyword_something_wrong_message", null);
                    }
                })
            }
        })
    },

    loginUser: function (request, callback) {

        auth.checkUserEmail(request, function (isExist) {
            if (isExist) {
                con.query(`SELECT u.*,CONCAT('${global.BASE_URL}','${global.USER_URL}', u.user_profile) as profile FROM tbl_user u WHERE u.email = ? AND login_type = ?`, [request.email, request.login_type], function (error, result) {
                    if (!error && result.length > 0) {

                        if (request.login_type == 's' && cryptoLib.encrypt(request.password, shakey, process.env.IV) != result[0].password) {
                            callback("0", "your credantial not match", null)
                        } else if (request.login_type != 's' && request.social_id != result[0].social_id) {
                            callback("0", "your credantial not match", null)
                        } else {

                            auth.loginStatusUpdate(result[0].id, function (isUpdate) {
                                if (isUpdate) {
                                    common.sendEmail(request.email, "Login to glassApp", `${result[0].user_name} login successfully`, function (isSent) {
                                        if (isSent) {
                                            var id = result[0].id;
                                            common.checkUpdateToken(id, request, function (token) {
                                                result[0].login_status = "online";
                                                result[0].token = token;
                                                callback("1", "reset_keyword_login_message", result);
                                            });
                                        } else {
                                            callback("0", "reset_keyword_login_faile_message", null);
                                        }
                                    })
                                } else {
                                    callback("0", "status not update", null)
                                }
                            })
                        }
                    } else {
                        callback("0", "email address not exist", null);
                    }
                })
            } else {
                callback("0", "User not exist, You have to signup first", null)
            }
        })
    },

    logoutUser: function (request,id, callback) {
        console.log(id);
        var upddata = {
            token: "",
            device_token: ""
        }
        con.query(`UPDATE tbl_user_deviceinfo SET ? WHERE user_id = ?`, [upddata, id], function (error, result) {
            console.log(result)
            if (!error && result.affectedRows > 0) {
                var loginstatus = {
                    login_status: "offline"
                }

                con.query(`UPDATE tbl_user SET ? WHERE id = ?`, [loginstatus, id], function (error, result) {
                    if (!error && result.affectedRows > 0) {
                        callback('1', "log out", null);
                    } else {
                        callback("0", "reset_keyword_something_wrong_message", null);
                    }
                })
            } else {
                console.log(error)
                callback("0", "log out failed", null)
            }
        })
    },

    // forgot password
    forgotpassword: function (request, callback) {
        // console.log(request.email);
        con.query(`SELECT * FROM tbl_user WHERE login_type = 's' AND email = ? AND is_active = 1`, [request.email], function (error, result) {
            if (!error && result.length > 0) {

                require('../../../config/template').forgotPass(result, function (forgottemplate) {
                    common.sendEmail(request.email, "Forgot Password", forgottemplate, function (isSent) {
                        if (isSent) {
                            var onetime = {
                                is_forgot: "1",
                                token_time: new Date()
                            }
                            con.query(`UPDATE tbl_user SET is_forgot = ?, token_time = ? WHERE id = ? `, [onetime.is_forgot, onetime.token_time, result[0].id], function (error, result) {
                                if (!error) {
                                    callback("1", "reset_keyword_success_message", result);
                                } else {
                                    callback('0', "reset_keyword_something_wrong_message", error)
                                }
                            });
                        } else {
                            callback('0', "reset_keyword_something_wrong_message", error)
                        }
                    })
                })
            } else {
                console.log(error);
                callback("0", "reset_keyword_something_wrong_message", error)
            }
        })
    },

    resetpassword: function (request, id, callback) {
        // console.log("authmodel",request);
        var password;
        middleware.encryption(request.resetpass, function (response) {
            password = response;
        })

        var onetime = {
            is_forgot: "0"
        }
        con.query(`UPDATE tbl_user SET password = ?, is_forgot = ? WHERE id = ${id} `, [password, onetime.is_forgot], function (error, result) {
            if (!error) {
                callback("1", "reset_keyword_success_message", null);
            } else {
                console.log(error);
                callback('0', 'reset_keyword_something_wrong_message', error)
            }
        })
    },


    // common function
    checkUserEmail: function (request, callback) {
        // if(login_type == 's'){
            con.query(`SELECT * FROM tbl_user WHERE email = ?`, [request.email], function (error, result) {
                if (!error && result.length > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        // }
    },

    getUserDetail: function (id, callback) {
        con.query(`SELECT u.*,CONCAT('${global.BASE_URL}','${global.USER_URL}', u.user_profile) as profile,ud.token,ud.device_type,device_token FROM tbl_user u join tbl_user_deviceinfo ud on u.id = ud.user_id WHERE u.id = ?`, [id], function (error, result) {
            if (!error && result.length > 0) {
                callback(result);
            } else {
                callback(null);
            }
        })
    },

    loginStatusUpdate: function (id, callback) {
        var loginstatus = {
            login_status: "online"
        }
        con.query(`UPDATE tbl_user SET ? WHERE id = ?`, [loginstatus, id], function (error, result) {
            if (!error) {
                callback(true);
            } else {
                callback(false);
            }
        })
    }

}

module.exports = auth;