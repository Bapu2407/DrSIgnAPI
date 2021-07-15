
const {check, validationResult} = require('express-validator');
const Labtest = require('../../models/lab-test');
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
const commonDocFieldSave =  (inputCollection,res) => {

  Labtest.findById(inputCollection.labtestId, function (err, labtest) {
    if (err || !labtest) return  common.handleError(err, 'No Labtest record found',res,500)   
  

 
    if(inputCollection.name)
    labtest.name = inputCollection.name

    if(inputCollection.name && inputCollection.name.trim() !="" )
    labtest.name = inputCollection.name



    if(inputCollection.category)
    labtest.category = inputCollection.category 

    if(inputCollection.category && inputCollection.category.trim() !=""){
     labtest.category = inputCollection.category
    }


    if(inputCollection.process)
    labtest.process = inputCollection.process 

    if(inputCollection.process  && inputCollection.process.trim() !="" )
    labtest.process = inputCollection.process            



    if(inputCollection.duration)
    labtest.duration = inputCollection.duration 

    if(inputCollection.duration  && inputCollection.duration.trim() !="" )
    labtest.duration = inputCollection.duration            



    if(inputCollection.cost)
    labtest.cost = inputCollection.cost 

    if(inputCollection.cost  && inputCollection.cost.trim() !="" )
    labtest.cost = inputCollection.cost



    if(inputCollection.sampleColMod)
    labtest.sampleColMod = inputCollection.sampleColMod 

    if(inputCollection.sampleColMod  && inputCollection.sampleColMod.trim() !="" )
    labtest.sampleColMod = inputCollection.sampleColMod    



    if(inputCollection.sampleColProcedure)
    labtest.sampleColProcedure = inputCollection.sampleColProcedure 

    if(inputCollection.sampleColProcedure  && inputCollection.sampleColProcedure.trim() !="" )
    labtest.sampleColProcedure = inputCollection.sampleColProcedure 



    if(inputCollection.beforeFood)
    labtest.beforeFood = inputCollection.beforeFood 

    if(inputCollection.beforeFood  && inputCollection.beforeFood.trim() !="" )
    labtest.BeforeFood = inputCollection.BeforeFood  


    if(inputCollection.emptyStom)
    labtest.emptyStom = inputCollection.emptyStom 

    if(inputCollection.emptyStom  && inputCollection.emptyStom.trim() !="" )
    labtest.emptyStom = inputCollection.emptyStom            


    if(inputCollection.active ==false){
      labtest.active = false
     }
     if(inputCollection.active ==true){
      labtest.active = true
     }
    
    labtest.updatedDate = new Date()

    labtest.save(function (err) {
      if (err) return common.handleError(err, 'updateLabTest configuration details  could not be updated',res,500)   
      labtest.uploadPhotoDemographic = ''

      return res.json({
        status: true,
        message: 'Labtest update Success...',
        data: labtest
      });
     // res.send(labtest);
    });
  });


}



//const fsp = require("fs/promises");
module.exports = function (app) {


 //name category process duration cost   sampleColMod sampleColProcedure  beforeFood emptyStom
  app.post('/api/labtest-registration-step-I', [
       
    check('name').not().isEmpty().trim().escape(),
    check('category').not().isEmpty().trim().escape(),
    check('process').not().isEmpty().trim().escape(),
    check('duration').not().isEmpty().trim().escape(),
    check('cost').not().isEmpty().trim().escape(),
    check('sampleColMod').not().isEmpty().trim().escape(),
    // check('sampleColProcedure').not().isEmpty().trim().escape(),
    // check('beforeFood').not().isEmpty().trim().escape(),
    // check('emptyStom').not().isEmpty().trim().escape()

  
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

          dlog("i am here 1")
 
            //inputCollection = result
            var temp = new Labtest(inputCollection)
              
            // insert data into database
            temp.save(function (error, labtest) {
              // check error
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }


              // Everything OK
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: {
                      'labtestId': labtest._id,
                      'status': labtest.active
                    }
              });
            });

  
  });




  app.post('/api/labtest-registration-step-II', [
       
    check('labtestId').not().isEmpty().trim().escape(),
    check('sampleColProcedure').not().isEmpty().trim().escape(),
    check('beforeFood').not().isEmpty().trim().escape(),
    check('emptyStom').not().isEmpty().trim().escape()

  
],function (req, res) {
  

    dlog(" update labtest registration II  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
  
  
          try{       
            commonDocFieldSave(inputCollection,res)       
          }catch(error){
            //console.error(error)
            return  common.handleError(error, 'Labtest password could not be updated',res,500)   
          
          }

});






//fetchLabtestDetails API
  app.post('/api/fetchLabtestDetails', [
    check('labtestId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchLabtestDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

 
    try{       
      Labtest.findById(req.body.labtestId, function (err, labtest) {
      
        if (err || !labtest) return  common.handleError(err, 'No Labtest record found with the given labtestId',res,500)   
        

          return res.json({
            status: true,
            message: 'Labtest record found ...',
            data: labtest
          });

      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Labtest record',res,500)

    }      
  });







//updateLabtestMyprofile API
  app.post('/api/updateLabtestDetails', [
    check('labtestId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateLabTest configuration details api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body 
  
          try{       
            commonDocFieldSave(inputCollection,res)       
          }catch(error){
            //console.error(error)
            return  common.handleError(error, 'Labtest record could not be updated',res,500)   
          
          }

       
    });

    


  
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
        Labtest.findOne(filter, function (err, labtest) {
          if (err || !labtest) return  common.handleError(err, 'No Labtest record found with the given email/mobile and the password',res,500)   
         dlog("labtest.mobileNumber =="+labtest.mobileNumber)
          let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=5ec38edd9bf45&sender=DRSIGN&mobileno="+labtest.mobileNumber+"&text="+req.body.otp
         

          request({method: "GET", 
          "rejectUnauthorized": false, 
          "url": smsGatewayURL,
          "headers" : {"Content-Type": "application/json"},
          function(err,data,body) {
            dlog("data =="+JSON.stringify(data))
            dlog("body =="+JSON.stringify(body))

          }})


            
          let emailData = {name:labtest.name, email:labtest.emailId,subject:"Verify Your OTP"}   
          let  jsondata = {
              userName:labtest.name,            
              otp:req.body.otp,     
          }
          emailData.jsondata = jsondata
          emailData.emailTemplate = '<h4>      Hi,'+ labtest.name +',  your OTP is as follows '+req.body.otp+'. It expires after 10 minutes. </h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)  


          return res.json({
          status: true,
          message: 'OTP Sent Success.fully..',          
          });


        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving labtest record',res,500)   
      
      }       
    });

    
    
  });
  
  app.post('/api/send-message-to-labtest', [
    check('labtestId').not().isEmpty().trim().escape(),
    check('message').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside send-message-to-labtest api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

 
    try{       
      Labtest.findById(req.body.labtestId, function (err, labtest) {
      
        if (err || !labtest) return  common.handleError(err, 'No Labtest record found with the given labtestId',res,500)   
        
        labtest.uploadPhotoDemographic = ''

        let fcmId = labtest.fcmId

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
                common.handleError(err, 'Something wrong in sending Push message to labtest',res,500)   
              } 
            });
            dlog("Message sent to labtest successfully to labtest ",labtest.name );
            
            if(req.body.directcall){
                return res.json({
                  status: true,
                  message: 'Message sent to labtest successfully ...',
                // data: labtest
                });
            }
        }catch(error){
          console.error("ignore this error "+ error)
          //return  common.handleError(error, 'Error retrieving Labtest record',res,500)

        }     
              

      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Labtest record',res,500)

    }      
  });
}