

const { check, validationResult } = require('express-validator');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID
//var axios = require('axios');
var request = require('request');
const Str = require('@supercharge/strings')
// res.send(lab);


const dealWithAllFieldsBankAc = async (req, res, duringAdd) => {

  const photoRandomString = Str.random(8)
  dlog("photoRandomString =" + photoRandomString)

  let bankAc = req.body
  let fielchange = {}

  console.log("bankAc.distributorAgreementCertURL == " + bankAc.distributorAgreementCertURL)


  let successMsg = "Data Saved Successfully"
  let failureMsg = "Failure in saving data"
  console.log("duringAdd = " + duringAdd)
  if (duringAdd) {

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog(successMsg)
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
      var db = database.db()

      bankAc.active = true
      //collection_json.appointmentDate = newDate.toISOString()//newDate
      bankAc.createdDate = new Date()

      db.collection('bank-accounts').insertOne(bankAc, function (error, response) {

        if (error) {
          return common.handleError(error, failureMsg, res, 500)
        }

        if (response) {
          let bankAc = response.ops[0]

          console.log("lab == " + JSON.stringify(bankAc))
          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: bankAc
          });

        }
      });

    });


  } else if (!duringAdd) {
    try {
      console.log("req.body.pharmacyId == " + req.body.pharmacyId)
      //console.log("req.body.bankAcId == "+req.body.bankAcId)
      let filter = { pharmacyId: req.body.pharmacyId }

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        if (bankAc.acNumber && bankAc.acNumber.trim() != "")
          fielchange.acNumber = bankAc.acNumber.trim()

        if (bankAc.bankName && bankAc.bankName.trim() != "")
          fielchange.bankName = bankAc.bankName

        if (bankAc.branchName && bankAc.branchName.trim() != "")
          fielchange.branchName = bankAc.branchName


        if (bankAc.acType && bankAc.acType.trim() != "")
          fielchange.acType = bankAc.acType

        if (bankAc.ifscCode && bankAc.ifscCode.trim() != "")
          fielchange.ifscCode = bankAc.ifscCode

        if (bankAc.acHolderName && bankAc.acHolderName.trim() != "")
          fielchange.acHolderName = bankAc.acHolderName

        if (bankAc.active == false) {
          fielchange.active = false
        }
        if (bankAc.active == true) {
          fielchange.active = true
        }

        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection('bank-accounts').findOne(filter, function (err, bankAcRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching bankAc', res, 500)
          }

          if (!bankAcRec) {
            database.close();
            return common.handleError(err, ' No bankAc record found with the given bankAc ID', res, 500)
          }

          db.collection('bank-accounts').findOneAndUpdate(filter, fielchange, { returnOriginal: false }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'bankAc password could not be updated', res, 500)
            }
            let bankAc = response.value

            database.close();
            return res.json({
              status: true,
              message: 'bankAc record update Success...',
              data: bankAc
            });

          });

        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'bankAc password could not be updated', res, 500)

    }
  }


}
const dealWithAllFiles = async (req, res, duringAdd, type) => {

  const photoRandomString = Str.random(8)
  dlog("photoRandomString =" + photoRandomString)

  let pharma = req.body
  let fielchange = {}
  if (req.body.pharmacyLicense && req.body.pharmacyLicense.length > 0) {
    let uploadedFileNameSuf = "pharmacyLicense" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(pharma, "prescription", uploadedFileNameSuf, "pharmacyLicense", "pharmacyLicenseURL")
    pharma.pharmacyLicenseURL = objectFrom.pharmacyLicenseURL

    fielchange.pharmacyLicense = req.body.pharmacyLicense
    fielchange.pharmacyLicenseURL = pharma.pharmacyLicenseURL

  }

  console.log("pharma.pharmacyLicenseURL == " + pharma.pharmacyLicenseURL)

  if (req.body.distributorAgreementCert && req.body.distributorAgreementCert.length > 0) {
    let uploadedFileNameSuf = "distributorAgreementCert" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(pharma, "prescription", uploadedFileNameSuf, "distributorAgreementCert", "distributorAgreementCertURL")
    pharma.distributorAgreementCertURL = objectFrom.distributorAgreementCertURL
    fielchange.distributorAgreementCert = req.body.distributorAgreementCert
    fielchange.distributorAgreementCertURL = pharma.distributorAgreementCertURL

  }


  if (req.body.uploadedFile && req.body.uploadedFile.length > 0) {
    let uploadedFileNameSuf = "profilePhoto" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(pharma, "prescription", uploadedFileNameSuf, "uploadedFile", "uploadedFileURL")
    pharma.uploadedFileURL = objectFrom.uploadedFileURL
    //  fielchange.uploadedFile = req.body.uploadedFile
    fielchange.uploadedFileURL = pharma.uploadedFileURL
  }

  if (req.body.aadharFile && req.body.aadharFile.length > 0) {
    let aadharFileNameSuf = "aadharPhoto" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(pharma, "prescription", aadharFileNameSuf, "aadharFile", "aadharFileURL")
    pharma.aadharFileURL = objectFrom.aadharFileURL
    // fielchange.aadharFile = req.body.aadharFile
    fielchange.aadharFileURL = pharma.aadharFileURL
  }

  if (req.body.driverLicenseFile && req.body.driverLicenseFile.length > 0) {
    let driverLicenseFileNameSuf = "driverLicensePhoto" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(pharma, "prescription", driverLicenseFileNameSuf, "driverLicenseFile", "driverLicenseFileURL")
    pharma.driverLicenseFileURL = objectFrom.driverLicenseFileURL
    // fielchange.driverLicenseFile = req.body.driverLicenseFile
    fielchange.driverLicenseFileURL = pharma.driverLicenseFileURL
  }




  let successMsg = "Data Saved Successfully"
  let failureMsg = "Failure in saving data"
  let filter = { _id: new ObjectId(req.body.pharmacyId) }
  let collectionName = "pharmacyusers"
  if (type == "profile") {
    if (!duringAdd)
      filter = { _id: new ObjectId(req.body.pharmacyId) }
    collectionName = "pharmacyusers"
  } if (type == "agents") {
    if (!duringAdd)
      filter = { _id: new ObjectId(req.body.agentsId) }
    collectionName = "agents"
  }
  if (pharma && duringAdd) {

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog(successMsg)
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
      var db = database.db()

      pharma.active = true
      //collection_json.appointmentDate = newDate.toISOString()//newDate
      pharma.createdDate = new Date()

      db.collection(collectionName).insertOne(pharma, function (error, response) {

        if (error) {
          return common.handleError(error, failureMsg, res, 500)
        }

        if (response) {
          let pharmaAfterSave = response.ops[0]
          pharmaAfterSave.uploadedFile = ''

          //console.log("lab == "+JSON.stringify(lab))
          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: pharmaAfterSave
          });

        }
      });

    });


  }

  console.log("pharma.distributorAgreementCertURL == " + pharma.distributorAgreementCertURL)

  if (pharma && !duringAdd) {
    try {
      console.log("req.body.pharmaId == " + req.body.pharmacyId)
      //console.log("req.body.pharmaId == "+req.body.pharmaId)



      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        if (pharma.name && pharma.name.trim() != "")
          fielchange.name = pharma.name.trim()

        if (pharma.email && pharma.email.trim() != "")
          fielchange.email = pharma.email

        if (pharma.mobile && pharma.mobile.trim() != "")
          fielchange.mobile = pharma.mobile

        if (pharma.mobileNumber && pharma.mobileNumber.trim() != "")
          fielchange.mobileNumber = pharma.mobileNumber


        if (pharma.streetName && pharma.streetName.trim() != "")
          fielchange.streetName = pharma.streetName

        if (pharma.housePlotNo && pharma.housePlotNo.trim() != "")
          fielchange.housePlotNo = pharma.housePlotNo

        if (pharma.landmark && pharma.landmark.trim() != "")
          fielchange.landmark = pharma.landmark

        if (pharma.pincode && pharma.pincode.trim() != "")
          fielchange.pincode = pharma.pincode

        if (pharma.area && pharma.area.trim() != "")
          fielchange.area = pharma.area


        if (pharma.city && pharma.city.trim() != "")
          fielchange.city = pharma.city


        if (pharma.fielchangeName)
          fielchange.fielchangeName = pharma.fielchangeName

        if (pharma.cityAreaPinFormArr)
          fielchange.cityAreaPinFormArr = pharma.cityAreaPinFormArr



        if (pharma.active == false) {
          fielchange.active = false
        }
        if (pharma.active == true) {
          fielchange.active = true
        }

        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection(collectionName).findOne(filter, function (err, pharmaRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching pharma', res, 500)
          }

          if (!pharmaRec) {
            database.close();
            return common.handleError(err, ' No pharma record found with the given pharma ID', res, 500)
          }

          db.collection(collectionName).findOneAndUpdate(filter, fielchange, { returnOriginal: false }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'pharma record could not be updated', res, 500)
            }
            let pharma = response.value

            pharma.uploadedFile = ''
            pharma.aadharFile = ''
            pharma.driverLicenseFile = ''

            database.close();
            return res.json({
              status: true,
              message: 'pharma record update Success...',
              data: pharma
            });

          });

        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'pharma record could not be updated', res, 500)

    }
  }

}
//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/addLabAdmin', [

    check('name').not().isEmpty().trim().escape(),

    check('mobileNumber').not().isEmpty().trim(),
    check('pin').not().isEmpty().trim(),
    check('city').not().isEmpty().trim()
  ], function (req, res) {
    //try{    
    dlog(" inside addLabAdmin api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    dlog("name =" + req.body.name)

    var inputCollection = req.body

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog("labAdminDBUrl Database connected successfully at post /addLabAdmin")

      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      var db = database.db()


      inputCollection.active = true
      //collection_json.appointmentDate = newDate.toISOString()//newDate
      inputCollection.createdDate = new Date()

      db.collection('labAdmins').insertOne(inputCollection, function (error, response) {

        let labAdmin = response.ops[0]

        //dlog("NEWLY added labAdmin == "+JSON.stringify(labAdmin))             

        if (error) {
          return common.handleError(error, 'DB Insert Fail...', res, 500)
        }


        return res.json({
          status: true,
          message: 'DB Insert Success...',
          data: labAdmin
        });
      });

    });


  });

  app.post('/api/fetchlabAdminDetails', [
    check('labAdminId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchlabAdminDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.labAdminId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("labAdminDB Database connected successfully at post /login-labAdmin ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('labAdmins').findOne(filter, function (error, labAdmin) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching labAdmin record', res, 500)
          }
          if (!labAdmin) {
            database.close();
            return common.handleError(err, 'labAdmin could not be found', res, 500)
          }

          labAdmin.uploadPhotoDemographic = ''

          database.close();
          return res.json({
            status: true,
            message: 'fetch Success...',
            data: labAdmin
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

    }


  });



  app.post('/api/send-otp-labadmin', [
    check('mobileNumber').not().isEmpty().trim().escape(),
    check('otp').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'
    });

    let filter = { mobileNumber: req.body.mobileNumber };

    try {

      MongoClient.connect(mongoDB.doctorDBUrl, { useNewUrlParser: true }, function (err, database) {
        //   assert.equal(null, err);
        dlog("labAdminDB Database connected successfully at post /send-otp-labAdmin")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('labAdmins').findOne(filter, function (error, labAdmin) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching labAdmin record', res, 500)
          }
          if (!labAdmin) {
            database.close();
            return common.handleError(err, 'No labAdmin record found with the given mobile', res, 500)
          }

          let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + labAdmin.mobileNumber + "&text=" + req.body.otp


          request({
            method: "GET",
            "rejectUnauthorized": false,
            "url": smsGatewayURL,
            "headers": { "Content-Type": "application/json" },
            function(err, data, body) {
              dlog("data ==" + JSON.stringify(data))
              dlog("body ==" + JSON.stringify(body))

            }
          })



          /*
              *****************************************
              Call the SMS GateWay to send SMS to user mobile 
              *****************************************
 
          */

          return res.json({
            status: true,
            message: 'OTP Sent Success.fully..',
            data: labAdmin
          });
        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

    }
    //});



  });
  app.post('/api/fetchlabAdminByPhone', [
    check('mobileNumber').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchlabAdminDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { mobileNumber: req.body.mobileNumber }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("labAdminDB Database connected successfully at post /login-labAdmin ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('labAdmins').findOne(filter, function (error, labAdmin) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching labAdmin record', res, 500)
          }
          if (!labAdmin) {
            database.close();
            return res.json({
              status: true,
              message: 'fetch Success...',
              data: { message: "norecord" }
            });

            //return common.handleError(err, 'labAdmin could not be found',res,500)                    
          }

          database.close();
          return res.json({
            status: true,
            message: 'fetch Success...',
            data: { message: "record" }
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

    }


  });

  app.post('/api/updateLabAdmin', [
    check('labAdminId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateLabAdmin api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body



    try {
      let filter = { _id: new ObjectId(req.body.labAdminId) }
      //  LabAdmin.findById(req.body.labAdminId, function (err, labAdmin) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("labAdminDB Database connected successfully at post /updateProfile")


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        let fields = {}

        let fielchange = {}

        if (req.body.name && req.body.name.trim() != "")
          fielchange.name = req.body.name

        if (req.body.fcmToken && req.body.fcmToken.trim() != "")
          fielchange.fcmToken = req.body.fcmToken


        if (req.body.addressline && req.body.addressline.trim() != "")
          fielchange.addressline = req.body.addressline

        if (req.body.addressline2 && req.body.addressline2.trim() != "")
          fielchange.addressline2 = req.body.addressline2

        if (req.body.city && req.body.city.trim() != "")
          fielchange.city = req.body.city

        if (req.body.labId && req.body.labId.trim() != "")
          fielchange.labId = req.body.labId


        if (req.body.pin && req.body.pin.trim() != "")
          fielchange.pin = req.body.pin
        if (req.body.email && req.body.email.trim() != "")
          fielchange.email = req.body.email


        if (req.body.mobileNumber && req.body.mobileNumber.trim() != "")
          fielchange.mobileNumber = req.body.mobileNumber



        if (req.body.active == false) {
          fielchange.active = false
        }
        if (req.body.active == true) {
          fielchange.active = true
        }

        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection('labAdmins').findOne(filter, function (err, labAdminRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching labAdmin', res, 500)
          }

          if (!labAdminRec) {
            database.close();
            return common.handleError(err, ' No labAdmin record found with the given labAdmin ID', res, 500)
          }

          db.collection('labAdmins').findOneAndUpdate(filter, fielchange, { returnOriginal: false }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'labAdmin password could not be updated', res, 500)
            }
            let labAdmin = response.value

            database.close();
            return res.json({
              status: true,
              message: 'labAdmin record update Success...',
              data: labAdmin
            });

          });

        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'LabAdmin password could not be updated', res, 500)

    }


  });

  app.post('/api/fetch-all-labAdmins', function (req, res) {
    dlog(" inside all-labAdmins api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-labAdmins")

      let filter = { active: true }

      db.collection('labAdmins').find(filter).toArray(function (err, labAdminArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching labAdmin ', res, 500)
        if (!labAdminArry || (labAdminArry && labAdminArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No labAdminArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'labAdmin array retrieval success...',
          //data: doctorIdList
          data: labAdminArry
        });

      });

    });

  });



  app.post('/api/send-otp-pharmasignin', [
    check('mobileNumber').not().isEmpty().trim().escape(),
    check('otp').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'
    });

    let filter = { mobileNumber: req.body.mobileNumber };


    try {

      MongoClient.connect(mongoDB.doctorDBUrl, { useNewUrlParser: true }, function (err, database) {
        //   assert.equal(null, err);
        dlog("labAdminDB Database connected successfully at post /send-otp-labAdmin")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('pharmacyusers').findOne(filter, function (error, labAdmin) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching Pharmacy account', res, 500)
          }
          if (!labAdmin) {
            database.close();
            return common.handleError(err, 'No Pharmacy account found with the given mobile', res, 500)
          }

          let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + labAdmin.mobileNumber + "&text=" + req.body.otp


          request({
            method: "GET",
            "rejectUnauthorized": false,
            "url": smsGatewayURL,
            "headers": { "Content-Type": "application/json" },
            function(err, data, body) {
              dlog("data ==" + JSON.stringify(data))
              dlog("body ==" + JSON.stringify(body))

            }
          })



          /*
              *****************************************
              Call the SMS GateWay to send SMS to user mobile 
              *****************************************
 
          */

          return res.json({
            status: true,
            message: 'OTP Sent Success.fully..',
            data: labAdmin
          });
        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

    }
    //});



  });

  app.post('/api/send-otp-pharmasignup', [
    check('mobileNumber').not().isEmpty().trim().escape(),
    check('otp').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside send-otp-pharmasignup api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {

      let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + req.body.mobileNumber + "&text=" + req.body.otp
      request({
        method: "GET",
        "rejectUnauthorized": false,
        "url": smsGatewayURL,
        "headers": { "Content-Type": "application/json" },
        function(err, data, body) {
          dlog("data ==" + JSON.stringify(data))
          dlog("body ==" + JSON.stringify(body))

        }
      })

      return res.json({
        status: true,
        message: 'OTP Sent Success.fully..',
        data: "dummy"
      });



    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

    }
    //});



  });

  app.post('/api/fetch-all-serviceAreas-pharma', function (req, res) {
    dlog(" inside all-patients api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-patients")

      let filter = { pharmacyId: req.body.pharmacyId, active: true }

      dlog("filter =" + JSON.stringify(filter))

      db.collection('serviceareas-pharma').find(filter).toArray(function (err, serviceAreasArray) {

        if (err) return common.handleError(err, 'Error, Erro fetching patient ', res, 500)
        if (!serviceAreasArray || (serviceAreasArray && serviceAreasArray.length == 0)) {
          database.close();
          return common.handleError(err, 'No serviceAreasArray record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Patient array retrieval success...',
          data: serviceAreasArray
        });

      });

    });

  });

  app.post('/api/addServiceareasPharmacy', function (req, res) {
    //try{    
    dlog(" inside addServiceareas api  ")

    //dlog("body ="+JSON.stringify(req.body))

    //dlog("name ="+req.body.name)

    var inputCollection = req.body

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog("patientDBUrl Database connected successfully at post /addServiceareasPharmacy")

      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      var db = database.db()


      inputCollection.active = true

      inputCollection.createdDate = new Date()

      db.collection('serviceareas-pharma').insertOne(inputCollection, function (error, response) {

        let serviceAreas = response.ops[0]

        //dlog("NEWLY added patient == "+JSON.stringify(patient))             

        if (error) {
          return common.handleError(error, 'DB Insert Fail...', res, 500)
        }


        return res.json({
          status: true,
          message: 'DB Insert Success...',
          data: serviceAreas
        });
      });

    });


  });


  app.post('/api/updateServiceareasPharmacy', [
    check('serviceAreaId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateServiceareasPharmacy api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body



    try {
      let filter = { _id: new ObjectId(req.body.serviceAreaId) }
      //  Serviceareas.findById(req.body.serviceAreasId, function (err, serviceAreas) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("serviceAreasDB Database connected successfully at post /updateProfile")


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        let fields = {}

        let fielchange = {}

        if (req.body.pinCode && req.body.pinCode.trim() != "")
          fielchange.pinCode = req.body.pinCode


        if (req.body.areaName && req.body.areaName.trim() != "")
          fielchange.areaName = req.body.areaName

        if (req.body.active == false) {
          fielchange.active = false
        }
        if (req.body.active == true) {
          fielchange.active = true
        }

        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection('serviceareas-pharma').findOne(filter, function (err, serviceAreasRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching serviceAreas', res, 500)
          }

          if (!serviceAreasRec) {
            database.close();
            return common.handleError(err, ' No serviceAreas record found with the given serviceAreas ID', res, 500)
          }

          db.collection('serviceareas-pharma').findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'serviceAreas password could not be updated', res, 500)
            }
            let serviceAreas = response.value

            database.close();
            return res.json({
              status: true,
              message: 'serviceAreas record update Success...',
              data: serviceAreas
            });

          });

        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Serviceareas password could not be updated', res, 500)

    }


  });


  app.post('/api/getPharmaProfile', [
    check('pharmacyId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside getPharmaProfile api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.invoicecrmId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("invoicecrmDB Database connected successfully at post /getPharmaProfile ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('serviceareas-pharma').findOne(filter, function (error, invoicecrm) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching pharmaprofile record', res, 500)
          }
          if (!invoicecrm) {
            database.close();
            return common.handleError(err, 'pharmaprofile could not be found', res, 500)
          }

          ''
          database.close();

          return res.json({
            status: true,
            message: 'Pharmaprofile Generated successfully.',
            data: invoiceCrm
          });


        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }


  });


  app.post('/api/updateProfilePharmacy', [
    check('pharmacyId').not().isEmpty().trim().escape(),
    check('email').trim().escape(),
    check('mobile').trim().escape(),
    check('streetName').trim(),
    check('housePlotNo').trim(),
    check('landmark').trim(),
    check('pincode').escape(),
    check('area').trim().escape(),
    check('city').trim().escape(),
    check('pharmacyLicense').trim(),
    check('distributorAgreementCert').trim()


    // check('labemailIdPrimary').not().isEmpty().trim().isEmail().normalizeEmail(),
    // check('ownername').escape(),
    // check('ownermobileNumber').not().isEmpty().trim(),
    //  check('labmobileNumber').trim()
  ], function (req, res) {
    dlog(" inside updateLabProfile api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    //inputCollection =  doFileProcessing(inputCollection,"Profile")
    try {

      dealWithAllFiles(req, res, false, "profile")

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Lab password could not be updated', res, 500)

    }


  });

  app.post('/api/updateProfilePharmacy', [
    check('pharmacyId').not().isEmpty().trim().escape(),
    check('email').trim().escape(),
    check('mobile').trim().escape(),
    check('streetName').trim(),
    check('housePlotNo').trim(),
    check('landmark').trim(),
    check('pincode').escape(),
    check('area').trim().escape(),
    check('city').trim().escape(),
    check('pharmacyLicense').trim(),
    check('distributorAgreementCert').trim()


    // check('labemailIdPrimary').not().isEmpty().trim().isEmail().normalizeEmail(),
    // check('ownername').escape(),
    // check('ownermobileNumber').not().isEmpty().trim(),
    //  check('labmobileNumber').trim()
  ], function (req, res) {
    dlog(" inside updateLabProfile api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    //inputCollection =  doFileProcessing(inputCollection,"Profile")
    try {

      dealWithAllFiles(req, res, false, "profile")

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Lab password could not be updated', res, 500)

    }


  });


  app.post('/api/updatePharmacyAgents', [
    check('pharmacyId').trim(),
    check('agentsId').trim(),

    check('mobileNumber').trim().escape(),
    check('email').trim().escape(),
    check('name').trim(),

    check('uploadedFile').trim(),
    check('uploadedFileURL').trim()


  ], function (req, res) {
    dlog(" inside updateLabProfile api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {

      dealWithAllFiles(req, res, false, "agents")

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Lab password could not be updated', res, 500)

    }


  });
  app.post('/api/updateBankacPharmacy', [
    check('pharmacyId').trim()

  ], function (req, res) {
    dlog(" inside updateLabProfile api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {
      dealWithAllFieldsBankAc(req, res, req.body.addRecord)
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Lab password could not be updated', res, 500)

    }


  });

  app.post('/api/addPharmacyAgents', function (req, res) {
    dlog(" inside addPharmacyAgents api ")
    /*
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.', res, 999)
        }
    */
    try {

      dealWithAllFiles(req, res, true, "agents")

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Lab password could not be updated', res, 500)

    }


  });



  app.post('/api/fetchPharmacyAccount', [
    check('pharmacyId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchlabAdminDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.pharmacyId) }
    try {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("pharmacyUser Database connected successfully at post /send-otp-labAdmin")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('pharmacyusers').findOne(filter, function (error, pharmacyUser) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching Pharmacy account', res, 500)
          }
          if (!pharmacyUser) {
            database.close();
            return common.handleError(err, 'No Pharmacy account found with the given mobile', res, 500)
          }


          return res.json({
            status: true,
            message: 'Pharmacy Account retrieved',
            data: pharmacyUser
          });
        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

    }
    //});





  });



  app.post('/api/getPharmaBankac', [
    check('pharmacyId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside getPharmaProfile api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { pharmacyId: req.body.pharmacyId }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("invoicecrmDB Database connected successfully at post /getPharmaBankac ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('bank-accounts').findOne(filter, function (error, bankAccount) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching pharmaprofile record', res, 500)
          }
          if (!bankAccount) {
            database.close();
            return common.handleError(err, 'bank account could not be found', res, 500)
          }

          ''
          database.close();

          return res.json({
            status: true,
            message: 'Bank Ac retrieved successfully.',
            data: bankAccount
          });


        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }


  });



}