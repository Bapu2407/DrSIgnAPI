

const {check, validationResult} = require('express-validator');
const ServiceLocation = require('../../models/service-location');
const ServiceOperationTime = require('../../models/service-operation-time');
const Labbook = require('../../models/lab-booking');
mongoDBInstance  = require('mongodb');
const date = require('date-and-time');
var dlog = require('debug')('dlog')
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID

const { promisify } = require("util");
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var moment = require('moment');


var FCM = require('fcm-node');
var serverKey = common.SERVER_KEY; 
var fcm = new FCM(serverKey);
var request = require('request');
//var axios = require('axios');
const writeFile = promisify(fs.writeFile);
//const fsp = require("fs/promises");

var defaultStatusStructure = {
mainStatus:"Pending",
subStatus:{
	sample_col_init:{
	status:"notstarted",
	date:"29/11/2020",
	time:"09:30 AM",
  agentId:"",
  agentName:""
	},
	sample_collected:{
	status:"notstarted",
  sampleId: "",
  date:"29/11/2020",
	time:"09:30 AM",
	collectedById:""
	},
	sample_accepted:{
	status:"notstarted",
	actionstatus:"pending"
	},
	sample_processing:{
	status:"notstarted",
	timeRemaining:1
	},
	sample_report_sent:{
	status:"notstarted",
	report:"",
	reportURL:"",
	actionstatus:'reportnotyetsent'
	}
}
}

const getPatientDetails = async (labBookingsArry,res) =>{
  labBookingsArry = await getPatientNameAddress(labBookingsArry)
                  
  return res.json({
    status: true,
    message: 'Lab bookings Array retrieval success...',
    data : labBookingsArry
    });  

}

const getPatientNameAddress = async (labBookingsArry) =>{
  let promises = []
  
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    labBookingsArry.forEach(function(labBooking, index){
     
    promises.push( new Promise(resolve => {
      dlog("labBooking.patientId ="+labBooking.patientId)     
      if( ObjectId.isValid(labBooking.patientId)){       
      MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
          var db = database.db()     
        let filter  = {_id : new ObjectId(labBooking.patientId)}
          db.collection('patient_profile_details').findOne(filter,function(error, patient) {

          //  console.log(" patient == "+JSON.stringify(patient))
            if (error ) {
                database.close(); 
                resolve(labBooking)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
            if (!patient ) {
              database.close(); 
              //return common.handleError(err, 'patient could not be found',res,500)                    
              resolve(labBooking)
            }    
            if (patient ){                       
              console.log(" patient name == "+patient.name)
              console.log(" patient permanentAddress == "+patient.permanentAddress)

              for(var i in labBooking.testLabArray){
                let testId = labBooking.testLabArray[i].testId   
                
             
                  labBooking.testLabArray[i].patientName = patient.name
                  labBooking.testLabArray[i].patientAddress = 
                  patient.permanentAddress
                  labBooking.testLabArray[i].mobileNumber = 
                  patient.mobileNumber
                  
              }
                
             // labBooking.patientName = patient.name
            //  labBooking.patientAddress = patient.permanentAddress
            }
            //locationNewArray.push(location)
            //resolve(locationNewArray)
            //resolve({location:location,patient:patient})
            resolve(labBooking)
        });
      })
    }else{
      resolve(labBooking)
    }
      }));
    
    
    })
    
  return  Promise.all(promises)

}
const getTestCount = async (req,res) =>{
  let promises = []
    
  var d = new Date();
      let extra = "Confirmed"
var year = d.getFullYear();
let filterConfirmed = {$and : [ { "$expr": { "$eq": [{ "$year": "$labbookingDate" }, parseInt(year)] }} ,
   {testLabArray:{$elemMatch:{"orderDetails.mainStatus":extra}}}  ]}        
      console.log("filterConfirmed"+JSON.stringify(filterConfirmed))

      promises.push( new Promise(resolve => {     
        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
            var db = database.db()     
          db.collection('lab_book_details').count(filterConfirmed,function(err, result) {
                    
            if (err ) {
              database.close();             
              resolve({totalConfirmedTestCount:0})
              console.error("Error while calculating totalConfirmedTestCount "+err)
  
            }
            database.close();             
            if(result ==undefined){
              resolve({totalConfirmedTestCount:0})            
            }else{          
              resolve({totalConfirmedTestCount:result})
            }           
      
          });
        })        
        }));
        extra = "Pending"
        let filterPending = {$and : [ { "$expr": { "$eq": [{ "$year": "$labbookingDate" }, 	parseInt(year)] }} ,
   {testLabArray:{$elemMatch:{"orderDetails.mainStatus":extra}}}  ]}        

        console.log("filterPending"+JSON.stringify(filterPending))
        promises.push( new Promise(resolve => {     
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              var db = database.db()     
            db.collection('lab_book_details').count(filterPending,function(err, result) {
                      
              if (err ) {
                database.close();             
                resolve({totalPendingTestCount:0})
                console.error("Error while calculating totalPendingTestCount "+err)
    
              }
              database.close();             
              if(result ==undefined){
                resolve({totalPendingTestCount:0})            
              }else{          
                resolve({totalPendingTestCount:result})
              }           
        
            });
          })        
          }));
    extra = "Cancelled"
    let filterCancelled = {$and : [ { "$expr": { "$eq": [{ "$year": "$labbookingDate" }, 	parseInt(year)] }} ,
   {testLabArray:{$elemMatch:{"orderDetails.mainStatus":extra}}}  ]}        

        console.log("filterCancelled"+JSON.stringify(filterCancelled))
        promises.push( new Promise(resolve => {     
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              var db = database.db()     
            db.collection('lab_book_details').count(filterCancelled,function(err, result) {
                      
              if (err ) {
                database.close();             
                resolve({totalCancelledTestCount:0})
                console.error("Error while calculating totalCancelledTestCount "+err)
    
              }
              database.close();             
              if(result ==undefined){
                resolve({totalCancelledTestCount:0})            
              }else{          
                resolve({totalCancelledTestCount:result})
              }           
        
            });
          })        
          }));
         
    
    Promise.all(promises).then(function(valuesArray) {     

      let finalCountJson ={     
}
      dlog("valuesArray == "+JSON.stringify(valuesArray)) 
      let totalTest = 0
      valuesArray.forEach(function(values, index){          
         // let values = valuesArray[j]    
         dlog("values == "+JSON.stringify(values))     
  
         dlog("values['totalCancelledTestCount'] == "+values['totalCancelledTestCount'])     
         dlog("values['totalPendingTestCount'] == "+values['totalPendingTestCount'])     
         dlog("values['totalConfirmedTestCount'] == "+values['totalConfirmedTestCount'])  
            
         if( values['totalConfirmedTestCount'] != undefined ){
            finalCountJson["totalConfirmedTestCount"] = values['totalConfirmedTestCount']
            totalTest = totalTest + values['totalConfirmedTestCount']
        }
        
          if( values["totalCancelledTestCount"]  != undefined ){
            finalCountJson["totalCancelledTestCount"] = values['totalCancelledTestCount']
            totalTest = totalTest + values['totalCancelledTestCount']
          }
          if( values['totalPendingTestCount'] != undefined ){
            finalCountJson["totalPendingTestCount"] = values['totalPendingTestCount']
          }     
          if( values['totalConfirmedTestCount'] != undefined){
            finalCountJson["totalConfirmedTestCount"] = values['totalConfirmedTestCount']
            totalTest = totalTest + values['totalConfirmedTestCount']
          }    
         
      })
      //appointmentNewArray.push(values)

      dlog("finalCountJson == "+JSON.stringify(finalCountJson)) 
      dlog("totalTest == "+totalTest) 
      finalCountJson["totalConfirmedTestCount"] = valuePercent(totalTest, finalCountJson["totalConfirmedTestCount"])
      finalCountJson["totalCancelledTestCount"] = valuePercent(totalTest, finalCountJson["totalCancelledTestCount"])
      finalCountJson["totalPendingTestCount"] = valuePercent(totalTest, finalCountJson["totalPendingTestCount"])
      
      let finaltestCountArray = [finalCountJson["totalConfirmedTestCount"].toFixed(0) ,finalCountJson["totalCancelledTestCount"].toFixed(0),finalCountJson["totalPendingTestCount"].toFixed(0)]
      //let totalTestCost = parseFloat(totalTestGST)  + parseFloat(testObj.totalCost) 
      //totalTestCost = totalTestCost.toFixed(2)
         //.toFixed(0)  
        
      return res.json({
          status: true,
          message: 'Test Counts.',
          data: finaltestCountArray
      });
    
     // database.close();                          
      
    })
  //});


}



const raiseLabBooking = async (req,res) =>{

  
  var dateString = req.body.labbookingDate//"23-04-2020"; 
  var dateParts = dateString.split("-");    
  var newDate = common.convertStringTodate(req.body.labbookingDate) //new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
  dlog("newDate ="+newDate.toDateString())
  dlog("newDate toISOString="+newDate.toISOString())
  dlog("newDate toString ="+newDate.toString())
    
  dlog(" inside raise-labbooking-request api ")
  let promises = []
  var collection_json = req.body      
  collection_json.active = true
  collection_json.createdDate = new Date()
  collection_json.labbookingDate = newDate//new Date(newDate.toISOString())// newDate
  
  //collection_json.tests = []
  for(var i in collection_json.testLabArray){
    let testId = collection_json.testLabArray[i].testId   
    
    let testObj = await getTest(testId)
    if(testObj){
      collection_json.testLabArray[i].orderDetails = defaultStatusStructure

      let totalTestGST= percentCalculation(testObj.totalCost, testObj.gst)


      let totalTestCost = parseFloat(totalTestGST)  + parseFloat(testObj.totalCost) 

      totalTestCost = totalTestCost.toFixed(2)
      collection_json.testLabArray[i].totalTestCost = totalTestCost

    }
    //temp.testId = testId
    //collection_json.tests.push(temp)
        
  }
  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    //   assert.equal(null, err);
        dlog("Lab DB Database connected successfully at post /dummy-labbooking-request")
       
        var db = database.db()
         
 
           db.collection('lab_book_details').insertOne(collection_json , function(err, result) {
           //  assert.equal(err, null);
           if (err) {
             return common.handleError(err,'labbooking record Insert Fail at doctorDB...',res,500)           
           }
           dlog("1 labbooking inserted");
          
           dlog("1 labbooking inserted in LabDB == "+result.insertedId);
             
              //database.close();
              let query = { _id:new ObjectId(result.insertedId)};
              let fielchange={$set:{"requestId": result.insertedId,"labbookingId": result.insertedId}}
               
              let labbookingId = result.insertedId
              
             //sendpush(locationId,labbookingId,"lab_book_details")            
 
               db.collection('lab_book_details').findOneAndUpdate(query,fielchange ,{returnNewDocument:true}, function(err, updateDoc) {
                 if (err) { dlog("labbooking record can not be updated with request ID "); } ;                    
                 database.close();                
               });
           
           
         });
       
         });
      // }))
 
    // Promise.all(promises).then(function(values) {
           
            return res.json({
             status: true,
             message: 'DB Insert Success...'              
           });
    // })
 
 
    
}
const getTest = async (testId) =>{

  return new Promise(resolve => {     

      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {          
      
        var db = database.db()   
        let erroShippingChargeRecord = {err:'noChargeFound'}  
        let cusFilter  = {_id : new ObjectId(testId)}
          db.collection('tests').findOne(cusFilter,function(error, test) {

            dlog("test at commong == "+JSON.stringify(test))
            if (error ) {
                database.close(); 
                resolve(error) 
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
            if (!test ) {
              database.close(); 
              //return common.handleError(err, 'patient could not be found',res,500)                    
              resolve(test) 
            }        
            resolve(test) 
        });
          
      })
        
      })      
    
}
function percentCalculation(a, b){
  var c = (parseFloat(a)*parseFloat(b))/100;
  return parseFloat(c);
}

function valuePercent(a, b){
  var c = (parseFloat(b)/parseFloat(a))*100;
  return parseFloat(c);
}
const dealWithFields = async (req,res) =>{
  const photoRandomString = Str.random(8)  
  dlog("photoRandomString ="+photoRandomString)
  if(req.body.report){    
    let reportname = "report"+photoRandomString+"_"
    let objectFrom = await common.doFileProcessing(req.body.test.orderDetails.subStatus.sample_report_sent,"prescription",reportname,"report","reportURL")
    req.body.test.orderDetails.subStatus.sample_report_sent.reportURL = objectFrom.reportURL
    req.body.test.orderDetails.subStatus.sample_report_sent.report = req.body.report 
    
    console.log("req.body.patientId == "+req.body.test.patientId)
    MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
      let patientId = req.body.test.patientId
      var db = database.db()     
    let filter  = {_id : new ObjectId(patientId)}
      db.collection('patient_profile_details').findOne(filter,function(error, patient) {
        if (error ) {
            database.close(); 
          //  resolve(test)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
        if (!patient ) {
          database.close(); 
          //return common.handleError(err, 'patient could not be found',res,500)                    
          
        }    
        if (patient )     {    
        patient.name = patient.fName + patient.lName 
        let emailData = {name:patient.name, email:patient.emailId,subject:"Lab Report"}   
        //  emailData.jsondata = jsondata
        emailData.emailTemplate = '<h4>      Hi,  '+ patient.name +'Please find the Lab Report by opening the following link '+req.body.test.orderDetails.subStatus.sample_report_sent.reportURL+'.</h4><p>      Thanking you.   </p>'

          common.sendHTMLemail(emailData)  
        }
    });
  })

  }

  //dlog("request body == "+JSON.stringify( req.body))             
  
    try{
     let filter  = {_id : new ObjectId(req.body.labBookingId)}
    //  LabAdmin.findById(req.body.labAdminId, function (err, labAdmin) {

      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
              dlog("labAdminDB Database connected successfully at post /updateProfile")
           
                          
              if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
               var db = database.db()  
               let fields = {}

               let fielchange={}
                            
               
               if(req.body.mobileNumber && req.body.mobileNumber.trim() !=""  )
               fielchange.mobileNumber = req.body.mobileNumber
               

               if(req.body.active ==false){
                fielchange.active = false
               }
               if(req.body.active ==true){
                fielchange.active = true
               }
                
               fielchange.updatedDate = new Date()
              
               
               db.collection('lab_book_details').findOne(filter,function(err, labBookingRec) {
      
                  if (err ) {
                    database.close();
                   return  common.handleError(err, 'Error, in fetching labBooking',res,500)   
                  }
                  
                  if (!labBookingRec){
                    database.close();              
                    return  common.handleError(err, ' No labBooking record found with the given labAdmin ID',res,500)   
                  }

                  var testLabArray = labBookingRec.testLabArray   

                  for(var j in testLabArray ){
                    var testObj = testLabArray[j]
                    let index = parseInt(j)

                    if( testObj.testId == req.body.testId){
                      testObj.testId = req.body.testId
                      console.log("*******matched test id subject to update is *****"+testObj.testId)
                      labBookingRec.testLabArray[j] = req.body.test
                      
                    }else{
                      labBookingRec.testLabArray[j] = testObj
                    }
                  }

                  //if(req.body.mobileNumber && req.body.mobileNumber.trim() !=""  )
                  fielchange.testLabArray = labBookingRec.testLabArray 
   
                  fielchange = {$set:fielchange}    
               
                 // dlog("fielchange == "+JSON.stringify(fielchange))             
                db.collection('lab_book_details').findOneAndUpdate(filter,fielchange ,{returnOriginal:false}, function(error, response) {
                    if (error) {
                      database.close(); 
                      return common.handleError(err, 'Lab Booking record could not be updated',res,500)                    
                    }
                    let labBooking = response.value                        
          
                    database.close();
                    return res.json({
                      status: true,
                      message: 'Lab Booking record update Success...',
                      data: labBooking
                    });
                    
                  });
               
              });
             });


    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'LabAdmin password could not be updated',res,500)   
    
    }


}
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



// const sendpush = function(locationId,labbookingId,type){

//   MongoClient.connect(mongoDB.labDBUrl, function(err, database) {
//     //   assert.equal(null, err);
//         dlog("doctorDB Database connected successfully")
       
//         var db = database.db()
//         let filter = { _id:new ObjectId(locationId),active: true};
//       db.collection('practice_locations').find(filter).toArray(function(err, locationArry) {
        
//       if (err ) {       
//        database.close();              
//        console.log("push message can't be sent for new test request due to the following error "+err)
//        return 
//       }
//       if (!locationArry || (locationArry && locationArry.length ==0)){
//         database.close();              
//         console.log("push message can't be sent for new test request as no location found with the give location id ")
//         return 
//       }

//       database.close();              
//       sendMsgToAllDoctorsof(locationArry,testId)
//     })
       
//          });

// }



module.exports = function (app) {



/*
    *****************************************
    1. View all Lab location list by booking time  API
    *****************************************
*/


  app.post('/api/view-labservicelocation-bydate', [
    
    check('selectedDate').not().isEmpty().trim().escape(),
    check('selectedTime').not().isEmpty().trim().escape()

   ], function (req, res) {        

    dlog(" inside get labservicelocation-bydate  api ")



  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)   
  }
     // ISODate(selectedDate)
    let selectedDate = req.body.selectedDate
    let selectedTime = req.body.selectedTime



    var dateString = selectedDate
    var dateParts = dateString.split("-");    
    // month is 0-based, that's why we need dataParts[1] - 1
    var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
    //var newDate = new Date(dateParts[2]+"-"+ dateParts[1] - 1+"-"+ ++dateParts[0]);     
    // let  newDate= new Date(appointment.bookingDate);
    dlog("newDate ="+newDate.toDateString())
    dlog("newDate toISOString="+newDate.toISOString())
    dlog("newDate toString ="+newDate.toString())
    dlog("selectedDate =="+selectedDate);


  MongoClient.connect(mongoDB.labDBUrl, function(err, database) {
      
        var db = database.db()     

        dlog("step1.1")
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

        dlog(" Database connected successfully ")
        //let filter = {$and :[{ "startingTime" : {"$gt":selectedTime }},{ "endingTime" : {"$lt":  selectedTime}}  ] }

         let filter = {date:req.body.selectedDate}

        db.collection('service_operation_times').find(filter).toArray(function(err, serviceoptimeArry) {
          
        if (err ) return  common.handleError(err, 'Error, No  serviceoptime record found with the given date',res,500)   
        if (!serviceoptimeArry || (serviceoptimeArry && serviceoptimeArry.length ==0)){
          database.close();              
          return  common.handleError(err, 'No serviceoptime record found with the given date  in Lab DB',res,500)   
        }

        database.close();              
        
        return res.json({
          status: true,
          message: 'serviceoptime retrieval by date successful.',
          data: serviceoptimeArry
        });
          

        });
  
   }); 
    
  });



/*
    *****************************************
    2. Lab book by patient id and location id  API
    *****************************************
*/
  

app.post('/api/raise-labbooking-request',function (req, res) {        
  

  try{       

    raiseLabBooking(req,res)

}catch(error){

return  common.handleError(error, 'Lab password could not be updated',res,500)   

}
 });


 app.post('/api/updateLabBooking', function (req, res) {        
  dlog(" inside updateLabBooking api ")

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)        
  }
  
  
  try{       

    dealWithFields(req,res)

}catch(error){

return  common.handleError(error, 'Lab password could not be updated',res,500)   

}
     
  });
     
 app.post('/api/fetchLabBookings', [
  check('labId').not().isEmpty().trim().escape()
 ], function (req, res) {        
//  dlog(" inside fetchlabAdminDetails api  "+req.body.labId)

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)   
  }

  //let filter  = {"testLabArray.labId" : "5f952b10f687660ad1366ff5"}
  let filter  =  {testLabArray:{$elemMatch:{"labId":req.body.labId}}}  
  
  if(req.body.mainStatus){
    filter ={$and : [ {testLabArray:{$elemMatch:{"labId":req.body.labId}}}  ,
   {testLabArray:{$elemMatch:{"orderDetails.mainStatus":req.body.mainStatus}}}  ]}  
  }

  dlog(" reqbody  "+JSON.stringify(req.body))


  //let filter  = {"testLabArray.labId" : { $in : [req.body.labId]}}
  try{       
  

      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
              dlog("labAdminDB Database connected successfully at post /fetchLabBookings")             
                          
              if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                var db = database.db()         
      
               
          db.collection('lab_book_details').find(filter).toArray(function(err, labBookingsArry) {
               if (err ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching lab record',res,500)                    
                    }
                    if (!labBookingsArry || (labBookingsArry && labBookingsArry.length ==0)){
                    database.close(); 
                    return common.handleError(err, 'lab booking could not be found',res,500)                    
                  }
                  if(req.body.mainStatus){
                    var testLabArray = []
                    
                    for(var i in labBookingsArry){
                      labBookingsArryObj = labBookingsArry[i]
                      var tempTestLabArray = []
                        for(var j in labBookingsArryObj.testLabArray ){
                          var testObj = labBookingsArryObj.testLabArray[j]                          
                          dlog("testObj.orderDetails.mainStatus = "+testObj.orderDetails.mainStatus)             
                          if( testObj && testObj.orderDetails && testObj.orderDetails.mainStatus == req.body.mainStatus){
                            
                            console.log("*******matched test id subject to update is *****"+testObj.testId)

                            testObj.orderDetails.subStatus.sample_report_sent.report = ''  
                            labBookingsArryObj.testLabArray[j] = testObj


                            tempTestLabArray.push(testObj)
                          }else{

                            console.log("*******NON matching test id is *****"+testObj.testId)
                            
                          //  labBookingsArry[i].testLabArray.splice(j,1)
                          }
                        }
                      
                      labBookingsArry[i].testLabArray = tempTestLabArray
                    //labBookingsArryObj.testLabArray = testLabArray
                }
              }
                  database.close();

                  getPatientDetails(labBookingsArry,res)
/*
                  return res.json({
                    status: true,
                    message: 'Lab bookings Array retrieval success...',
                    data : labBookingsArry
                    });  
                    */
              });

                  
            
      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving labAdmin record',res,500)   
    
    }       
 
  
});


app.post('/api/fetch-allmonths-tests',function (req, res) {  

  dlog(" inside fetch-allmonths-tests api ")
  let promises = []

  var  testCountArray= []

  let monthArry = ["01","02","03","04","05","06","07","08","09","10","11","12",]
  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  monthArry.forEach(function(month, index){
      promises.push( new Promise(resolve => {                       
            dlog("patientDB Database connected successfully at post /fetch-allmonths-tests")
         
             var db = database.db()         
        
             var d = new Date();
            var year = d.getFullYear();
             let filter ={$and : [ { "$expr": { "$eq": [{ "$month": "$labbookingDate" }, parseInt(month)] }},{ "$expr": { "$eq": [{ "$year": "$labbookingDate" }, parseInt(year)] }},{testLabArray:{$elemMatch:{"labId":req.body.labId}}}  ,
             {testLabArray:{$elemMatch:{"orderDetails.mainStatus":"Confirmed"}}} ]} 
             
            /* db.collection('lab_book_details').aggregate([{ $match:filter,
              $group: {
               totalAmount: { $sum: "$totalTestCost" } 
              } }
            ],function(err, result) {*/
              db.collection('lab_book_details').find(filter).toArray(function(err, result) {

            //  dlog("result =="+JSON.stringify(result))
            

                  if (err ) {
                    database.close();
                   // return  common.handleError(err, 'Error, in fetching Appointment',res,                      500)   
                   testCountArray.push({month:month,sum:0})
                   if (!result || (result && result.length ==0)){
                   resolve(testCountArray)
                   }
                   }
                 //  dlog("result =="+result)       
                 if (!result || (result && result.length >=0)){

                  var testLabArray = []
                  let sumTotal = 0 
                  for(var i in result){
                      labBookingsArryObj = result[i]                    
                    
                      let monthWOrking  = moment(labBookingsArryObj.labbookingDate).format("MM")
                      
                      dlog("monthWOrking = "+monthWOrking)             

                      for(var j in labBookingsArryObj.testLabArray ){
                        var testObj = labBookingsArryObj.testLabArray[j]               
                        
                        //dlog("testObj.orderDetails.mainStatus = "+testObj.orderDetails.mainStatus)             
                        if( testObj && testObj.orderDetails && testObj.orderDetails.mainStatus == "Confirmed" ){
                          
                          console.log("*******matched test id subject to update is *****"+testObj.testId)

                          if(testObj.totalTestCost){
                            testObj.totalTestCost = parseFloat(testObj.totalTestCost)
                          sumTotal = sumTotal + testObj.totalTestCost
                          console.log("*******testObj.totalTestCost *****"+testObj.totalTestCost)
                          console.log("*******sumTotal *****"+sumTotal)
                          }

                        }else{

                          console.log("*******NON matching test id is *****"+testObj.testId)
                          
                        //  labBookingsArry[i].testLabArray.splice(j,1)
                        }
                      }
                  }

                      testCountArray.push({month:month,sum:sumTotal})
                  resolve(testCountArray)
                  }          
                   
             });
         
        }));

    })
    Promise.all(promises).then(function(values) {
      //dlog("values =="+JSON.stringify(values))
      let monthCountArry = []
      for(var i=1;i<=12;i++){
        for(var j in testCountArray ){
          let testCount = testCountArray[j]
          if(parseInt(testCount["month"]) == i){
            monthCountArry.push(parseInt(testCount["sum"]))
          }
        }
      }    
      database.close();    
      return res.json({
       status: true,
       message: ' Fetch-allmonths-test Success...',
       data: monthCountArry             
     });
    })
  })


 
 });




 app.post('/api/fetchLastMonthTillDateTestsCount',function (req, res) {  

  dlog(" inside fetchLastMonthTillDateTestsCount api ")
  let promises = []  
  let allDates = req.body.allDates
  //dlog("req.body for fetchLastMonthTillDateTestsCount API= "+JSON.stringify(req.body)) 
  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    allDates.forEach(function(dateParam, index){
      promises.push( new Promise(resolve => {                       
            dlog("patientDB Database connected successfully at post /fetch-allmonths-tests")
         
             var db = database.db()         
             var dateString = dateParam.toString()
             var dateParts = dateString.split("-");    
             // month is 0-based, that's why we need dataParts[1] - 1
             var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);
             
             const yesterday = new Date(new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0],0, 0, 0))
             yesterday.setDate(newDate.getDate())
             const tomorrow = new Date(newDate)
             tomorrow.setDate(newDate.getDate() + 1)  
             
             //let filter = {$and : [ { "labbookingDate" : {"$gt":yesterday }} ,{ "labbookingDate" : {"$lt":  tomorrow}} ]}  

             let filter ={$and : [ { "labbookingDate" : {"$gte":yesterday }} ,{ "labbookingDate" : {"$lt":  tomorrow}},{testLabArray:{$elemMatch:{"labId":req.body.labId}}}  ,
             {testLabArray:{$elemMatch:{"orderDetails.mainStatus":"Confirmed"}}} ]} 
             dlog("filter  for fetchLastMonthTillDateTestsCount API= "+JSON.stringify(filter)) 
             dlog("yesterday= "+yesterday) 
             dlog("tomorrow= "+tomorrow) 
            /* db.collection('lab_book_details').aggregate([{ $match:filter,
              $group: {
               totalAmount: { $sum: "$totalTestCost" } 
              } }
            ],function(err, result) {*/
              db.collection('lab_book_details').find(filter).toArray(function(err, labBookingsArry) {

              //  db.collection('lab_book_details').count(filter,function(err, result) {
                

            //  dlog("result =="+JSON.stringify(result))
            

                  if (err ) {
                    database.close();
                   resolve(0)
                   
                   }
                   if (!labBookingsArry || (labBookingsArry && labBookingsArry.length ==0)){
                    database.close(); 
                    resolve(0)                  
                  }
                 //  dlog("result =="+result)       
               /*  if(result ==undefined){
                  resolve(0)
                }else{
                  resolve(result)
                }
                */
                let count = 0;
               for(var i in labBookingsArry){
                  labBookingsArryObj = labBookingsArry[i]
                
                  for(var j in labBookingsArryObj.testLabArray ){
                    var testObj = labBookingsArryObj.testLabArray[j]                                               
                      if( testObj && testObj.orderDetails && testObj.orderDetails.mainStatus == "Confirmed"){

                      
                          count++
                      }
                  }                
                }
                resolve(count)
             });
         
        }));

    })
    Promise.all(promises).then(function(values) {
      dlog("values =="+JSON.stringify(values))
      
      database.close();    
      return res.json({
       status: true,
       message: ' fetchLastMonthTillDateTestsCount Success...',
       data: values             
     });
    })
  })


 
 });



app.post('/api/view-testcounts',function (req, res) {        
     dlog(" inside view-testcounts api  ")

     const errors = validationResult(req);
    if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
    }
    

    
    getTestCount(req,res)
   
  
   });

     
 
 
}
