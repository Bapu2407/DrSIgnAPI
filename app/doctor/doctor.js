

const { check, validationResult } = require('express-validator');
const Doctor = require('../../models/doctor');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var FCM = require('fcm-node');
var serverKey = common.SERVER_KEY;
var fcm = new FCM(serverKey);
var request = require('request');
//var axios = require('axios');
const writeFile = promisify(fs.writeFile);
/*process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
});
*/
const commonDocFieldSave = (inputCollection, res) => {

  Doctor.findById(inputCollection.doctorId, function (err, doctor) {
    if (err || !doctor) return common.handleError(err, 'No Doctor record found with the given email/mobile number', res, 500)

    if (inputCollection.name)
      doctor.name = inputCollection.name
    if (inputCollection.designation && inputCollection.designation.trim() != "")
      doctor.designation = inputCollection.designation
    if (inputCollection.prefix && inputCollection.prefix.trim() != "")
      doctor.prefix = inputCollection.prefix
    if (inputCollection.suffix && inputCollection.suffix.trim() != "")
      doctor.suffix = inputCollection.suffix
    if (inputCollection.registeredAddress && inputCollection.registeredAddress.trim() != "")
      doctor.registeredAddress = inputCollection.registeredAddress
    if (inputCollection.dateOfBirth && inputCollection.dateOfBirth.trim() != "") {
      doctor.dateOfBirth = common.convertStringTodate(inputCollection.dateOfBirth)
    }

    if (inputCollection.practiceCategory && inputCollection.practiceCategory.trim() != "")
      doctor.practiceCategory = inputCollection.practiceCategory
    if (inputCollection.emailId)
      doctor.emailId = inputCollection.emailId

    if (inputCollection.degreeDiploma && inputCollection.degreeDiploma.trim() != "")
      doctor.degreeDiploma = inputCollection.degreeDiploma

    if (inputCollection.generalPractice && inputCollection.generalPractice.trim() != "")
      doctor.generalPractice = inputCollection.generalPractice

    if (inputCollection.alternateMobileNumber && inputCollection.alternateMobileNumber.trim() != "")
      doctor.alternateMobileNumber = inputCollection.alternateMobileNumber

    if (inputCollection.alternateEmailId && inputCollection.alternateEmailId.trim() != "")
      doctor.alternateEmailId = inputCollection.alternateEmailId



    if (inputCollection.uploadPhotoDemographic && inputCollection.uploadPhotoDemographic.trim() != "") {
      doctor.uploadPhotoDemographicURL = inputCollection.uploadPhotoDemographicURL
    }

    if (inputCollection.name && inputCollection.name.trim() != "")
      doctor.name = inputCollection.name
    if (inputCollection.designation && inputCollection.designation.trim() != "")
      doctor.designation = inputCollection.designation
    if (inputCollection.prefix && inputCollection.prefix.trim() != "")
      doctor.prefix = inputCollection.prefix
    if (inputCollection.suffix && inputCollection.suffix.trim() != "")
      doctor.suffix = inputCollection.suffix
    if (inputCollection.registeredAddress && inputCollection.registeredAddress.trim() != "")
      doctor.registeredAddress = inputCollection.registeredAddress

    if (inputCollection.issueingAuthority && inputCollection.issueingAuthority.trim() != "")
      doctor.issueingAuthority = inputCollection.issueingAuthority

    if (inputCollection.issueingDate && inputCollection.issueingDate.trim() != "") {
      doctor.issueingDate = common.convertStringTodate(inputCollection.issueingDate)
    }

    if (inputCollection.validTill && inputCollection.validTill.trim() != "") {
      doctor.validTill = common.convertStringTodate(inputCollection.validTill)
    }

    if (inputCollection.practiceCategory && inputCollection.practiceCategory.trim() != "")
      doctor.practiceCategory = inputCollection.practiceCategory
    if (inputCollection.emailId && inputCollection.emailId.trim() != "")
      doctor.emailId = inputCollection.emailId

    if (inputCollection.degreeDiploma && inputCollection.degreeDiploma.trim() != "")
      doctor.degreeDiploma = inputCollection.degreeDiploma

    if (inputCollection.generalPractice && inputCollection.generalPractice.trim() != "")
      doctor.generalPractice = inputCollection.generalPractice

    if (inputCollection.professionalPracticeExperience && inputCollection.professionalPracticeExperience.trim() != "")
      doctor.professionalPracticeExperience = inputCollection.professionalPracticeExperience

    if (inputCollection.currentPracticeInformation && inputCollection.currentPracticeInformation.trim() != "")
      doctor.currentPracticeInformation = inputCollection.currentPracticeInformation

    if (inputCollection.doctorRegistrationInformation && inputCollection.doctorRegistrationInformation.trim() != "")
      doctor.doctorRegistrationInformation = inputCollection.doctorRegistrationInformation

    if (inputCollection.alternateMobileNumber && inputCollection.alternateMobileNumber.trim() != "")
      doctor.alternateMobileNumber = inputCollection.alternateMobileNumber
    /* 
   if(inputCollection.uploadPhotoDemographic){
     doctor.uploadPhotoDemographicURL = inputCollection.uploadPhotoDemographicURL
   }
   */
    if (inputCollection.uploadPhotoProfessional && inputCollection.uploadPhotoProfessional.trim() != "") {
      doctor.uploadPhotoProfessionalURL = inputCollection.uploadPhotoProfessionalURL
    }


    /*
    if(inputCollection.uploadPhotoProfessional && inputCollection.uploadPhotoProfessional !=""){
      doctor.uploadPhotoProfessionalURL = inputCollection.uploadPhotoProfessionalURL
    }
*/
    if (inputCollection.active == false) {
      doctor.active = false
    }
    if (inputCollection.active == true) {
      doctor.active = true
    }

    doctor.updatedDate = new Date()

    doctor.save(function (err) {
      if (err) return common.handleError(err, 'updateMyDemographicProfile  could not be updated', res, 500)
      doctor.uploadPhotoProfessional = ''
      doctor.uploadPhotoDemographic = ''
      doctor.password = ''

      return res.json({
        status: true,
        message: 'Doctor update Success...',
        data: doctor
      });
      // res.send(doctor);
    });
  });


}
const main = async (demographicFileName, professionalFileName, inputCollection, whichfiles) => {
  return new Promise((resolve, reject) => {


    //new Error('some test dummy error from main function')
    //throw new Error("some test dummy error from main function");
    //return 
    if (professionalFileName && (whichfiles == "both" || whichfiles == "professional")) {
      dlog("professionalFileName :=" + professionalFileName)
      //  await writeFile(professionalFileName, inputCollection.uploadPhotoProfessional, 'base64');
      fs.writeFile(professionalFileName, inputCollection.uploadPhotoProfessional, 'base64', function (err) {
        if (err)
          //return common.handleError(err,' professionalFile could not be created ...',res,200)
          reject(err)
        dlog("professionalFile created successfully");

      });
    }
    if (demographicFileName && (whichfiles == "both" || whichfiles == "demographic")) {
      dlog("demographicFileName :=" + demographicFileName)
      //  await writeFile(professionalFileName, inputCollection.uploadPhotoProfessional, 'base64');

      fs.writeFile(demographicFileName, inputCollection.uploadPhotoDemographic, 'base64', function (err) {
        if (err)
          //  return common.handleError(err,'demographicFile could not be created ...',res,200)
          reject(err)
        dlog("demographicFile created successfully");

      });
    }

    resolve("file created at desired folder")

  })
}
const doFileProcessing = async (inputCollection, whichfiles, res) => {
  return new Promise((resolve, reject) => {

    if (process.env.ENVIRONMENT == "LOCAL") {
      inputCollection.fileFirstPart = "http://" + process.env.IPADDRESS + ":" + process.env.PORT
    } else {
      inputCollection.fileFirstPart = "http://" + process.env.IPADDRESS
    }

    var staticImageDir = process.env.IMAGE_PATH

    const photoRandomString = Str.random(8)
    dlog("photoRandomString =" + photoRandomString)

    let professionalFileNameSuf = "PhotoProfessional_" + photoRandomString + "_" + inputCollection.name.replace(/\s/g, '_')

    let demographicFileNameSuf = "PhotoDemographic_" + photoRandomString + "_" + inputCollection.name.replace(/\s/g, '_')

    let professionalFileName = staticImageDir + professionalFileNameSuf + "." + process.env.IMAGEFILEEXT
    let demographicFileName = staticImageDir + demographicFileNameSuf + "." + process.env.IMAGEFILEEXT

    inputCollection.uploadPhotoDemographicURL = inputCollection.fileFirstPart + "/public/images/" + demographicFileNameSuf + "." + process.env.IMAGEFILEEXT

    inputCollection.uploadPhotoProfessionalURL = inputCollection.fileFirstPart + "/public/images/" + professionalFileNameSuf + "." + process.env.IMAGEFILEEXT

    if (inputCollection.uploadPhotoDemographic) {
      inputCollection.uploadPhotoDemographic = inputCollection.uploadPhotoDemographic.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
    }

    if (inputCollection.uploadPhotoProfessional) {
      inputCollection.uploadPhotoProfessional = inputCollection.uploadPhotoProfessional.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
    }

    // try{

    Promise.all([createFiles(staticImageDir), main(demographicFileName, professionalFileName, inputCollection, whichfiles)])
      .then(() => { resolve(inputCollection); })
      .catch((error) => { reject(error) });

  })
}
const createFiles = (staticImageDir) => {
  return new Promise((resolve, reject) => {
    fs.stat(staticImageDir, function (err) {
      if (!err) {
        dlog('Directory exists, where the images will go');
        resolve('Directory exists, where the images will go')
      } else {
        //  throw err
        reject(new Error('Directory does not exist, where the images will go'))

      }
    });
  });
}
//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/signup', [

    check('name').not().isEmpty().trim().escape(),
    check('designation').not().isEmpty().trim(),
    check('registeredAddress').not().isEmpty().trim(),
    check('practiceCategory').not().isEmpty().trim(),
    //check('password').not().isEmpty().trim().escape(),
    check('emailId').not().isEmpty().trim().isEmail().normalizeEmail(),
    check('mobileNumber').not().isEmpty().trim(),
    check('uploadPhotoDemographic').not().isEmpty().trim(),
    check('degreeDiploma').not().isEmpty().trim(),
    check('generalPractice').not().isEmpty().trim(),
    check('registeredAddress').not().isEmpty().trim(),
    check('professionalPracticeExperience').not().isEmpty().trim(),
    check('currentPracticeInformation').not().isEmpty().trim(),
    check('doctorRegistrationInformation').not().isEmpty().trim(),
    check('uploadPhotoProfessional').not().isEmpty().trim()
  ], function (req, res) {
    //try{    
    dlog(" inside registration api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    dlog("name =" + req.body.name)

    var inputCollection = req.body

    if (inputCollection.dateOfBirth) {
      inputCollection.dateOfBirth = common.convertStringTodate(inputCollection.dateOfBirth)
    }

    if (inputCollection.issueingDate) {
      inputCollection.issueingDate = common.convertStringTodate(inputCollection.issueingDate)
    }

    if (inputCollection.validTill) {
      inputCollection.validTill = common.convertStringTodate(inputCollection.validTill)
    }

    //inputCollection =  doFileProcessing(inputCollection,"both",res)
    doFileProcessing(inputCollection, "both", res).then((result) => {

      dlog("i am here 1")

      inputCollection = result
      var temp = new Doctor(inputCollection)

      // insert data into database
      temp.save(function (error, doctor) {
        // check error
        if (error) {
          return common.handleError(error, 'DB Insert Fail...', res, 500)
        }
        if (doctor) {

          doctor.uploadPhotoProfessional = ''
          doctor.uploadPhotoDemographic = ''
          doctor.password = ''
          doctor.uploadPhotoDemographicURL = inputCollection.uploadPhotoDemographicURL
          doctor.uploadPhotoProfessionalURL = inputCollection.uploadPhotoProfessionalURL
        }

        if (req.body.otp) {
          let emailData = { name: doctor.name, email: doctor.emailId, subject: "Registration successful, please verify Your OTP" }

          //  emailData.jsondata = jsondata
          emailData.emailTemplate = '<h4>      Hi,  ' + doctor.name + ', your registration is successful,  your OTP is as follows ' + req.body.otp + '. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)

          let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + doctor.mobileNumber + "&text=" + req.body.otp

          // dlog("smsGatewayURL =="+smsGatewayURL)
          request({
            method: "GET",
            "rejectUnauthorized": false,
            "url": smsGatewayURL,
            "headers": { "Content-Type": "application/json" },
            function(err, data, body) {
              //    dlog("smsGatewayURL =="+smsGatewayURL)
              dlog("data ==" + JSON.stringify(data))
              dlog("body ==" + JSON.stringify(body))

            }
          })

        } else {
          let emailData = { name: doctor.name, email: doctor.emailId, subject: "Registration successful" }

          //emailData.jsondata = jsondata
          emailData.emailTemplate = '<h4>      Hi,  ' + doctor.name + ', your registration is successful. </h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)
        }
        // Everything OK
        return res.json({
          status: true,
          message: 'DB Insert Success...',
          data: doctor
        });
      });
    }, (err) => {
      let errMsg
      errMsg = err ? err.message : ""
      return res.json({
        status: false,
        message: 'DB Insert fails...',
        error: errMsg
      });
    });

  });

  app.post('/api/first-login', [
    check('emailPhone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)

    }

    const v = new Validator(req.body, {
      emailPhone: 'email'
    });


    let filter = { emailId: req.body.emailPhone, active: true };

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber: req.body.emailPhone };
      }

      const update = { password: req.body.password };

      try {

        Doctor.findOne(filter, function (err, doctor) {
          if (err || !doctor) return common.handleError(err, 'No Doctor record found with the given email/mobile number', res, 500)

          doctor.password = req.body.password

          if (req.body.fcmId && req.body.fcmId.trim() != "") {
            doctor.fcmId = req.body.fcmId
          }

          if (req.body.deviceId && req.body.deviceId.trim() != "") {
            doctor.deviceId = req.body.deviceId
          }


          doctor.save(function (err) {
            if (err) return common.handleError(err, 'Doctor password could not be updated', res, 500)
            doctor.uploadPhotoProfessional = ''
            doctor.uploadPhotoDemographic = ''

            return res.json({
              status: true,
              message: 'first-login Success...',
              data: doctor
            });
            // res.send(doctor);
          });
        });



      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Doctor password could not be updated', res, 500)

      }


    });



  });

  app.post('/api/login', [
    check('emailPhone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'
    });

    let filter = { emailId: req.body.emailPhone, password: req.body.password };

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber: req.body.emailPhone, password: req.body.password };
      }
      try {
        Doctor.findOne(filter, function (err, doctor) {
          if (err || !doctor) return common.handleError(err, 'No Doctor record found with the given email/mobile and the password', res, 500)

          if (!req.body.fcmId && !req.body.deviceId) {
            doctor.uploadPhotoProfessional = ''
            doctor.uploadPhotoDemographic = ''
            doctor.password = ''
            //   res.send(doctor);
            return res.json({
              status: true,
              message: 'login Success...',
              data: doctor
            });
          } else if (req.body.fcmId || req.body.deviceId) {
            if (req.body.fcmId && req.body.fcmId.trim() != "") {
              doctor.fcmId = req.body.fcmId
            }

            if (req.body.deviceId && req.body.deviceId.trim() != "") {
              doctor.deviceId = req.body.deviceId
            }

            doctor.save(function (err) {
              if (err) return common.handleError(err, 'Doctor fcmId or deviceId could not be updated', res, 500)
              doctor.uploadPhotoProfessional = ''
              doctor.uploadPhotoDemographic = ''
              doctor.password = ''

              return res.json({
                status: true,
                message: 'first-login Success...',
                data: doctor
              });
              // res.send(doctor);
            });
          }

        });
      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Error retrieving doctor record', res, 500)

      }
    });



  });

  //fetchDoctorDetails API
  app.post('/api/fetchDoctorDetails', [
    check('doctorId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchDoctorDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }


    try {
      Doctor.findById(req.body.doctorId, function (err, doctor) {

        if (err || !doctor) return common.handleError(err, 'No Doctor record found with the given doctorId', res, 500)
        doctor.uploadPhotoProfessional = ''
        doctor.uploadPhotoDemographic = ''
        doctor.password = ''

        return res.json({
          status: true,
          message: 'Doctor record found ...',
          data: doctor
        });

      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving Doctor record', res, 500)

    }
  });

  //updateMyDemographicProfile API
  app.post('/api/updateMyDemographicProfile', [
    check('doctorId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateMyDemographicProfile api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body
    if (req.body.uploadPhotoDemographic && req.body.uploadPhotoDemographic.trim() != "") {

      doFileProcessing(inputCollection, "demographic", res).then((result) => {
        try {
          commonDocFieldSave(inputCollection, res)
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Doctor password could not be updated', res, 500)

        }
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'Doctor update has failed...',
          error: errMsg
        });
      });
    } else {
      try {
        commonDocFieldSave(inputCollection, res)
      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Doctor password could not be updated', res, 500)

      }
    }

  });


  //updateMyProfessionalProfile API
  app.post('/api/updateMyProfessionalProfile', [
    check('doctorId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateMyProfessionalProfile api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body

    if (req.body.uploadPhotoProfessional && req.body.uploadPhotoProfessional.trim() != "") {

      doFileProcessing(inputCollection, "professional", res).then((result) => {
        try {
          commonDocFieldSave(inputCollection, res)
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Doctor could not be updated', res, 500)

        }
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'Doctor update has failed...',
          error: errMsg
        });
      });
    } else {
      try {
        commonDocFieldSave(inputCollection, res)
      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Doctor could not be updated', res, 500)

      }
    }





  });

  app.post('/api/updateDoctor', [
    check('doctorId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateMyProfessionalProfile api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body

    dlog("inputCollection ==" + JSON.stringify(inputCollection))

    if (req.body.uploadPhotoProfessional && req.body.uploadPhotoProfessional.trim() != "" && req.body.uploadPhotoDemographic && req.body.uploadPhotoDemographic.trim() != "") {


      doFileProcessing(inputCollection, "both", res).then((result) => {
        try {
          commonDocFieldSave(inputCollection, res)
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Doctor could not be updated', res, 500)

        }
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'Doctor update has failed as demographic image can not be saved...',
          error: errMsg
        });
      });


    } else if ((!req.body.uploadPhotoProfessional && !req.body.uploadPhotoDemographic) || (req.body.uploadPhotoProfessional && req.body.uploadPhotoProfessional.trim() == "" && req.body.uploadPhotoDemographic && req.body.uploadPhotoDemographic.trim() == "")) {
      try {
        commonDocFieldSave(inputCollection, res)
      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Doctor could not be updated', res, 500)

      }
    } if (req.body.uploadPhotoProfessional && req.body.uploadPhotoProfessional.trim() != "" && (!req.body.uploadPhotoDemographic || (req.body.uploadPhotoDemographic && req.body.uploadPhotoDemographic.trim() == ""))) {

      doFileProcessing(inputCollection, "professional", res).then((result) => {
        try {
          commonDocFieldSave(inputCollection, res)
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Doctor could not be updated', res, 500)

        }
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'Doctor update has failed...',
          error: errMsg
        });
      });
    } if (req.body.uploadPhotoDemographic && req.body.uploadPhotoDemographic.trim() != "" && (!req.body.uploadPhotoProfessional || (req.body.uploadPhotoProfessional && req.body.uploadPhotoProfessional.trim() == ""))) {

      doFileProcessing(inputCollection, "demographic", res).then((result) => {
        try {
          commonDocFieldSave(inputCollection, res)
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Doctor could not be updated', res, 500)

        }
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'Doctor update has failed ...',
          error: errMsg
        });
      });
    }






  });

  app.post('/api/send-otp', [
    check('emailPhone').not().isEmpty().trim().escape(),
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

    let filter = { emailId: req.body.emailPhone };

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber: req.body.emailPhone };
      }
      try {
        Doctor.findOne(filter, function (err, doctor) {
          if (err || !doctor) return common.handleError(err, 'No Doctor record found with the given email/mobile and the password', res, 500)
          dlog("doctor.mobileNumber ==" + doctor.mobileNumber)
          let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + doctor.mobileNumber + "&text=" + req.body.otp

          dlog("smsGatewayURL ==" + smsGatewayURL)

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



          let emailData = { name: doctor.name, email: doctor.emailId, subject: "Verify Your OTP" }
          let jsondata = {
            userName: doctor.name,
            otp: req.body.otp,
          }
          emailData.jsondata = jsondata
          emailData.emailTemplate = '<h4>      Hi,' + doctor.name + ',  your OTP is as follows ' + req.body.otp + '. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)


          return res.json({
            status: true,
            message: 'OTP Sent Success.fully..',
          });


        });
      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Error retrieving doctor record', res, 500)

      }
    });



  });

  app.post('/api/send-message-to-doctor', [
    check('doctorId').not().isEmpty().trim().escape(),
    check('message').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside send-message-to-doctor api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }


    try {
      Doctor.findById(req.body.doctorId, function (err, doctor) {

        if (err || !doctor) return common.handleError(err, 'No Doctor record found with the given doctorId', res, 500)
        doctor.uploadPhotoProfessional = ''
        doctor.uploadPhotoDemographic = ''
        doctor.password = ''

        let fcmId = doctor.fcmId

        dlog("fcmId == ", fcmId);

        var message = {
          to: fcmId,
          //  data: notification,
          notification: {
            'title': `drSignet Push Message`,
            'body': req.body.message,
            'icon': 'notification_icon',
          },
          data: {
            type: req.body.type,
            id: req.body.id,
            message: req.body.message,
          }


        };
        try {

          fcm.send(message, function (err, response) {
            if (err && req.body.directcall) {
              common.handleError(err, 'Something wrong in sending Push message to doctor', res, 500)
            }
          });
          dlog("Message sent to doctor successfully to doctor ", doctor.name);

          if (req.body.directcall) {
            return res.json({
              status: true,
              message: 'Message sent to doctor successfully ...',
              // data: doctor
            });
          }
        } catch (error) {
          console.error("ignore this error " + error)
          //return  common.handleError(error, 'Error retrieving Doctor record',res,500)

        }


      });
    } catch (error) {
      //console.error(error)
      if (req.body.directcall) {
        return common.handleError(error, 'Error retrieving Doctor record', res, 500)
      }

    }
  });
}