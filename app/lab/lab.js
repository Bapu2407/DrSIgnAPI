

const { check, validationResult } = require('express-validator');

const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var mongoDB = require('../../databaseconstant');
var fs = require('fs');
var FCM = require('fcm-node');
var serverKey = common.SERVER_KEY;
var fcm = new FCM(serverKey);
var request = require('request');
//var axios = require('axios');
const writeFile = promisify(fs.writeFile);
var ObjectId = require('mongodb').ObjectID
var MongoClient = require('mongodb').MongoClient;



const getColAgentAvgRating = async (colAgentsArray) => {
  let promises = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  colAgentsArray.forEach(function (colAgent, index) {
    if (colAgent && ObjectId.isValid(colAgent._id)) {

      colAgent.image = ''

      promises.push(new Promise(resolve => {
        try {
          MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()

            dlog("colAgent._id==" + colAgent._id)
            db.collection('ratingCollectionagents').aggregate(
              [

                {
                  $group:
                  {
                    _id: "$agentId",
                    avgRating: { $avg: "$ratingString" }
                  }
                }
              ]
            ).toArray(function (err, ratingArray) {

              dlog("ratingArray Cole Agent" + JSON.stringify(ratingArray))



              if (err) {
                database.close();
                resolve(colAgent)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
              if (!ratingArray || (ratingArray && ratingArray.length == 0)) {
                database.close();
                //return common.handleError(err, 'patient could not be found',res,500)                    
                colAgent.rating = 0

              }
              if (ratingArray || (ratingArray && ratingArray.length > 0)) {

                for (var t in ratingArray) {
                  let agentId = ratingArray[t]._id
                  if (agentId == colAgent._id) {
                    colAgent.rating = ratingArray[t].avgRating
                    if (colAgent.rating) {
                      colAgent.rating = colAgent.rating.toFixed(1)
                    }
                    database.close();
                    break
                  } else { continue }

                  //if(result[0]){
                  //          avgRating = result[0].avgRating
                  //      break
                }
              }

              resolve(colAgent)




            });
          })
        } catch (error) {
          console.error(error)
          //  return  common.handleError(error, 'Error retrieving customer record',res,500)   

        }


      }));
    }
    //else{
    //continue
    //}

  })

  return Promise.all(promises)

}

const getColAgentWithRating = async (collectionagentsArray, res) => {
  collectionagentsArray = await getColAgentAvgRating(collectionagentsArray)

  return res.json({
    status: true,
    message: 'Collection Agents array retrieval successful.',
    data: collectionagentsArray
  });

}
const dealWithAllFiles = async (req, res, duringAdd) => {

  const photoRandomString = Str.random(8)
  dlog("photoRandomString =" + photoRandomString)

  let lab = req.body
  let fielchange = {}
  if (req.body.labLicenseOperationCerCopy) {
    let uploadedFileNameSuf = "labLicenseOperationCerCopy" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(lab, "prescription", uploadedFileNameSuf, "labLicenseOperationCerCopy", "labLicenseOperationCerCopyURL")
    lab.labLicenseOperationCerCopyURL = objectFrom.labLicenseOperationCerCopyURL

    fielchange.labLicenseOperationCerCopy = req.body.labLicenseOperationCerCopy
    fielchange.labLicenseOperationCerCopyURL = lab.labLicenseOperationCerCopyURL

  }

  console.log("lab.labLicenseOperationCerCopyURL == " + lab.labLicenseOperationCerCopyURL)

  if (req.body.labIdentityCerCopy) {
    let uploadedFileNameSuf = "labIdentityCerCopy" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(lab, "prescription", uploadedFileNameSuf, "labIdentityCerCopy", "labIdentityCerCopyURL")
    lab.labIdentityCerCopyURL = objectFrom.labIdentityCerCopyURL
    fielchange.labIdentityCerCopy = req.body.labIdentityCerCopy
    fielchange.labIdentityCerCopyURL = lab.labIdentityCerCopyURL

  }
  console.log("lab.labIdentityCerCopyURL == " + lab.labIdentityCerCopyURL)

  if (req.body.labNocForm) {
    let uploadedFileNameSuf = "labNocForm" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(lab, "prescription", uploadedFileNameSuf, "labNocForm", "labNocFormURL")
    lab.labNocFormURL = objectFrom.labNocFormURL
    fielchange.labNocForm = req.body.labNocForm
    fielchange.labNocFormURL = lab.labNocFormURL
  }
  console.log("lab.labNocFormURL == " + lab.labNocFormURL)

  if (req.body.pathLabImage) {
    let uploadedFileNameSuf = "pathLabImage" + photoRandomString + "_"
    let objectFrom = await common.doFileProcessing(lab, "prescription", uploadedFileNameSuf, "pathLabImage", "pathLabImageURL")
    lab.pathLabImageURL = objectFrom.pathLabImageURL
    fielchange.pathLabImage = req.body.pathLabImage
    fielchange.pathLabImageURL = lab.pathLabImageURL
  }

  console.log("lab.pathLabImageURL == " + lab.pathLabImageURL)

  let successMsg = "Data Saved Successfully"
  let failureMsg = "Failure in saving data"

  if (lab && duringAdd) {

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog(successMsg)
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
      var db = database.db()

      lab.active = true
      //collection_json.appointmentDate = newDate.toISOString()//newDate
      lab.createdDate = new Date()

      db.collection('lab_profile_details').insertOne(lab, function (error, response) {

        if (error) {
          return common.handleError(error, failureMsg, res, 500)
        }

        if (response) {
          let lab = response.ops[0]
          lab.labIdentityCerCopy = ''
          lab.labLicenseOperationCerCopy = ''
          lab.labNocForm = ''
          lab.pathLabImage = ''

          console.log("lab == " + JSON.stringify(lab))
          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: lab
          });

        }
      });

    });


    if (req.body.otp) {
      let emailData = { labname: lab.name, ownername: lab.ownername, email: lab.labemailIdPrimary, subject: "Lab Registration successful, please verify Your OTP" }

      //  emailData.jsondata = jsondata
      emailData.emailTemplate = '<h4>      Hi,  ' + lab.ownername + ', your registration for Lab  ' + lab.name + '  is successful,  your OTP is as follows ' + req.body.otp + '. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

      common.sendHTMLemail(emailData)
    } else {
      let emailData = { labname: lab.name, ownername: lab.ownername, email: lab.emailId, subject: "Lab Registration successful" }

      //emailData.jsondata = jsondata
      emailData.emailTemplate = '<h4>      Hi,  ' + lab.ownername + ', your registration for ' + lab.name + 'is successful </h4><p>      Thanking you.   </p>'

      common.sendHTMLemail(emailData)
    }
  } else if (lab && !duringAdd) {
    try {
      console.log("req.body.labId == " + req.body.labId)
      //console.log("req.body.labId == "+req.body.labId)
      let filter = { _id: new ObjectId(req.body.labId) }
      //  lab.findById(req.body.labId, function (err, lab) {
      // common.doFileProcessing(inputCollection,"prescription",uploadedFileNameSuf,"uploadedFile","uploadedFileURL").then((result) => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        //  dlog("labDB Database connected successfully at post /updateOrde,the request object "+JSON.stringify(req.body))


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()


        if (lab.name && lab.name.trim() != "")
          fielchange.name = lab.name.trim()



        if (lab.labOpenHourFrom && lab.labOpenHourFrom.trim() != "")
          fielchange.labOpenHourFrom = lab.labOpenHourFrom

        if (lab.labOpenHourTo && lab.labOpenHourTo.trim() != "")
          fielchange.labOpenHourTo = lab.labOpenHourTo


        if (lab.lablicenseno && lab.name.trim() != "")
          fielchange.lablicenseno = lab.lablicenseno

        if (lab.latitude && lab.name.trim() != "")
          fielchange.latitude = lab.latitude

        if (lab.longitude && lab.name.trim() != "")
          fielchange.longitude = lab.longitude

        if (lab.medicalauthorityNumber)
          fielchange.medicalauthorityNumber = lab.medicalauthorityNumber

        if (lab.cityAreaPinFormArr)
          fielchange.cityAreaPinFormArr = lab.cityAreaPinFormArr



        if (lab.fielchangeName)
          fielchange.fielchangeName = lab.fielchangeName

        if (lab.labIdentityNumber)
          fielchange.labIdentityNumber = lab.labIdentityNumber


        if (lab.active == false) {
          fielchange.active = false
        }
        if (lab.active == true) {
          fielchange.active = true
        }

        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection('lab_profile_details').findOne(filter, function (err, labRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching lab', res, 500)
          }

          if (!labRec) {
            database.close();
            return common.handleError(err, ' No lab record found with the given lab ID', res, 500)
          }

          db.collection('lab_profile_details').findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'lab password could not be updated', res, 500)
            }
            let lab = response.value

            database.close();
            return res.json({
              status: true,
              message: 'lab record update Success...',
              data: lab
            });

          });

        });
      });
      /* } , (err) => {
         let errMsg            
         errMsg = err?err.message:""
         return res.json({
           status: false,
           message: 'DB update fails...',
           error: errMsg
         });
       });*/

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'lab password could not be updated', res, 500)

    }


  }

  // res.send(lab);
  //});

}




module.exports = function (app) {


  /*
      *****************************************
      1. Lab Sign-up API
      *****************************************
  */

  app.post('/api/lab-signup', [

    check('name').not().isEmpty().trim().escape(),
    //check('address').not().isEmpty().trim().escape(),
    //check('city').not().isEmpty().trim().escape(),
    //check('area').not().isEmpty().trim().escape(),
    //check('pincode').not().isEmpty().trim().escape(),
    check('latitude').trim().escape(),
    check('longitude').trim().escape(),
    //check('operationlegality').trim().escape(),
    //check('labId').trim().escape(),
    check('lablicenseno').not().isEmpty().trim().escape(),
    //check('medicalauthorityNumber').not().isEmpty().trim(),
    //check('labName').not().isEmpty().trim().escape(),
    check('labIdentityNumber').not().isEmpty().trim().escape(),
    //check('labIdentityCerCopy').trim(),
    //check('labLicenseOperationCerCopy').trim(),
    //check('labNocForm').trim(),
    //check('labNocForm').trim(),
    //check('uploadpathLabNocFormURL').trim(),
    //check('labemailIdPrimary').not().isEmpty().trim().isEmail().normalizeEmail(),
    //check('labemailIdSecondary').not().isEmpty().trim().isEmail().normalizeEmail(),
    //check('ownername').not().isEmpty().trim().escape(),
    //check('ownermobileNumber').not().isEmpty().trim(),
    //check('labmobileNumber').not().isEmpty().trim(),
    check('otp').not().trim(),
    //check('password').not().isEmpty().trim(),
    // check('uploadpathIdCerCopyURL').trim(),
    // check('uploadpathLicenseOpCerCopyURL').trim(),
    // check('uploadpathNocFormURL').trim(),
  ], function (req, res) {
    dlog(" inside registration api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    dlog("name =" + req.body.name)
    var inputCollection = req.body

    //inputCollection =  doFileProcessing(inputCollection,"both")


    // doFileProcessing(inputCollection,"both",res).then((result) => {

    dlog("i am here 1")


    // var lab = new Lab(inputCollection)
    dealWithAllFiles(req, res, true)

    /*
        *****************************************
        Call the SMS GateWay to send SMS to user mobile 
        *****************************************
    */

    // Everything OK
    /*return res.json({
      status: true,
      message: 'DB Insert Success...',
      data: lab
    });
  });*/
    /* }, (err) => {
       let errMsg            
       errMsg = err?err.message:""
       return res.json({
         status: false,
         message: 'DB Insert fails...',
         error: errMsg
       });
     });
*/






  });







  /*
      ************
      2. Lab First Login API
      ************
  */
  // app.post('/api/first-login', [
  //   check('emailPhone').not().isEmpty().trim().escape(),
  //   check('password').not().isEmpty().trim().escape()
  //  ], function (req, res) {        
  //   dlog(" inside login api  ")

  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return common.handleError(errors.array(), 'validation error.',res,999)   

  //   }

  //   const v = new Validator(req.body, {
  //     emailPhone: 'email'      
  //   });


  //   let filter = { emailId:  req.body.emailPhone};

  //   v.check().then((matched) => {
  //     if (!matched) {
  //       dlog("invalid email")
  //       filter = { mobileNumber:  req.body.emailPhone};
  //     }

  //     const update = { password: req.body.password };

  //     try{

  //     Lab.findOne(filter, function (err, lab) {
  //       if (err || !lab) return  common.handleError(err, 'No lab record found with the given email/mobile number',res,500)   

  //       lab.password = req.body.password
  //       lab.save(function (err) {
  //         if (err) return common.handleError(err, 'lab password could not be updated',res,500)   
  //         lab.uploadPhotoProfessional = ''
  //         lab.labIdentityCerCopy = ''

  //         return res.json({
  //           status: true,
  //           message: 'first-login Success...',
  //           data: lab
  //         });
  //        // res.send(lab);
  //       });
  //     });



  //     }catch(error){
  //       //console.error(error)
  //       return  common.handleError(error, 'lab password could not be updated',res,500)   

  //     }


  //   });



  // });



  /*
    ************
    3. Lab Login API
    ************
  */

  /*
    ************
    4. updateMyProfile API
    ************
  */

  app.post('/api/updateLabProfile', [
    check('labId').not().isEmpty().trim().escape(),
    check('name').trim().escape(),
    //check('address').trim().escape(),
    //check('city').trim().escape(),
    //check('area').trim().escape(),
    //check('pincode').escape(),
    check('geolocation').trim().escape(),
    //check('operationlegality').trim().escape(),
    check('labId').trim().escape(),
    check('lablicenseno').trim().escape(),
    check('medicalauthorityNumber').trim(),
    //check('labName').trim().escape(),
    check('labIdentityNumber').trim().escape(),
    check('labIdentityCerCopy').trim(),
    check('labLicenseOperationCerCopy').trim(),
    check('labNocForm').trim(),
    check('pathLabImage').trim(),

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
    var inputCollection = req.body
    //inputCollection =  doFileProcessing(inputCollection,"Profile")
    try {

      dealWithAllFiles(req, res, false)

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Lab password could not be updated', res, 500)

    }


  });







  app.post('/api/fetchLabDetails', [
    check('labId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchLabDetails api  ")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    //let filter  = {_id : new ObjectId(req.body.labId)}
    let filter = { "createdDate": { $exists: true } }
    try {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("labDB Database connected successfully at post /login-lab ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('lab_profile_details').findOne(filter, function (error, lab) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching lab record', res, 500)
          }
          if (!lab) {
            database.close();
            return common.handleError(err, 'lab could not be found', res, 500)
          }

          lab.uploadPhotoDemographic = ''

          database.close();
          return res.json({
            status: true,
            message: 'fetch Success...',
            data: lab
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving lab record', res, 500)

    }


  });





  app.post('/api/fetchLabs', [
    check('labAdminId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchLabDetails api  ")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { labAdminId: req.body.labAdminId }
    try {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("labDB Database connected successfully at post /login-lab ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()



        db.collection('lab_profile_details').find(filter).toArray(function (err, labsArry) {



          if (err) {
            database.close();
            return common.handleError(err, 'Error fetching lab record', res, 500)
          }
          if (!labsArry || (labsArry && labsArry.length == 0)) {
            database.close();
            return common.handleError(err, 'lab could not be found', res, 500)
          }



          let newLabArry = []
          labsArry.forEach(function (lab, index) {
            lab.labIdentityCerCopy = ''
            lab.labLicenseOperationCerCopy = ''
            lab.labNocForm = ''
            lab.pathLabImage = ''
            newLabArry.push(lab)

          })

          database.close();
          return res.json({
            status: true,
            message: 'Labs Array retrieval success...',
            data: newLabArry
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving lab record', res, 500)

    }


  });




  app.post('/api/addServiceareas', function (req, res) {
    //try{    
    dlog(" inside addServiceareas api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    //dlog("name ="+req.body.name)

    var inputCollection = req.body

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog("patientDBUrl Database connected successfully at post /addServiceareas")

      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      var db = database.db()


      inputCollection.active = true

      inputCollection.createdDate = new Date()

      db.collection('serviceareas').insertOne(inputCollection, function (error, response) {

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


  app.post('/api/updateServiceareas', [
    check('serviceAreaId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateServiceareas api ")

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
        db.collection('serviceareas').findOne(filter, function (err, serviceAreasRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching serviceAreas', res, 500)
          }

          if (!serviceAreasRec) {
            database.close();
            return common.handleError(err, ' No serviceAreas record found with the given serviceAreas ID', res, 500)
          }

          db.collection('serviceareas').findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
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

  app.post('/api/fetch-all-serviceAreas', function (req, res) {
    dlog(" inside all-patients api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-patients")

      let filter = { active: true }

      db.collection('serviceareas').find(filter).toArray(function (err, serviceAreasArray) {

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



  app.post('/api/addCollectionagents', function (req, res) {
    //try{    
    dlog(" inside addCollectionagents api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    //dlog("name ="+req.body.name)
    const photoRandomString = Str.random(8)
    dlog("photoRandomString =" + photoRandomString)
    let uploadedFileNameSuf = "agent" + photoRandomString + "_"
    var inputCollection = req.body
    common.doFileProcessing(inputCollection, "prescription", uploadedFileNameSuf, "image", "imageURL").then((result) => {
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDBUrl Database connected successfully at post /addCollectionagents")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

        var db = database.db()


        inputCollection.active = true

        inputCollection.createdDate = new Date()

        db.collection('collectionagents').insertOne(inputCollection, function (error, response) {

          let collectionagents = response.ops[0]



          //dlog("NEWLY added patient == "+JSON.stringify(patient))             

          if (error) {
            return common.handleError(error, 'DB Insert Fail...', res, 500)
          }

          let emailData = { name: collectionagents.name, email: collectionagents.email, subject: "Registration successful" }

          //emailData.jsondata = jsondata
          emailData.emailTemplate = '<h4>      Hi,  ' + collectionagents.name + ', your registration is successful. </h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)

          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: collectionagents
          });
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


  app.post('/api/updateCollectionagents', [
    check('colAgentId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateCollectionagents api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body



    try {
      let filter = { _id: new ObjectId(req.body.colAgentId) }
      //  Collectionagents.findById(req.body.collectionagentsId, function (err, collectionagents) {
      const photoRandomString = Str.random(8)
      dlog("photoRandomString =" + photoRandomString)
      let uploadedFileNameSuf = "agent" + photoRandomString + "_"

      common.doFileProcessing(inputCollection, "prescription", uploadedFileNameSuf, "image", "imageURL").then((result) => {

        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
          //   assert.equal(null, err);
          dlog("collectionagentsDB Database connected successfully at post /updateProfile")


          if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
          var db = database.db()
          let fields = {}

          let fielchange = {}

          if (result.imageURL)
            fielchange.imageURL = result.imageURL

          if (result.image)
            fielchange.image = result.image



          if (req.body.password && req.body.password.trim() != "")
            fielchange.password = req.body.password


          if (req.body.userName && req.body.userName.trim() != "")
            fielchange.userName = req.body.userName


          if (req.body.email && req.body.email.trim() != "")
            fielchange.email = req.body.email

          if (req.body.contactNumber && req.body.contactNumber.trim() != "")
            fielchange.contactNumber = req.body.contactNumber


          if (req.body.name && req.body.name.trim() != "")
            fielchange.name = req.body.name

          if (req.body.serviceAreaId && req.body.serviceAreaId.trim() != "")
            fielchange.serviceAreaId = req.body.serviceAreaId

          if (req.body.active == false) {
            fielchange.active = false
          }
          if (req.body.active == true) {
            fielchange.active = true
          }

          fielchange.updatedDate = new Date()

          fielchange = { $set: fielchange }

          dlog("fielchange == " + JSON.stringify(fielchange))
          db.collection('collectionagents').findOne(filter, function (err, collectionagentsRec) {

            if (err) {
              database.close();
              return common.handleError(err, 'Error, in fetching collectionagents', res, 500)
            }

            if (!collectionagentsRec) {
              database.close();
              return common.handleError(err, ' No collectionagents record found with the given collectionagents ID', res, 500)
            }

            db.collection('collectionagents').findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
              if (error) {
                database.close();
                return common.handleError(err, 'collectionagents password could not be updated', res, 500)
              }
              let collectionagents = response.value

              database.close();
              return res.json({
                status: true,
                message: 'collectionagents record update Success...',
                data: collectionagents
              });

            });

          });
        });
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'DB update fails...',
          error: errMsg
        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Collectionagents password could not be updated', res, 500)

    }


  });

  app.post('/api/fetch-all-collectionagents', [
    check('labAdminId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetch-all-collectionagents api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-patients")

      let filter = { labAdminId: req.body.labAdminId, active: true }

      db.collection('collectionagents').find(filter).toArray(function (err, collectionagentsArray) {

        if (err) return common.handleError(err, 'Error, Erro fetching patient ', res, 500)
        if (!collectionagentsArray || (collectionagentsArray && collectionagentsArray.length == 0)) {
          database.close();
          return common.handleError(err, 'No collectionagentsArray record found with the given city Or Area or address', res, 500)
        }

        database.close();
        getColAgentWithRating(collectionagentsArray, res)
      });

    });

  });

  app.post('/api/fetchColAgentDetails', [
    check('colAgentId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchColAgentDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.colAgentId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("colAgentDB Database connected successfully at post /login-colAgent ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('collectionagents').findOne(filter, function (error, colAgent) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching colAgent record', res, 500)
          }
          if (!colAgent) {
            database.close();
            return common.handleError(err, 'colAgent could not be found', res, 500)
          }
          if (colAgent) {
            colAgent.uploadPhotoDemographic = ''
            // colAgent.password = ''
          }

          database.close();
          return res.json({
            status: true,
            message: 'Col Agent retrieval Success...',
            data: colAgent
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving colAgent record', res, 500)

    }


  });





  app.post('/api/addRatingCollAgent', function (req, res) {
    //try{    
    dlog(" inside addRatingCollectionagents api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    //dlog("name ="+req.body.name)

    var inputCollection = req.body

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog("patientDBUrl Database connected successfully at post /addRatingCollectionagents")

      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      var db = database.db()


      inputCollection.active = true

      inputCollection.createdDate = new Date()

      db.collection('ratingCollectionagents').insertOne(inputCollection, function (error, response) {

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

  app.post('/api/addObject', function (req, res) {
    //try{    
    dlog(" inside addObject api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    dlog("body =" + JSON.stringify(req.body))

    //dlog("name ="+req.body.name)
    var collectionName = req.body.type
    var inputCollection = req.body

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog("patientDBUrl Database connected successfully at post /addRatingCollectionagents")

      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      var db = database.db()

      delete inputCollection['type']

      inputCollection.active = true

      inputCollection.createdDate = new Date()

      db.collection(collectionName).insertOne(inputCollection, function (error, response) {

        //let serviceAreas =  response.ops[0]

        //dlog("NEWLY added patient == "+JSON.stringify(patient))             

        if (error) {
          return common.handleError(error, 'DB Insert Fail...', res, 500)
        }

        if (response && response.ops[0]) {
          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: response.ops[0]
          });
        } else {
          return res.json({
            status: true,
            message: 'DB Insertion Failed...'
          });
        }
      });

    });


  });


  app.post('/api/updateObjects', [
    check('objectId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateObjects api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {
      let filter = { _id: new ObjectId(req.body.objectId) }

      var collectionName = req.body.type
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("serviceAreasDB Database connected successfully at post /updateObjects")


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        let fields = {}

        let fielchange = {}

        if (collectionName == "tests") {
          if (req.body.name && req.body.name.trim() != "")
            fielchange.name = req.body.name
          if (req.body.testCategory && req.body.testCategory.trim() != "")
            fielchange.testCategory = req.body.testCategory

          if (req.body.timeSlotArr)
            fielchange.timeSlotArr = req.body.timeSlotArr


          if (req.body.sampleCollectionMode)
            fielchange.sampleCollectionMode = req.body.sampleCollectionMode

          if (req.body.totalCost)
            fielchange.totalCost = req.body.totalCost


          if (req.body.gst)
            fielchange.gst = req.body.gst

          if (req.body.time)
            fielchange.time = req.body.time

          if (req.body.timeUnit && req.body.timeUnit.trim() != "")
            fielchange.timeUnit = req.body.timeUnit


          if (req.body.active == false) {
            fielchange.active = false
          }
          if (req.body.active == true) {
            fielchange.active = true
          }
        } else if (collectionName == "packs") {
          if (req.body.name && req.body.name.trim() != "")
            fielchange.name = req.body.name


          if (req.body.testIdArray)
            fielchange.testIdArray = req.body.testIdArray

          if (req.body.totalCost)
            fielchange.totalCost = req.body.totalCost

          if (req.body.active == false) {
            fielchange.active = false
          }
          if (req.body.active == true) {
            fielchange.active = true
          }
        } else if (collectionName == "Pincodes") {
          if (req.body.city && req.body.city.trim() != "")
            fielchange.city = req.body.city

          if (req.body.area && req.body.area.trim() != "")
            fielchange.area = req.body.area

          if (req.body.pincode && req.body.pincode.trim() != "")
            fielchange.pincode = req.body.pincode



          if (req.body.active == false) {
            fielchange.active = false
          }
          if (req.body.active == true) {
            fielchange.active = true
          }
        }





        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection(collectionName).findOne(filter, function (err, test) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching test', res, 500)
          }

          if (!test) {
            database.close();
            return common.handleError(err, ' No serviceAreas record found with the given test ID', res, 500)
          }

          db.collection(collectionName).findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'serviceAreas password could not be updated', res, 500)
            }
            let testsNew = response.value

            database.close();
            return res.json({
              status: true,
              message: 'serviceAreas record update Success...',
              data: testsNew
            });

          });

        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Serviceareas password could not be updated', res, 500)

    }


  });


  app.post('/api/updateTests', [
    check('testId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateTests api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {
      let filter = { _id: new ObjectId(req.body.testId) }
      //  Serviceareas.findById(req.body.serviceAreasId, function (err, serviceAreas) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("serviceAreasDB Database connected successfully at post /updateTests")


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        let fields = {}

        let fielchange = {}

        if (req.body.name && req.body.name.trim() != "")
          fielchange.name = req.body.name
        if (req.body.testCategory && req.body.testCategory.trim() != "")
          fielchange.testCategory = req.body.testCategory

        if (req.body.timeSlotArr)
          fielchange.timeSlotArr = req.body.timeSlotArr


        if (req.body.sampleCollectionMode)
          fielchange.sampleCollectionMode = req.body.sampleCollectionMode

        if (req.body.totalCost)
          fielchange.totalCost = req.body.totalCost


        if (req.body.gst)
          fielchange.gst = req.body.gst

        if (req.body.time && req.body.time.trim() != "")
          fielchange.time = req.body.time

        if (req.body.active == false) {
          fielchange.active = false
        }
        if (req.body.active == true) {
          fielchange.active = true
        }

        fielchange.updatedDate = new Date()

        fielchange = { $set: fielchange }

        dlog("fielchange == " + JSON.stringify(fielchange))
        db.collection('tests').findOne(filter, function (err, test) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching test', res, 500)
          }

          if (!test) {
            database.close();
            return common.handleError(err, ' No serviceAreas record found with the given test ID', res, 500)
          }

          db.collection('tests').findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
            if (error) {
              database.close();
              return common.handleError(err, 'serviceAreas password could not be updated', res, 500)
            }
            let testsNew = response.value

            database.close();
            return res.json({
              status: true,
              message: 'serviceAreas record update Success...',
              data: testsNew
            });

          });

        });
      });


    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Serviceareas password could not be updated', res, 500)

    }


  });


  app.post('/api/fetchObjects', [
    check('labAdminId').trim().escape()
  ], function (req, res) {
    dlog(" inside fetchObjects api  ")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = ''
    if (req.body.type != "Pincodes") {
      filter = { labAdminId: req.body.labAdminId, active: true }
    } else {
      filter = { active: true }
    }
    try {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("objectDB Database connected successfully at post fetchObjects ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()



        db.collection(req.body.type).find(filter).sort({ 'createdDate': -1 }).toArray(function (err, objectsArry) {



          if (err) {
            database.close();
            return common.handleError(err, 'Error fetching object record', res, 500)
          }
          if (!objectsArry || (objectsArry && objectsArry.length == 0)) {
            database.close();
            return common.handleError(err, 'object could not be found', res, 500)
          }



          let newLabArry = []

          objectsArry.forEach(function (object, index) {
            if (req.body.type == "lab_profile_details") {
              object.objectIdentityCerCopy = ''
              object.objectLicenseOperationCerCopy = ''
              object.objectNocForm = ''
              object.pathLabImage = ''
            } else if (req.body.type == "collectionagents") {
              object.image = ''
            }
            newLabArry.push(object)

          })

          database.close();
          return res.json({
            status: true,
            message: 'Objects Array retrieval success...',
            data: newLabArry
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving object record', res, 500)

    }


  });


  app.post('/api/fetchTestDetails', [
    check('testId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchtestDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.testId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("testDB Database connected successfully at post /login-test ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('tests').findOne(filter, function (error, test) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching test record', res, 500)
          }
          if (!test) {
            database.close();
            return common.handleError(err, 'test could not be found', res, 500)
          }


          database.close();
          return res.json({
            status: true,
            message: 'fetch Success...',
            data: test
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving test record', res, 500)

    }


  });
}
