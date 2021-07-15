

const {check, validationResult} = require('express-validator');
const ServiceLocation = require('../../models/service-location');
const ServiceOperationTime = require('../../models/service-operation-time');
const date = require('date-and-time');
var dlog = require('debug')('dlog')
mongoDBInstance  = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var mongoDB = require('../../databaseconstant');


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
//const fsp = require("fs/promises");




const commonserviceLocationDocFieldSave =  (inputCollection,res) => {

  ServiceLocation.findById(inputCollection.serviceID, function (err, serviceLocation) {
    if (err || !serviceLocation) return  common.handleError(err, 'No Service location record found',res,500)   
  

    if(inputCollection.areaname)
    serviceLocation.areaname = inputCollection.areaname

    if(inputCollection.areaname && inputCollection.areaname.trim() !="" )
    serviceLocation.areaname = inputCollection.areaname



    if(inputCollection.pincode)
    serviceLocation.category = inputCollection.pincode 

    if(inputCollection.pincode && inputCollection.pincode.trim() !=""){
     serviceLocation.pincode = inputCollection.pincode
    }

          
    if(inputCollection.active ==false){
      serviceLocation.active = false
     }
     if(inputCollection.active ==true){
      serviceLocation.active = true
     }
    
    serviceLocation.updatedDate = new Date()

    serviceLocation.save(function (err) {
      if (err) return common.handleError(err, 'update Service Location  details  could not be updated',res,500)   

      return res.json({
        status: true,
        message: 'Service Location update Success...',
        data: serviceLocation
      });
     // res.send(serviceLocation);
    });
  });

}


const commonserviceLocationOptDocFieldSave =  (inputCollection,res) => {
  

    ServiceOperationTime.findById(inputCollection.serviceLocOptID, function (err, serviceOperationTime) {
    if (err || !ServiceOperationTime) return  common.handleError(err, 'No Service location operation time record found',res,500)   
  

    if(inputCollection.serviceID)
    serviceOperationTime.serviceID = inputCollection.serviceID

    if(inputCollection.serviceID && inputCollection.serviceID.trim() !="" )
    serviceOperationTime.serviceID = inputCollection.serviceID



    if(inputCollection.date)
    serviceOperationTime.date = inputCollection.date 

    if(inputCollection.date && inputCollection.date.trim() !=""){
     ServiceOperationTime.date = inputCollection.date
    }


    if(inputCollection.day)
    serviceOperationTime.day = inputCollection.day 

    if(inputCollection.day && inputCollection.day.trim() !=""){
     serviceOperationTime.day = inputCollection.day
    }


    if(inputCollection.startingTime)
    serviceOperationTime.startingTime = inputCollection.startingTime 

    if(inputCollection.startingTime && inputCollection.startingTime.trim() !=""){
     serviceOperationTime.startingTime = inputCollection.startingTime
    }


    if(inputCollection.endingTime)
    serviceOperationTime.endingTime = inputCollection.endingTime 

    if(inputCollection.endingTime && inputCollection.endingTime.trim() !=""){
     serviceOperationTime.endingTime = inputCollection.endingTime
    }


          
    if(inputCollection.active ==false){
      serviceOperationTime.active = false
     }
     if(inputCollection.active ==true){
      serviceOperationTime.active = true
     }
    
    serviceOperationTime.updatedDate = new Date()

    serviceOperationTime.save(function (err) {
      if (err) return common.handleError(err, 'update Service Location Opration time details  could not be updated',res,500)   

      return res.json({
        status: true,
        message: 'Service Location Operation update Success...',
        data: serviceOperationTime
      });
     // res.send(serviceLocation);
    });
  });

}



module.exports = function (app) {

/*
    *****************************************
    1. Service location add by lab owner API
    *****************************************
*/


  app.post('/api/service-location-add', [
    
   check('labID').not().isEmpty().trim().escape(),
   check('areaname').not().isEmpty().trim(),
   check('pincode').not().isEmpty().trim()

],function (req, res) {        
      dlog(" inside service-location-add api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)
      }

      dlog("name ="+req.body.name)
      var inputCollection = req.body    
      var temp = new ServiceLocation(inputCollection)
        
      // insert data into database
      temp.save(function (error, location) {
        // check error
        if (error) {
          return common.handleError(error,'DB Insert Fail...',res,500)           
        }

        // Everything OK
        return res.json({
          status: true,
          message: 'Service Location Insert Success...',
          data: {
            serviceId:location._id,
            status:location.active
          }
        });
      });
  
  });


/*
    *****************************************
    2. Service location update by lab owner API
    *****************************************
*/


  app.post('/api/updateserviceLocation', [
    check('serviceID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateserviceLocation  details api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body 
  
          try{       
            commonserviceLocationDocFieldSave(inputCollection,res)       
          }catch(error){
            //console.error(error)
            return  common.handleError(error, 'updateserviceLocation record could not be updated',res,500)   
          
          }

       
    });




/*
    *****************************************
    3. Service location Operation time add by lab owner API
    *****************************************
*/

  app.post('/api/add-service-operation-time', [
    
    check('serviceID').not().isEmpty().trim().escape(),
    check('date').not().isEmpty().trim(),
    //check('day').not().isEmpty().trim(),
    check('startingTime').not().isEmpty().trim(),
    check('endingTime').not().isEmpty().trim()

 ],function (req, res) {        
       dlog(" inside service-operation-time Add api  ")

       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog(" inside service-operation-time add api ")    


        var dateString = req.body.date//"23-04-2020"; 
        var dateParts = dateString.split("-");    
        // month is 0-based, that's why we need dataParts[1] - 1
        var newDate = common.convertStringTodate(req.body.date) //new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
        //var newDate = new Date(dateParts[2], dateParts[1] - 1, --dateParts[0]);     
       // let  newDate= new Date(appointment.appointmentDate);
        dlog("newDate ="+newDate.toDateString())
        dlog("newDate toISOString="+newDate.toISOString())
        dlog("newDate toString ="+newDate.toString())


    let promises = []

    promises.push( new Promise(resolve => {   
    var inputCollection = req.body

        inputCollection.active = true
        inputCollection.createdDate = new Date()
        
        var temp = new ServiceOperationTime(inputCollection)


        // insert data into database
        temp.save(function (error, location) {
          // check error
          if (error) {
            return common.handleError(error,'Service Operation  Time Insert Fail...',res,500)           
          }
  
          // Everything OK
          return res.json({
            status: true,
            message: 'Service Operation  Time Insert Success...'
            
          });
        });


   }))

  });






/*
    *****************************************
   4 . Service location operation time update by lab owner API
    *****************************************
*/


  app.post('/api/updateserviceLocationOpTime', [
    check('serviceLocOptID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateserviceLocationTime  details api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body 
  
          try{       
            commonserviceLocationOptDocFieldSave(inputCollection,res)       
          }catch(error){
            //console.error(error)
            return  common.handleError(error, 'updateserviceLocationTime record could not be updated',res,500)   
          
          }

       
    });







/*
    *****************************************
    5. Fetch Service location  by lab owner API
    *****************************************
*/

  app.post('/api/service-locationBylabowner', [
    check('labID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get service-location  api  by labID ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    let filter = { labID:  req.body.labID};
    try{       
      ServiceLocation.find(filter, function (err, serviceLocationArray) {
        if (err || !serviceLocationArray || (serviceLocationArray && serviceLocationArray.length ==0)) return  common.handleError(err, 'No Service location record found with the given doctor ID',res,500)   
    
      //  res.send(serviceLocation);

        return res.json({
          status: true,
          message: 'Service location retrieval success...',
          data: serviceLocationArray
        });


      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Service location  record',res,500)   
    
    }     
    
  });



/*
    *****************************************
    6. Fetch  Operation time by Service location id  API
    *****************************************
*/

  app.post('/api/fetchServiceOperationTime', [
    check('serviceID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchServiceOperationTime api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

        let filter = { serviceID:req.body.serviceID};
 
    try{       
      ServiceOperationTime.findOne(filter, function (err, serviceOperationTime) {
      
        if (err || !serviceOperationTime) return  common.handleError(err, 'No operation time record found with the given service location',res,500)   
        

          return res.json({
            status: true,
            message: 'service operation time record found ...',
            data: serviceOperationTime
          });

      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving operation time record',res,500)

    }      
  });



/*
    *****************************************
    7. Fetch all Service location list id  API
    *****************************************
*/




  app.post('/api/fetchServiceLocationList', function (req, res) {        

    dlog(" inside get fetchServiceLocationList  api ")


    try{       
      ServiceLocation.find({},function (err, serviceLocationArray) {
      
        if (err || !serviceLocationArray) return  common.handleError(err, 'No Labtest record found with the given labtestId',res,500)   
        

          return res.json({
            status: true,
            message: 'Service location list record found ...',
            data: serviceLocationArray
          });

      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Service location list record',res,500)
     }
    
    
  });


}
