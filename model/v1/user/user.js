const common = require('../../../config/common');
var con = require('../../../config/database');
var global = require('../../../config/constant');
var middleware = require('../../../middleware/validation');
var asyncLoop = require('node-async-loop');
const e = require('express');

var user = {

    addReceiver: function (request, id, callback) {
        var receiverDetail = {
            user_id: id,
            receiver_name: request.receiver_name,
            country_code: request.country_code,
            phone_number: request.phone_number
        }
        con.query(`INSERT INTO tbl_receiver SET ?`, [receiverDetail], function (error, result) {
            if (!error) {
                var receiver_id = result.insertId;
                con.query(`SELECT * FROM tbl_receiver WHERE id = ?`, [receiver_id], function (error, result) {
                    if (!error) {
                        callback("1", "reset_keyword_add_receiver", result)
                    } else {
                        callback("0", "reset_keyword_error_add_receiver", null);
                    }
                })
            } else {
                callback("0", "reset_keyword_error_add_receiver", null);
            }
        })
    },

    SavedReceiver: function (id, request, callback) {
        con.query("select * from tbl_saved_receiver where user_id = ?", [id], function (err, result) {
            if (!err) {
                var receiver_id = result[0].receiver_id;
                user.getReceiverDetails(receiver_id, function (SavedReceiver) {
                    if (SavedReceiver != null) {
                        callback("1",'reset_keyword_add_message', SavedReceiver);
                    } else {
                        callback("0",'reset_keyword_something_wrong_message', null)
                    }
                })

            } else {
                callback("0",'reset_keyword_something_wrong_message', null)
            }

        })
    },

    getReceiverDetails: function (id, callback) {
        con.query("select * from tbl_receiver where user_id = ?", [id], function (err, result) {
            if (!err && result.length > 0) {
                callback(result);
            } else {
                callback(null);

            }
        })

    },

    addCard: function (request, callback) {
        console.log(request)
        var sql = `INSERT INTO tbl_card SET ?`;
        var insertObject = {
            user_id: request.user_id,
            card_holder_name: request.card_holder_name,
            card_type_id: request.card_type_id,
            card_number: request.card_number,
            expiry_date: request.expiry_date
        };
        con.query(sql, [insertObject], function (error, result) {
            if (!error) {
                callback("1", 'reser_keyword_card_add', result);
            } else {
                console.log(error);
                callback("0",'reset_keyword_something_wrong_message', null)
            };
        });
    },

    getSavedCards: function (request,id, callback) {
        var sql = `SELECT c.id,tc.card_name,c.card_holder_name,c.card_number,c.expiry_date FROM tbl_card c JOIN tbl_card_type tc ON tc.id=c.card_type_id WHERE c.user_id = ? AND c.is_active = '1' AND c.is_delete = '0' AND is_saved ='1'`
        con.query(sql, [id], function (error, result) {
            if (!error && result.length > 0) {
                callback("1",'reset_keyword_success_message', result)
            }else{
                console.log(error);
                callback("0",'reset_keyword_something_wrong_message', null)
            };
        });
    },

    cardTypes: function (req, callback) {
        var sql = `SELECT id,card_name FROM tbl_card_type`;
        con.query(sql, function (error, result) {
            if (!error && result.length > 0) {
                callback("1",'reset_keyword_success_message', result)
            } else {
                console.log(error);
                callback("0",'reset_keyword_something_wrong_message', null)
            };
        });
    },

    addToCart: function (req, callback) {
        var sql = `INSERT INTO tbl_cart SET ?`;
        var insertObj = {
            user_id: req.user_id,
            product_id: req.product_id,
            cutting_id: (req.cutting_id != undefined && req.cutting_id != '') ? req.cutting_id : null,
            sub_total: req.sub_total,
            unit: req.unit,
            price: req.price
        };
        con.query(sql, [insertObj], function (err, result) {
            if (!err) {
                callback("1",'reset_keyword_success_message', null);
            } else {
                callback("0",'reset_keyword_something_wrong_message', null)
            };
        });
    },

    getUserDetails: function (id, callback) {
        con.query("select * from tbl_user where id = ?", [id], function (err, result) {
            if (!err && result.length > 0) {
                callback(result);

            } else {
                callback(null);

            }
        })

    },


    FindDistance: function (id, request, callback) {
        user.getUserDetails(id, function (userdata) {
            var lattitude = userdata[0].latitude;   
            var longitude = userdata[0].longitude;
            con.query(`SELECT m.*,(6371 * acos ( cos (radians(${lattitude}) ) * cos( radians(m.latitude) ) * cos( radians(m.longitude ) - radians(${longitude}
                ) ) + sin (radians(${lattitude}) ) * sin( radians(m.latitude ) ) ) ) AS distance FROM tbl_market m where is_active = 1 And is_delete = 0 HAVING distance < 10`, function (err, result) {
                if (!err && result.length > 0) {
                    callback("1",'reset_keyword_success_message', result);
                } else {
                    console.log(err);
                    callback("0",'reset_keyword_something_wrong_message', null)
                }
            })
        })
    },


    SavedAddress: function (id, request, callback) {
        con.query("select * from tbl_saved_address where user_id = ?", [id], function (err, result) {
            if (!err && result.length > 0) {
                var address_id = result[0].address_id;
                user.getAddressDetails(address_id, function (Addressdata) {
                    if (Addressdata != null) {
                        callback("1",'reset_keyword_success_message', Addressdata);
                    } else {
                        callback("0",'reset_keyword_something_wrong_message', null)
                    }
                })

            } else {
                callback("0",'reset_keyword_something_wrong_message', null)
            }

        })
    },

    getAddressDetails: function (id, callback) {
        con.query("select * from tbl_address where user_id = ?", [id], function (err, result) {
            if (!err && result.length > 0) {
                callback(result);
            } else {
                callback(null);

            }
        })

    },

    addNewAddress: function (req,id, callback) {
        var sql = `INSERT INTO tbl_address SET ?`;
        var insertObj = {
            user_id: id,
            city_id: req.city_id,
            property: req.property,
            street_name: req.street_name,
            nearby_landmark: req.nearby_landmark,
            area_name: req.area_name,
            villa_number: (req.property == "villa") ? req.villa_number : "",
            building_number: (req.property == 'apartment') ? req.building_number : "",
            apartment_number: (req.property == 'apartment') ? req.apartment_number : "",
            hotel_name: (req.property == 'hotel') ? req.hotel_name : "",
            room_number: (req.property == 'hotel') ? req.room_number : "0",
            hospital_name: (req.property == 'hospital') ? req.hospital_name : "",
            section: (req.property == 'hospital') ? req.section : "",
            floor: (req.property == 'hospital') ? req.floor : "",
            location_name: (req.property == 'other') ? req.location_name : "",
            location_number: (req.property == 'other') ? req.location_number : "",
        };
        con.query(sql, [insertObj], function (err, result) {
            console.log(err);
            if (!err) {
                callback("1",'reset_keyword_success_message', result);
            } else {
                callback("0",'reset_keyword_something_wrong_message', null)
            };
        });
    },


    favorite: function (req,id, callback) {
        var insertObj = {
            user_id: id,
            product_id: req.product_id
        }
        con.query("INSERT INTO tbl_favourites SET ?", [insertObj], function (err, result) {
            console.log(result);
            if (!err) {
                user.getfavorite(result.insertId, function (data) {
                    if (data == null) {
                        callback("0",'reset_keyword_something_wrong_message', null)
                    } else {
                        callback("1",'reset_keyword_success_message', data)
                    }
                })
            } else {
                console.log(err);
                callback("0",'reset_keyword_something_wrong_message', null)
            }
        })
    },

    getfavorite: function (id, callback) {
        con.query("SELECT * FROM tbl_favourites WHERE is_active=1 AND is_delete=0 AND id=?", [id], function (err, result) {
            console.log(result);
            if (!err && result.length > 0) {
                var data = result[0]
                callback(data)
            } else {
                callback(null)
            }
        })
    },

    searchEvent: function (request, callback) {
        con.query(`SELECT *,CONCAT('${global.BASE_URL}','${global.EVENT_URL}',event_image) as event_image FROM tbl_event WHERE (event_date IN ('${request.date}')) ORDER BY event_time`, function (error, result) {
            if (!error) {
                callback("1", "reset_keyword_success_message", result)
            } else {
                callback("0", "reset_keyword_something_wrong_message", null);
            }
        })
    },

    getTax:function(req,callback){
        con.query(`SELECT id,value_added_tax,service_charges,service_charges_tax FROM tbl_tax WHERE is_active = '1' AND is_delete = '0'`,function(error,result){
            if (!error && result.length > 0) {
                callback("1",'reset_keyword_success_message', result);
            } else {
                callback("0",'reset_keyword_something_wrong_message', null);
            };
        });
    },

    favouriteProduct:function(req,callback){
        con.query(`SELECT f.id,f.product_id,pd.name,CONCAT(u.first_name,' ',u.last_name) as user_name FROM tbl_favourites f JOIN tbl_product_details pd ON pd.id = f.id JOIN tbl_user u ON u.id = f.user_id WHERE user_id = ?`,[req.user_id],function(error,result){
            if (!error && result.length > 0) {
                callback('1','Data Found!!',result);
            } else {
                callback('0','rest_keywords_something_wrong',error);
            };
        });
    },
}

module.exports = user
