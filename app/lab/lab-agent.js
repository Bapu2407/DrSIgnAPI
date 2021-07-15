
const {check, validationResult} = require('express-validator');
const Labagent = require('../../models/lab-agent');
const ServiceLocation = require('../../models/service-location');

const LabagentServiceLocation = require('../../models/labagent-service-location');

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

const commonDocFieldSave =  (inputCollection,res) => {

  Labagent.findById(inputCollection.labagentId, function (err, labagent) {
    if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given id number',res,500)   
  
    if(inputCollection.name)
      labagent.name = inputCollection.name


    if(inputCollection.dob && inputCollection.dob.trim() !=""){
        labagent.dob = common.convertStringTodate(inputCollection.dob)
    }

    if(inputCollection.emailId)
      labagent.emailId = inputCollection.emailId            
    
      

    if(inputCollection.pharmacyLicenceCopy && inputCollection.pharmacyLicenceCopy.trim() !=""){
      labagent.pharmacyLicenceCopyURL = inputCollection.pharmacyLicenceCopyURL
    }

    if(inputCollection.name && inputCollection.name.trim() !="" )
      labagent.name = inputCollection.name



    if(inputCollection.emailId  && inputCollection.emailId.trim() !="" )
      labagent.emailId = inputCollection.emailId            
    


    if(inputCollection.active ==false){
      labagent.active = false
     }
     if(inputCollection.active ==true){
      labagent.active = true
     }
    
    labagent.updatedDate = new Date()

    labagent.save(function (err) {
      if (err) return common.handleError(err, 'updateMyDemographicProfile  could not be updated',res,500)   
      labagent.pharmacyLicenceCopy = ''

      return res.json({
        status: true,
        message: 'Labagent update Success...',
        data: labagent
      });
     // res.send(labagent);
    });
  });


}




const main =  async (demographicFileName,inputCollection,whichfiles) => {
  return new Promise((resolve,reject) => {
  
      if(demographicFileName && (whichfiles=="both" || whichfiles == "demographic")){
        dlog("demographicFileName :="+demographicFileName)
      //  await writeFile(professionalFileName, inputCollection.uploadPhotoProfessional, 'base64');

        fs.writeFile(demographicFileName, inputCollection.pharmacyLicenceCopy,'base64', function(err) {
          if (err) 
          //  return common.handleError(err,'demographicFile could not be created ...',res,200)
          reject(err)
            dlog("demographicFile created successfully");
    
         });
      }
  
      resolve("file created at desired folder")
   
  })
}
const doFileProcessing =  async (inputCollection,whichfiles,res)=>{
  return new Promise((resolve,reject) => {     

  if(process.env.ENVIRONMENT =="LOCAL"){
    inputCollection.fileFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
   }else{
    inputCollection.fileFirstPart="http://"+process.env.IPADDRESS
   }

   var staticImageDir = process.env.IMAGE_PATH

   const photoRandomString = Str.random(8)  
   dlog("photoRandomString ="+photoRandomString)


   let demographicFileNameSuf = "PhotoDemographic_"+photoRandomString+"_"+inputCollection.name.replace(/\s/g, '_')

   let demographicFileName = staticImageDir + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT

   inputCollection.pharmacyLicenceCopyURL = inputCollection.fileFirstPart + "/public/images/" + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT


   if(inputCollection.pharmacyLicenceCopy){
     inputCollection.pharmacyLicenceCopy = inputCollection.pharmacyLicenceCopy.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
   }   


  // try{

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
        }else{
        //  throw err
          reject(new Error('Directory does not exist, where the images will go'))
       
        }
      });
  });
}
//const fsp = require("fs/promises");
module.exports = function (app) {

/*
    *****************************************
    1. Lab Agent Sign-Up API
    *****************************************
*/


  app.post('/api/lab-agent-signup', [
    
   check('emailId').not().isEmpty().trim().isEmail().normalizeEmail(),
   check('name').not().isEmpty().trim().escape(),
   check('dob').not().isEmpty().trim().escape(),
   check('mobileNumber').not().isEmpty().trim(),
   check('agentPhrmcyId').not().isEmpty().trim(),
   check('username').not().isEmpty().trim(),
   check('password').not().isEmpty().trim().escape(),
   check('pharmacyLicenceCopy').not().isEmpty().trim(),
   
],function (req, res) {    
  //try{    
      dlog(" inside registration api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      dlog("name ="+req.body.name)

      var inputCollection = req.body

      if(inputCollection.dob){
        inputCollection.dob = common.convertStringTodate(inputCollection.dob)
      }
      const photoRandomString = Str.random(8)  
      dlog("photoRandomString ="+photoRandomString)


      let uploadedFileNameSuf = "PharmacyLicenceCopy"+photoRandomString+"_"
      

      //inputCollection =  doFileProcessing(inputCollection,"both",res)
         //doFileProcessing(inputCollection,"both",res).then((result) => {
          common.doFileProcessing(inputCollection,"",uploadedFileNameSuf,"pharmacyLicenceCopy","pharmacyLicenceCopyURL").then((result) => {

          dlog("i am here 1")
 
            inputCollection = result
            var temp = new Labagent(inputCollection)
              
            // insert data into database
            temp.save(function (error, labagent) {
              // check error
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }
              if(labagent){
                labagent.pharmacyLicenceCopy = ''
                labagent.pharmacyLicenceCopyURL = inputCollection.pharmacyLicenceCopyURL
              }

            if(req.body.otp){
                let emailData = {name:labagent.name, email:labagent.emailId,subject:"Registration successful, please verify Your OTP"}   
              
              //  emailData.jsondata = jsondata
                emailData.emailTemplate = '<h4>      Hi,  '+ labagent.name +', your registration is successful,  your OTP is as follows '+req.body.otp+'. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

                common.sendHTMLemail(emailData)  
            }else{
              let emailData = {name:labagent.name, email:labagent.emailId,subject:"Registration successful"}   
              
              //emailData.jsondata = jsondata
              emailData.emailTemplate = '<h4>      Hi,  '+ labagent.name +', your registration is successful. </h4><p>      Thanking you.   </p>'

              common.sendHTMLemail(emailData)
            }
              // Everything OK
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: labagent
              });
            });
          }, (err) => {
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
    *****************************************
    2. Lab Agent  First login API
    *****************************************
*/



  app.post('/api/lab-agent-first-login', [
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
      
      const update = { password: req.body.password };

      try{
       
      Labagent.findOne(filter, function (err, labagent) {
        if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given email/mobile number',res,500)   
      
        labagent.password = req.body.password

        if(req.body.fcmId && req.body.fcmId.trim() !=""){
          labagent.fcmId = req.body.fcmId
        }

        if(req.body.deviceId && req.body.deviceId.trim() !=""){
          labagent.deviceId = req.body.deviceId
        }


        labagent.save(function (err) {
          if (err) return common.handleError(err, 'Labagent password could not be updated',res,500)   
          
          labagent.pharmacyLicenceCopy = ''

          return res.json({
            status: true,
            message: 'first-login Success...',
            data: labagent
          });
         // res.send(labagent);
        });
      });
       

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Labagent password could not be updated',res,500)   
      
      }

       
    });
    
    
  });



/*
    *****************************************
    3.  Lab Agent Login API
    *****************************************
*/


  app.post('/api/lab-agent-login', [
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
    
    let filter = { emailId:  req.body.emailPhone,password:req.body.password};

    v.check().then((matched) => {
      if (!matched) {
        dlog("invalid email")
        filter = { mobileNumber:  req.body.emailPhone,password:req.body.password};
      }
      try{       
        Labagent.findOne(filter, function (err, labagent) {
          if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given email/mobile and the password',res,500)   
          
          if(!req.body.fcmId && !req.body.deviceId){
              
              labagent.pharmacyLicenceCopy = ''
          //   res.send(labagent);
              return res.json({
                status: true,
                message: 'login Success...',
                data: labagent
              });
          }else if(req.body.fcmId || req.body.deviceId){
              if(req.body.fcmId && req.body.fcmId.trim() !=""){
                labagent.fcmId = req.body.fcmId
              }
      
              if(req.body.deviceId && req.body.deviceId.trim() !=""){
                labagent.deviceId = req.body.deviceId
              }     
      
              labagent.save(function (err) {
                if (err) return common.handleError(err, 'Labagent fcmId or deviceId could not be updated',res,500)   
                
                labagent.pharmacyLicenceCopy = ''
      
                return res.json({
                  status: true,
                  message: 'login Success...',
                  data: labagent
                });
              // res.send(labagent);
              });
          }

        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving labagent record',res,500)   
      
      }       
    });

    
    
  });



/*
    *****************************************
    4 . View Lab agent details By Agent Id  API
    *****************************************
*/


  app.post('/api/fetchLabagentDetails', [
    check('labagentId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchLabagentDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

 
    try{       
      Labagent.findById(req.body.labagentId, function (err, labagent) {
      
        if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given labagentId',res,500)   
        
        labagent.pharmacyLicenceCopy = ''

          return res.json({
            status: true,
            message: 'Labagent record found ...',
            data: labagent
          });

      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Labagent record',res,500)

    }      
  });



/*
    *****************************************
    5.  Update Lab Agent My Profile API
    *****************************************
*/

  app.post('/api/updateLabagentMyprofile', [
    check('labagentId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateMyDemographicProfile api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    if(req.body.pharmacyLicenceCopy && req.body.pharmacyLicenceCopy.trim() !=""){    
    
      const photoRandomString = Str.random(8)  
      dlog("photoRandomString ="+photoRandomString)


      let uploadedFileNameSuf = "PharmacyLicenceCopy"+photoRandomString+"_"
      
      //doFileProcessing(inputCollection,"demographic",res).then((result) => {
        common.doFileProcessing(inputCollection,"",uploadedFileNameSuf,"pharmacyLicenceCopy","pharmacyLicenceCopyURL").then((result) => {

          try{       
            inputCollection = result
            commonDocFieldSave(inputCollection,res)       
          }catch(error){
            //console.error(error)
            return  common.handleError(error, 'Labagent password could not be updated',res,500)   
          
          }
        }, (err) => {
          let errMsg            
          errMsg = err?err.message:""
          return res.json({
            status: false,
            message: 'Labagent update has failed...',
            error: errMsg
          });
        });
    }else{
      try{       
        commonDocFieldSave(inputCollection,res)       
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Labagent password could not be updated',res,500)   
      
      }
    }
       
    });

    
/*
    *****************************************
    6.  LabAgent Send Otp API
    *****************************************
*/


  
  app.post('/api/lab-agent-send-otp', [
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
        Labagent.findOne(filter, function (err, labagent) {
          if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given email/mobile and the password',res,500)   
         dlog("labagent.mobileNumber =="+labagent.mobileNumber)
          let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=5ec38edd9bf45&sender=DRSIGN&mobileno="+labagent.mobileNumber+"&text="+req.body.otp
         

          request({method: "GET", 
          "rejectUnauthorized": false, 
          "url": smsGatewayURL,
          "headers" : {"Content-Type": "application/json"},
          function(err,data,body) {
            dlog("data =="+JSON.stringify(data))
            dlog("body =="+JSON.stringify(body))

          }})


            
          let emailData = {name:labagent.name, email:labagent.emailId,subject:"Verify Your OTP"}   
          let  jsondata = {
              userName:labagent.name,            
              otp:req.body.otp,     
          }
          emailData.jsondata = jsondata
          emailData.emailTemplate = '<h4>      Hi,'+ labagent.name +',  your OTP is as follows '+req.body.otp+'. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)  


          return res.json({
          status: true,
          message: 'OTP Sent Success.fully..',          
          });


        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving labagent record',res,500)   
      
      }       
    });

    
    
  });
  

  /*
    *****************************************
    7.  LabAgent Send sms API
    *****************************************
*/
  app.post('/api/send-message-to-labagent', [
    check('labagentId').not().isEmpty().trim().escape(),
    check('message').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside send-message-to-labagent api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

 
    try{       
      Labagent.findById(req.body.labagentId, function (err, labagent) {
      
        if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given labagentId',res,500)   
        
        labagent.pharmacyLicenceCopy = ''

        let fcmId = labagent.fcmId

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
              if (err) {
                common.handleError(err, 'Something wrong in sending Push message to labagent',res,500)   
              } 
            });
            dlog("Message sent to labagent successfully to labagent ",labagent.name );
            
            if(req.body.directcall){
                return res.json({
                  status: true,
                  message: 'Message sent to labagent successfully ...',
                // data: labagent
                });
            }
        }catch(error){
          console.error("ignore this error "+ error)
          //return  common.handleError(error, 'Error retrieving Labagent record',res,500)

        }     
              

      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Labagent record',res,500)

    }      
  });


  /*
    *****************************************
    8. Search service pincode LabAgent API
    *****************************************
 */

  app.post('/api/labagent-search-service-pincode', [
    //check('labagentId').not().isEmpty().trim().escape(),
    check('pincode').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside labagent api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    try{   
    
        
      ServiceLocation.find({ pincode: req.body.pincode, active:true }, function (err, serviceLocation) {
      
      var keysArray = Object.keys(serviceLocation);

if (err ||  keysArray.length < 1 ) return  common.handleError(err, 'No ServiceLocation record found with the given pincode',res,500)  

          return res.json({
            status: true,
            message:'ServiceLocation record found ...',
            data: {
              total:keysArray.length,
              result:serviceLocation
            }
          });

      }).select({'id':'_id','labID':'labID','areaname':'areaname','pincode':'pincode'});

    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving active service pincode record',res,500)

    }      
  });



  /*
    *****************************************
    9. Add service pincode By LabAgent API
    *****************************************
  */
//LabagentServiceLocation

 app.post('/api/add-labagent-service-details', [
    check('labagentID').not().isEmpty().trim().escape(),
    check('serviceID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchLabagentDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

 
    try{       
      Labagent.findById(req.body.labagentID, function (err, labagent) {
      
        if (err || !labagent) return  common.handleError(err, 'No Labagent record found with the given labagentId',res,500)   
        

        var inputCollection = req.body    
        var temp = new LabagentServiceLocation(inputCollection)
        
      // insert data into database
      temp.save(function (error, labagentServiceLocation) {
        // check error
        if (error) {
          return common.handleError(error,'DB Insert Fail...',res,500)           
        }

        // Everything OK
        return res.json({
          status: true,
          message: 'agent Service Location Insert Success...',
          data: labagentServiceLocation
        });
      });


      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Labagent record',res,500)

    }      
  });


  /*
    *****************************************
    10. Delete service pincode By LabAgent API
    *****************************************
  */





}