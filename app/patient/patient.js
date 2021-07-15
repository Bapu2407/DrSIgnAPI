

const {check, validationResult} = require('express-validator');
const Patient = require('../../models/patient');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var ObjectId = require('mongodb').ObjectID
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var request = require('request');
var FCM = require('fcm-node');
var serverKey = common.SERVER_KEY; 
var fcm = new FCM(serverKey);

const main =  async (demographicFileName,inputCollection,whichfiles) => {
  return new Promise((resolve,reject) => {
   
        if(demographicFileName && (whichfiles=="both" || whichfiles == "demographic")){
          dlog("demographicFileName :="+demographicFileName)

          fs.writeFile(demographicFileName, inputCollection.uploadPhotoDemographic,'base64', function(err) {
            if (err) 
              
              dlog("demographicFile created successfully");
              reject(err)
      
          });
        }
    
        resolve("file created at desired folder")
      })
}
const doFileProcessing =  (inputCollection,whichfiles)=>{
  return new Promise((resolve,reject) => {     
      if(process.env.ENVIRONMENT =="LOCAL"){
        inputCollection.fileFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
      }else{
        inputCollection.fileFirstPart="http://"+process.env.IPADDRESS
      }

      var staticImageDir = process.env.IMAGE_PATH

      const photoRandomString = Str.random(8)  
      dlog("photoRandomString ="+photoRandomString)

      inputCollection.name = inputCollection.fName + inputCollection.lName 
      let demographicFileNameSuf = "PhotoDemographic_"+photoRandomString+"_"+inputCollection.name.replace(/\s/g, '_')
      let demographicFileName = staticImageDir + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT

      inputCollection.uploadPhotoDemographicURL = inputCollection.fileFirstPart + "/public/images/" + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT


      if(inputCollection.uploadPhotoDemographic){
        inputCollection.uploadPhotoDemographic = inputCollection.uploadPhotoDemographic.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
      }   

      Promise.all([createFiles(staticImageDir), main(demographicFileName,inputCollection,whichfiles)])
        .then(() => { resolve(inputCollection); })
        .catch((error) => { reject(error) });
        
  })
}


const createFiles =  (staticImageDir) => {

  return new Promise((resolve,reject) => {
    fs.stat(staticImageDir, function(err) {
      if (!err) {
          dlog('Directory exists, where the images will go');
          resolve('Directory exists, where the images will go')       
          //main(demographicFileName,inputCollection,whichfiles)
          
      }
      else if (err.code === 'ENOENT') {
          dlog('Directory does not exist where the images should be saved');
          reject(new Error('Directory does not exist, where the images will go'))
      }
    });
  });
}


module.exports = function (app) {


/*
    *****************************************
    1. Patient Sign-up API
    *****************************************
*/

  app.post('/api/signup-patient', [ 
    check('emailId').not().isEmpty().trim().isEmail().normalizeEmail(),
    //check('name').not().isEmpty().trim().escape(),
    check('fName').not().isEmpty().trim().escape(),
    check('lName').not().isEmpty().trim().escape(),

    check('dateOfBirth').not().isEmpty().trim().escape(),
    check('sex').not().isEmpty().trim().escape(),
    check('govtIdType').not().isEmpty().trim().escape(),
    check('govtIdCode').not().isEmpty().trim().escape(),
    check('bloodgroupId').not().isEmpty().trim().escape(),
   // check('permanentAddress').not().isEmpty().trim(),
   // check('presentAddress').not().isEmpty().trim(),
   check('houseNoVillage').not().isEmpty().trim(),
   check('postOffice').not().isEmpty().trim(),
   check('cityDistrict').not().isEmpty().trim(),
   check('state').not().isEmpty().trim(),
   check('pinCode').not().isEmpty().trim(),
   check('landmark').not().isEmpty().trim(),   
    //check('password').not().isEmpty().trim().escape(),
    check('mobileNumber').not().isEmpty().trim(),
    //check('alternateMobileNumber').not().isEmpty().trim(),
    check('uploadPhotoDemographic').not().isEmpty().trim(),
 
],function (req, res) {        
      dlog(" inside registration api  ")


      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }

//dlog("body ="+JSON.stringify(req.body))

      //dlog("name ="+req.body.name)

      var inputCollection = req.body

      inputCollection.userStatus = "Applied"

      //inputCollection =  doFileProcessing(inputCollection,"both")
      doFileProcessing(inputCollection,"both").then((result) => {
      //var temp = new Patient(inputCollection)
              
            inputCollection = result
            // insert data into database
          // temp.save(function (error, patient) {
            MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
              //   assert.equal(null, err);
                  dlog("patientDBUrl Database connected successfully at post /signup-patient")
                  
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
              
                  var db = database.db()             

                  
                  inputCollection.active = true
                  //collection_json.appointmentDate = newDate.toISOString()//newDate
                  inputCollection.createdDate = new Date()
                  
              db.collection('patient_profile_details').insertOne(inputCollection , function(error, response) {
             
                let patient =  response.ops[0]
                
                //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                  
                if (error) {
                  return common.handleError(error,'DB Insert Fail...',res,500)           
                }

                if(patient){
                  patient.uploadPhotoDemographic = ''
                  patient.password = ''
                  patient.uploadPhotoDemographicURL = inputCollection.uploadPhotoDemographicURL
                }
        /*
          *****************************************
          Call the SMS GateWay to send SMS to user mobile 
          *****************************************
      */
            patient.name = patient.fName + patient.lName 
            if(req.body.otp){
                let emailData = {name:patient.name, email:patient.emailId,subject:"Registration successful, please verify Your OTP"}   
              
              //  emailData.jsondata = jsondata
                emailData.emailTemplate = '<h4>      Hi,  '+ patient.name +', your registration is successful,  your OTP is as follows '+req.body.otp+'. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

                common.sendHTMLemail(emailData)  

                let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=5ec38edd9bf45&sender=DRSIGN&mobileno="+patient.mobileNumber+"&text="+req.body.otp
         
         
                request({method: "GET", 
                "rejectUnauthorized": false, 
                "url": smsGatewayURL,
                "headers" : {"Content-Type": "application/json"},
                function(err,data,body) {
                  dlog("data =="+JSON.stringify(data))
                  dlog("body =="+JSON.stringify(body))

                }})
            }else{
              let emailData = {name:patient.name, email:patient.emailId,subject:"Registration successful"}   
              
              //emailData.jsondata = jsondata
              emailData.emailTemplate = '<h4>      Hi,  '+ patient.name +', your registration is successful. </h4><p>      Thanking you.   </p>'

              common.sendHTMLemail(emailData)
            }
            if(patient){
            patient.password = ''
            }
              // Everything OK
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: patient
              });
            });
         
        
  });
    } , (err) => {
      let errMsg            
      errMsg = err?err.message:""
      return res.json({
        status: false,
        message: 'DB Insert fails...',
        error: errMsg
      });
    });

});
/*
    ************
    2. Patient First Login API
    ************
*/
  app.post('/api/first-login-patient', [
    check('emailPhone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
      
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'      
    });
   

    let filter = { emailId:  req.body.emailPhone,active:true};

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber:  req.body.emailPhone};
      }
      
    

      try{
       
      MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
        //   assert.equal(null, err);
              dlog("patientDB Database connected successfully at post /dummy-appointment-request")
           
                          
              if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

               var db = database.db()                        

               
               let fielchange={}

               if(req.body.fcmId && req.body.fcmId.trim() !=""  )
               fielchange.fcmId = req.body.fcmId
               if(req.body.deviceId && req.body.deviceId.trim() !=""  )
               fielchange.deviceId = req.body.deviceId
   
               if(req.body.password && req.body.password.trim() !=""  )
               fielchange.password = req.body.password
   
              
               fielchange.updatedDate = new Date()
                              
               fielchange = {$set:fielchange}

               dlog(" fielchange == "+JSON.stringify(fielchange))
                db.collection('patient_profile_details').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                  
                  if (error) {
                    database.close(); 
                    return common.handleError(err, 'patient password could not be updated',res,500)                    
                  
                  }

                 

                  let patient = response.value   
                  
                  if (!patient) {
                    database.close(); 
                    return common.handleError(err, 'No patient found',res,500)                    
                  
                  }

                  if(patient){
                    patient.uploadPhotoDemographic = ''
                  //   patient.password = ''
                  }
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'first-login Success...',
                    data: patient
                  });
                  
                });
               
           
             });

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'patient password could not be updated',res,500)   
      
      }

       
    });

    
    
  });



  /*
    ************
    3. Patient Login API
    ************
  */

  app.post('/api/login-patient', [
    check('emailPhone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'      
    });  
    
    let filter = { emailId:  req.body.emailPhone,password:req.body.password,active:true};

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber:  req.body.emailPhone,password:req.body.password,active:true};
      }
      try{       
    

        MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("patientDB Database connected successfully at post /login-patient ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('patient_profile_details').findOne(filter,function(error, patient) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching patient record',res,500)                    
                    }
                  if (!patient ) {
                    database.close(); 
                    return common.handleError(err, 'patient could not be found',res,500)                    
                  }
                  if(patient){
                  patient.uploadPhotoDemographic = ''
                  patient.password = ''
                  }
        

                  let fielchange={}

                  if(req.body.fcmId && req.body.fcmId.trim() !=""  )
                  fielchange.fcmId = req.body.fcmId
                  if(req.body.deviceId && req.body.deviceId.trim() !=""  )
                  fielchange.deviceId = req.body.deviceId
      
                  if(req.body.password && req.body.password.trim() !=""  )
                  fielchange.password = req.body.password
      
                 
                  fielchange.updatedDate = new Date()
                                 
                  fielchange = {$set:fielchange}
   
                   db.collection('patient_profile_details').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                     
                     if (error) {
                       database.close(); 
                       return common.handleError(err, 'patient password could not be updated',res,500)                    
                     
                     }
                     let patient = response.value    
                     if(patient){
                       patient.uploadPhotoDemographic = ''
                      //  patient.password = ''
                     }
           
                     database.close();
                     return res.json({
                       status: true,
                       message: 'login-patient Success...',
                       data: patient
                     });
                     
                   });
               
                   /*
                  database.close();
                  return res.json({
                    status: true,
                    message: 'login Success...',
                    data: patient
                  });
                    */
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving patient record',res,500)   
      
      }       
    });
    
  });


  app.post('/api/fetchPatientDetails', [
    check('patientId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchPatientDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.patientId)}
      try{       
    

        MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("patientDB Database connected successfully at post /login-patient ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('patient_profile_details').findOne(filter,function(error, patient) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching patient record',res,500)                    
                    }
                  if (!patient ) {
                    database.close(); 
                    return common.handleError(err, 'patient could not be found',res,500)                    
                  }
                  if(patient){
                  patient.uploadPhotoDemographic = ''
                 // patient.password = ''
                  }
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'login Success...',
                    data: patient
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving patient record',res,500)   
      
      }       
   
    
  });



  /*
    ************
    4. updateProfile API
    ************
  */

  app.post('/api/updateProfile', [
    check('patientId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateMyProfile api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
    if(req.body.uploadPhotoDemographic){
      inputCollection =  doFileProcessing(inputCollection,"demographic")
    }
    
      try{
       let filter  = {_id : new ObjectId(req.body.patientId)}
      //  Patient.findById(req.body.patientId, function (err, patient) {

        MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("patientDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                
                 if(req.body.fName && req.body.fName.trim() !=""  )
                 fielchange.fName = req.body.fName
                 if(req.body.lName && req.body.lName.trim() !=""  )
                 fielchange.lName = req.body.lName

                 if(req.body.userStatus && req.body.userStatus.trim() !=""  )
                 fielchange.userStatus = req.body.userStatus

                 
                 if(req.body.emailId && req.body.emailId.trim() !=""  )
                 fielchange.emailId = req.body.emailId    
                 
                 if(req.body.dateOfBirth && req.body.dateOfBirth.trim() !=""  )
                 fielchange.dateOfBirth = req.body.dateOfBirth
                 if(req.body.sex && req.body.sex.trim() !=""  )
                 fielchange.sex = req.body.sex
                 if(req.body.govtIdType && req.body.govtIdType.trim() !=""  )
                 fielchange.govtIdType = req.body.govtIdType
                 if(req.body.govtIdCode && req.body.govtIdCode.trim() !=""  )
                 fielchange.govtIdCode = req.body.govtIdCode
     
                 if(req.body.bloodgroupId && req.body.bloodgroupId.trim() !=""  )
                 fielchange.bloodgroupId = req.body.bloodgroupId
     
                 if(req.body.alternateMobileNumber && req.body.alternateMobileNumber.trim() !=""  )
                 fielchange.alternateMobileNumber = req.body.alternateMobileNumber
     
             //    if(req.body.presentAddress && req.body.presentAddress.trim() !="" )
              //   fielchange.presentAddress = req.body.presentAddress
              if(req.body.houseNoVillage && req.body.houseNoVillage.trim() !="" )
              fielchange.houseNoVillage = req.body.houseNoVillage

              if(req.body.postOffice && req.body.postOffice.trim() !="" )
              fielchange.postOffice = req.body.postOffice

              if(req.body.cityDistrict && req.body.cityDistrict.trim() !="" )
              fielchange.cityDistrict = req.body.cityDistrict

              if(req.body.state && req.body.state.trim() !="" )
              fielchange.state = req.body.state

              if(req.body.pinCode && req.body.pinCode.trim() !="" )
              fielchange.pinCode = req.body.pinCode

              if(req.body.landmark && req.body.landmark.trim() !="" )
              fielchange.landmark = req.body.landmark
              
                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                  
     
                 if(req.body.verified)
                 fielchange.verified = req.body.verified
     
                // if(req.body.permanentAddress)
                // fielchange.permanentAddress = req.body.permanentAddress
     
                 if(req.body.uploadPhotoDemographic && req.body.uploadPhotoDemographic.trim() !=""){
                   fielchange.uploadPhotoDemographicURL = inputCollection.uploadPhotoDemographicURL
                 }



                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('patient_profile_details').findOne(filter,function(err, patientRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching patient',res,500)   
                    }
                    
                    if (!patientRec){
                      database.close();              
                      return  common.handleError(err, ' No patient record found with the given patient ID',res,500)   
                    }

                    db.collection('patient_profile_details').findOneAndUpdate(filter,fielchange ,{returnOriginal:false}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'patient password could not be updated',res,500)                    
                      }
                      let patient = response.value   
                      if(patient){
                      patient.uploadPhotoDemographic = ''
                      patient.password = ''
                      }
                      
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'Profile update Success...',
                        data: patient
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Patient password could not be updated',res,500)   
      
      }

       
    });


  /*
    ************
   5.  send-otp API
    ************
  */


  app.post('/api/send-otp-patient', [
    check('emailPhone').not().isEmpty().trim().escape(),
    check('otp').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'      
    });  
    
    let filter = { emailId:  req.body.emailPhone};

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber:  req.body.emailPhone};
      }
      try{    
        
        MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("patientDB Database connected successfully at post /send-otp-patient")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('patient_profile_details').findOne(filter,function(error, patient) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching patient record',res,500)                    
                    }
                  if (!patient ) {
                    database.close(); 
                    return common.handleError(err, 'No Patient record found with the given email/mobile',res,500)                    
                  }

                  let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=5ec38edd9bf45&sender=DRSIGN&mobileno="+patient.mobileNumber+"&text="+req.body.otp
         
         
                request({method: "GET", 
                "rejectUnauthorized": false, 
                "url": smsGatewayURL,
                "headers" : {"Content-Type": "application/json"},
                function(err,data,body) {
                  dlog("data =="+JSON.stringify(data))
                  dlog("body =="+JSON.stringify(body))

                }})

                patient.name = patient.fName + patient.lName 
                  let emailData = {name:patient.name, email:patient.emailId,subject:"Verify Your OTP"}   
                  let  jsondata = {
                      userName:patient.name,            
                      otp:req.body.otp,     
                  }
                  emailData.jsondata = jsondata
                  emailData.emailTemplate = '<h4>      Hi,'+ patient.name +',  your OTP is as follows '+req.body.otp+'. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'
         
                  common.sendHTMLemail(emailData)  
        
                  /*
                      *****************************************
                      Call the SMS GateWay to send SMS to user mobile 
                      *****************************************
        
                  */
        
                 return res.json({
                  status: true,
                  message: 'OTP Sent Success.fully..',          
                });
              });
        });
      
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving patient record',res,500)   
      
      }       
    });

    
    
  });


  app.post('/api/send-message-to-patient', [
    check('patientId').not().isEmpty().trim().escape(),
    check('message').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside send-message-to-patient api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

 
    try{       
      let filter  = {_id : new ObjectId(req.body.patientId)}
      //  Patient.findById(req.body.patientId, function (err, patient) {

        MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("patientDB Database connected successfully at post /updateProfile")
          var db = database.db()         
                  
          db.collection('patient_profile_details').findOne(filter,function(err, patient) {     
      
              if (err || !patient) return  common.handleError(err, 'No patient record found with the given doctorId',res,500)   
             
              let fcmId = patient.fcmId

              dlog("fcmId == ",fcmId);

              var message = { 
                to: fcmId, 			    
            //  data: notification,
                notification:{
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
        try{

            fcm.send(message, function(err, response){
              if (err && req.body.directcall) {
                common.handleError(err, 'Something wrong in sending Push message to doctor',res,500)   
              } 
            });
            dlog("Message sent to doctor successfully to doctor ",doctor.name );
            
            if(req.body.directcall){
                return res.json({
                  status: true,
                  message: 'Message sent to doctor successfully ...',
                // data: doctor
                });
            }
        }catch(error){
          console.error("ignore this error "+ error)
          //return  common.handleError(error, 'Error retrieving Doctor record',res,500)

        }     
              

      });
    });
    }catch(error){
      //console.error(error)
      if (req.body.directcall) {
        return  common.handleError(error, 'Error retrieving Doctor record',res,500)
      }

    }      
  });

  
  
  app.post('/api/addFeedback', [    
    check('patientId').not().isEmpty().trim().escape(),
    check('doctorId').not().isEmpty().trim().escape()
 ],function (req, res){    
  
      dlog(" inside addFeedback api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }

      var inputCollection = req.body

      inputCollection.dateString = common.convertStringTodate(inputCollection.dateString)  

      
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                  dlog("doctorDBUrl Database connected successfully at post /addFeedback")
                  
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
              
                  var db = database.db()    
                  inputCollection.active = true
                  //collection_json.appointmentDate = newDate.toISOString()//newDate
                  inputCollection.createdDate = new Date()
                  
                  db.collection('feedbacks').insertOne(inputCollection , function(error, response) {                
                    let  feedback =  response.ops[0]                              
                                      
                    if (error) {
                      return common.handleError(error,'DB Insert Fail...',res,500)           
                    }
        
                    
                    return res.json({
                      status: true,
                      message: 'DB Insert Success...',
                      data: feedback
                    });
                });
          
          });
 
  
  });


  app.post('/api/addFamilyMember', [    
    check('patientId').not().isEmpty().trim().escape()
 ],function (req, res){    
  
      dlog(" inside addFamilyMember api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }

      var inputCollection = req.body      
      MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("doctorDBUrl Database connected successfully at post /addFamilyMember")
            
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
            var db = database.db()    
            inputCollection.active = true
            //collection_json.appointmentDate = newDate.toISOString()//newDate
            inputCollection.createdDate = new Date()
            
            db.collection('family-members').insertOne(inputCollection , function(error, response) {                
              let  feedback =  response.ops[0]                              
                                
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }

              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: feedback
              });
          });
    
    });
 
  
  });

  app.post('/api/fetchAddedFamilyMemberList',[
    check('patientId').not().isEmpty().trim().escape()
    ],function (req, res) {        
    dlog(" inside fetchAddedFamilyMemberList api  ")
    
    if( ObjectId.isValid(req.body.patientId)){

    let filter = {patientId : ObjectId(req.body.patientId).toString()}
    
    MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
    
     var db = database.db()     
     if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
       
     dlog(" inside fetchAddedFamilyMemberList api  step 2")
     
     db.collection('family-members').find(filter).toArray(function(err, familyMemberArry) {
         
         if (err ) return  common.handleError(err, 'Error, Erro fetching patient ',res,500)   
         if (!familyMemberArry || (familyMemberArry && familyMemberArry.length ==0)){
           database.close();                  
           return  common.handleError(err, 'No family members found for the patient',res,500)   
         }
   
         dlog(" inside fetchAddedFamilyMemberList api  step 4")
         database.close();                  
         return res.json({
           status: true,
           message: 'familyMember Array retrieval success...',
           data : familyMemberArry
           });              
       
       });
    
    });
    
  
  }else{
    return  common.handleError(err, 'wrong patiendID is being passed',res,500)  
  }
    
});
  

app.post('/api/fetch-familymembers-byphone',[
  check('phoneNumber').not().isEmpty().trim().escape()
 ],function (req, res) {        
  dlog(" inside all-familymembers autocom api  ")

  MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {

   var db = database.db()     
   if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
     
   dlog(" Database connected successfully at updateAppointmentPatientDB")
   

	let filter =   
  { phoneNumber: {'$regex':req.body.phoneNumber, $options: '-i' } }
  


   db.collection('family-members').find(filter).toArray(function(err, familymembersArray) {
       
       if (err ) return  common.handleError(err, 'Error, Erro fetching Practice Location',res,500)   
       if (!familymembersArray || (familymembersArray && familymembersArray.length ==0)){
         database.close();                  
         return  common.handleError(err, 'No familymembersArray  record found with the given city Or Area or address',res,500)   
       }

       database.close();                  
       return res.json({
         status: true,
         message: 'Practice Location array retrieval success...',
         //data: doctorIdList
         data : familymembersArray
         });              
     
     });
 
  });

});

  app.post('/api/send-otp-family-member', [
    check('patientId').not().isEmpty().trim().escape(),
    check('phoneNumber').not().isEmpty().trim().escape(),
    check('otp').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    
      try{    
        
       
        let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=5ec38edd9bf45&sender=DRSIGN&mobileno="+req.body.phoneNumber+"&text="+req.body.otp
    
    
          request({method: "GET", 
          "rejectUnauthorized": false, 
          "url": smsGatewayURL,
          "headers" : {"Content-Type": "application/json"},
          function(err,data,body) {
            dlog("data =="+JSON.stringify(data))
            dlog("body =="+JSON.stringify(body))

          }})

          
  
            return res.json({
            status: true,
            message: 'OTP Sent Success.fully..',          
          });
        
        
      
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving patient record',res,500)   
      
      }       
    });

    
    
    app.post('/api/updateFamilyMember', [
      check('familyMemberId').not().isEmpty().trim().escape()
     ], function (req, res) {        
      dlog(" inside updateFamilyMember api ")
  
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'validation error.',res,999)        
      }
        
        try{
         let filter  = {_id : new ObjectId(req.body.familyMemberId)}
          
          MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
            //   assert.equal(null, err);
                  dlog("familyMemberDB Database connected successfully at post /updateProfile")
               
                              
                  if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                   var db = database.db()  
                   let fields = {}
  
                   let fielchange={}
                  
                   if(req.body.relation && req.body.relation.trim() !=""   )
                    fielchange.relation = req.body.relation
  
                   if(req.body.name && req.body.name.trim() !=""   )
                      fielchange.name = req.body.name

                      if(req.body.phoneNumber && req.body.phoneNumber.trim() !=""   )
                      fielchange.phoneNumber = req.body.phoneNumber
                   
                   if(req.body.patientId && req.body.patientId.trim() !=""  )
                      fielchange.patientId = req.body.patientId
  
                      
                   if(req.body.name && req.body.name.trim() !=""  )
                   fielchange.name = req.body.name

                   
                   if(req.body.active ==false){
                    fielchange.active = false
                   }
                   if(req.body.active ==true){
                    fielchange.active = true
                   }
                    
                   fielchange.updatedDate = new Date()
                  
                   fielchange = {$set:fielchange}    
                   
                   dlog("fielchange == "+JSON.stringify(fielchange))             
                   db.collection('family-members').findOne(filter,function(err, familyMemberRec) {
          
                      if (err ) {
                        database.close();
                       return  common.handleError(err, 'Error, in fetching familyMember',res,500)   
                      }
                      
                      if (!familyMemberRec){
                        database.close();              
                        return  common.handleError(err, ' No familyMember record found with the given familyMember ID',res,500)   
                      }
  
                      db.collection('family-members').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                        if (error) {
                          database.close(); 
                          return common.handleError(err, 'familyMember password could not be updated',res,500)                    
                        }
                        let familyMember = response.value                        
              
                        database.close();
                        return res.json({
                          status: true,
                          message: 'familyMember record update Success...',
                          data: familyMember
                        });
                        
                      });
                   
                  });
                 });
              
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'FamilyMember password could not be updated',res,500)   
        
        }
  
         
      });


}
