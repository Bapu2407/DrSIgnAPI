
const {check, validationResult} = require('express-validator');

const PracticeLocation = require('../../models/practice-location');
mongoDBInstance  = require('mongodb');
const Str = require('@supercharge/strings')
var mongoDB = require('../../databaseconstant');
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
var ObjectId = require('mongodb').ObjectID
var fs = require('fs');
const qrcode = require('qrcode');
var request = require('request');

var doctorAppDoctorFetchApiEndPoint =  "http://"+process.env.DOCTORAPPIPADDRESS+":"+process.env.DOCTORAPPPORT+"/api/send-message-to-doctor"
var patientAppFetchApiEndPoint =  "http://"+process.env.PATIENTAPPIPADDRESS+":"+process.env.PATIENTPORT+"/api/send-message-to-patient"



const getAppointmentCount = async (locationIdList,res) =>{
  let promises = []
  
  let filterAllRequests ={active : true }

    promises.push( new Promise(resolve => {     
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          var db = database.db()     
        db.collection('appointments').count(filterAllRequests,function(err, result) {
                  
          if (err ) {
            database.close();             
            resolve({totalAppointmentCount:0})
            console.error("Error while calculating totalAppointmentCount "+err)

          }
          database.close();             
          if(result ==undefined){
            resolve({totalAppointmentCount:0})            
          }else{          
            resolve({totalAppointmentCount:result})
          }           
    
        });
      })        
      }));
      
      let extra = "requested"
      let filterRequested ={$and : [ {status: new RegExp(["^", extra, "$"].join(""), "i")},{"locationId" : { $in : locationIdList} }]}  
      
      console.log("filterRequested"+JSON.stringify(filterRequested))

      promises.push( new Promise(resolve => {     
        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
            var db = database.db()     
          db.collection('appointments').count(filterRequested,function(err, result) {
                    
            if (err ) {
              database.close();             
              resolve({totalRequestedAppointmentCount:0})
              console.error("Error while calculating totalRequestedAppointmentCount "+err)
  
            }
            database.close();             
            if(result ==undefined){
              resolve({totalRequestedAppointmentCount:0})            
            }else{          
              resolve({totalRequestedAppointmentCount:result})
            }           
      
          });
        })        
        }));
        extra = "Confirm"
        let filterCOnfirmed ={$and : [ {status: new RegExp(["^", extra, "$"].join(""), "i")},{"locationId" : { $in : locationIdList} }]}  
        console.log("filterCOnfirmed"+JSON.stringify(filterCOnfirmed))
        promises.push( new Promise(resolve => {     
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              var db = database.db()     
            db.collection('appointments').count(filterCOnfirmed,function(err, result) {
                      
              if (err ) {
                database.close();             
                resolve({totalConfirmedAppointmentCount:0})
                console.error("Error while calculating totalConfirmedAppointmentCount "+err)
    
              }
              database.close();             
              if(result ==undefined){
                resolve({totalConfirmedAppointmentCount:0})            
              }else{          
                resolve({totalConfirmedAppointmentCount:result})
              }           
        
            });
          })        
          }));
          extra = "reject"
          let filterRejected ={$and : [ {status: new RegExp(["^", extra, "$"].join(""), "i")},{"locationId" : { $in : locationIdList} }]}  
        
          promises.push( new Promise(resolve => {     
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
                var db = database.db()     
              db.collection('appointments').count(filterRejected,function(err, result) {
                        
                if (err ) {
                  database.close();             
                  resolve({totalRejectedAppointmentCount:0})
                  console.error("Error while calculating totalRejectedAppointmentCount "+err)
      
                }
                database.close();             
                if(result ==undefined){
                  resolve({totalRejectedAppointmentCount:0})            
                }else{          
                  resolve({totalRejectedAppointmentCount:result})
                }           
          
              });
            })        
            }));
            extra = "reschedule"
            let filterRecheduled ={$and : [ {status: new RegExp(["^", extra, "$"].join(""), "i")},{"locationId" : { $in : locationIdList} }]}  
            
                  
            promises.push( new Promise(resolve => {     
              MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
                  var db = database.db()     
                db.collection('appointments').count(filterRecheduled,function(err, result) {
                          
                  if (err ) {
                    database.close();             
                    resolve({totalReschedulesAppointmentCount:0})
                    console.error("Error while calculating totalReschedulesAppointmentCount "+err)
        
                  }
                  database.close();             
                  if(result ==undefined){
                    resolve({totalReschedulesAppointmentCount:0})            
                  }else{          
                    resolve({totalReschedulesAppointmentCount:result})
                  }           
            
                });
        })        
        }));

     
        
    
    Promise.all(promises).then(function(valuesArray) {     

      let finalCountJson ={     
}
      dlog("valuesArray == "+JSON.stringify(valuesArray)) 
      
      valuesArray.forEach(function(values, index){          
         // let values = valuesArray[j]    
         dlog("values == "+JSON.stringify(values))     

         dlog("values['totalAppointmentCount'] == "+values['totalAppointmentCount'])     
         dlog("values['totalConfirmedAppointmentCount'] == "+values['totalConfirmedAppointmentCount'])     
         dlog("values['totalReschedulesAppointmentCount'] == "+values['totalReschedulesAppointmentCount'])     
         dlog("values['totalRejectedAppointmentCount'] == "+values['totalRejectedAppointmentCount'])  
            
          if( values['totalAppointmentCount'] != undefined){
              finalCountJson["totalAppointmentCount"] = values['totalAppointmentCount']
          }
          if( values['totalConfirmedAppointmentCount'] != undefined ){
            finalCountJson["totalConfirmedAppointmentCount"] = values['totalConfirmedAppointmentCount']
        }
        
          if( values["totalRejectedAppointmentCount"]  != undefined ){
            finalCountJson["totalRejectedAppointmentCount"] = values['totalRejectedAppointmentCount']
          }
          if( values['totalReschedulesAppointmentCount'] != undefined ){
            finalCountJson["totalReschedulesAppointmentCount"] = values['totalReschedulesAppointmentCount']
          }     
          if( values['totalRequestedAppointmentCount'] != undefined){
            finalCountJson["totalRequestedAppointmentCount"] = values['totalRequestedAppointmentCount']
          }    
         
      })
      //appointmentNewArray.push(values)

      dlog("finalCountJson == "+JSON.stringify(finalCountJson)) 

     
        return res.json({
          status: true,
          message: 'Appointment Counts.',
          data: finalCountJson
        });
    
     // database.close();                          
      
    })
  //});


}

function sendMsgToAllDoctorsof(locationArry,appointmentId){
  
  let arrayLen = locationArry.length
  dlog("arrayLen ="+arrayLen)

  locationArry.forEach(function(listItem, index){
    let doctorId  = listItem.doctorID
    
    let jsonBody = {
      "doctorId":doctorId,
      "message":"New appointment request has been created",
      "type":"appointment",
      "id":appointmentId
      }
  
      //dlog("jsonBody ="+JSON.stringify(jsonBody))
      request({
        url: doctorAppDoctorFetchApiEndPoint,
        method: 'POST',      
        headers: {
          'content-Type' :"application/json",    
          'accept':"application/json"
        },
        body: JSON.stringify(jsonBody)}
      , function(error, response, body) {
        if (error) { 
          console.log("push message can't be sent for new appointment request due to the following error "+error)
          return 
        }                               
      });
      

  })
}


function sendMsgToPatient(patientId,appointmentId,text){
  


    let jsonBody = {
      "patientId":patientId,
      "message":text,
      "type":"appointment",
      "id":appointmentId
      }
  
      //dlog("jsonBody ="+JSON.stringify(jsonBody))
      request({
        url: patientAppFetchApiEndPoint,
        method: 'POST',      
        headers: {
          'content-Type' :"application/json",    
          'accept':"application/json"
        },
        body: JSON.stringify(jsonBody)}
      , function(error, response, body) {
        if (error) { 
          console.log("push message can't be sent for new appointment request due to the following error "+error)
          return 
        }                               
      });
      

  
}


const sendpush = function(locationId,appointmentId,type){

  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    //   assert.equal(null, err);
        dlog("doctorDB Database connected successfully")
       
        var db = database.db()
        let filter = { _id:new ObjectId(locationId),active: true};
      db.collection('practice_locations').find(filter).toArray(function(err, locationArry) {
        
      if (err ) {       
       database.close();              
       console.log("push message can't be sent for new appointment request due to the following error "+err)
       return 
      }
      if (!locationArry || (locationArry && locationArry.length ==0)){
        database.close();              
        console.log("push message can't be sent for new appointment request as no location found with the give location id ")
        return 
      }

      database.close();              
      sendMsgToAllDoctorsof(locationArry,appointmentId)
    })
       
         });

}
async function generateQRCode(appointmentId,text) {
  const qrCodeImage = await qrcode.toDataURL(text)

 // fs.writeFileSync('./qr.html', `<img src="${res}">`);
 try {
let fileUrLFirstPart
  if(process.env.ENVIRONMENT =="LOCAL"){
    fileUrLFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
   }else{
    fileUrLFirstPart="http://"+process.env.IPADDRESS
   }
   var staticImageDir = process.env.IMAGE_PATH
   let fileName = staticImageDir + appointmentId+"_qrocode"+ "." + process.env.IMAGEFILEEXT 
   var fileURL = fileUrLFirstPart + "/public/images/" + appointmentId+"_qrocode"+ "." + process.env.IMAGEFILEEXT  
   
  qrCodeImage = qrCodeImage.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
  
  fs.writeFile(fileName, qrCodeImage, 'base64', function(err) {
    if (err) 
      return common.handleError(err,' qrCOde could not be save to file ...',res,200)
        dlog("fileName save successfully ");
      return fileURL
  });
  dlog("Qr Code :== "+res)
} catch (err) {
  //console.error(err)
}
  //console.log('Wrote to ./qr.html');
}

//const fsp = require("fs/promises");
module.exports = function (app) {

// from patient App April 28 2020 : START 

app.post('/api/raise-appointment-request',function (req, res) {        
    
  var dateString = req.body.appointmentDate//"23-04-2020"; 
  var dateParts = dateString.split("-");    
  // month is 0-based, that's why we need dataParts[1] - 1
  var newDate = common.convertStringTodate(req.body.appointmentDate) //new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
  //var newDate = new Date(dateParts[2], dateParts[1] - 1, --dateParts[0]);     
 // let  newDate= new Date(appointment.appointmentDate);
  dlog("newDate ="+newDate.toDateString())
  dlog("newDate toISOString="+newDate.toISOString())
  dlog("newDate toString ="+newDate.toString())
  
  let locationId = req.body.locationId
  dlog(" inside raise-appointment-request api ")
  let promises = []
  promises.push( new Promise(resolve => {                         
       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
   //   assert.equal(null, err);
       dlog("doctorDB Database connected successfully at post /dummy-appointment-request")
      
       var db = database.db()
        var collection_json = req.body      
        collection_json.active = true
        collection_json.createdDate = new Date()
        collection_json.appointmentDate = newDate//new Date(newDate.toISOString())// newDate

          db.collection('appointments').insertOne(collection_json , function(err, result) {
          //  assert.equal(err, null);
          if (err) {
            return common.handleError(err,'appointment record Insert Fail at doctorDB...',res,500)           
          }
          dlog("1 appointment inserted");
         
          dlog("1 appointment inserted in doctorDB == "+result.insertedId);
            
             //database.close();
             let query = { _id:new ObjectId(result.insertedId)};
             let fielchange={$set:{"requestId": result.insertedId,"appointmentId": result.insertedId}}
              
             let appointmentId = result.insertedId
             
            sendpush(locationId,appointmentId,"appointment")       
            sendMsgToPatient(collection_json.patientId, result.insertedId,"New Appointment request raised")     

              db.collection('appointments').findOneAndUpdate(query,fielchange ,{returnNewDocument:true}, function(err, updateDoc) {
                if (err) { dlog("appointment record can not be updated with request ID "); } ;	                  
                database.close();
                resolve("appointment record added in doctor DB");     
              });
          
          
        });
      
        });
      }))
/*      promises.push( new Promise(resolve => {                                 
        MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
      //   assert.equal(null, err);
            dlog("patientDB Database connected successfully at post /dummy-appointment-request")
         
             var db = database.db()         
             var collection_json = req.body
        
             collection_json.active = true
             //collection_json.appointmentDate = newDate.toISOString()//newDate
             collection_json.createdDate = new Date()
             collection_json.appointmentDate = newDate//new Date(newDate.toISOString())// newDate
             db.collection('appointments').insertOne(collection_json , function(err, result) {
             //  assert.equal(err, null);
             if (err) {
               return common.handleError(err,'appointment record Insert Fail at patientDB...',res,500)           
             }
             dlog("1 appointment inserted in patientDB == "+result.insertedId);
            
             let query = { _id:new ObjectId(result.insertedId)};
              let fielchange={$set:{"requestId": result.insertedId,"appointmentId": result.insertedId}}
              
              db.collection('appointments').findOneAndUpdate(query,fielchange ,{returnNewDocument:true}, function(err, updateDoc) {
                if (err) { dlog("appointment record can not be updated with request ID "); } ;	                  

                database.close();
                resolve("appointment record added in patient DB");     
              });            
             
           });
         
           });
    }))
    */
    Promise.all(promises).then(function(values) {
          
           return res.json({
            status: true,
            message: 'DB Insert Success...'              
          });
    })

 
 });



app.post('/api/view-allappointments-bypatient', [
  
  check('patientId').not().isEmpty().trim().escape()
],function (req, res) {        
     dlog(" inside view-appointment api  ")

     const errors = validationResult(req);
    if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
    }
    var patientId = req.body.patientId;
   

   try{       
   
    MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
      
      var db = database.db()     

      dlog("step1.1")
      if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

      dlog(" Database connected successfully at view-appointment-bypatient")

      let filter = { patientId:patientId,active: true};
      db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
        
      if (err ) return  common.handleError(err, 'Error, No Appointment record found with the given patientId',res,500)   
      if (!appointmentArry || (appointmentArry && appointmentArry.length ==0)){
        database.close();              
        return  common.handleError(err, 'No Appointment record found with the given locationId in Patient DB',res,500)   
      }

      database.close();              
      
      return res.json({
        status: true,
        message: 'Appointments retrieval by locationId successful.',
        data: appointmentArry
      });
        

      });
    });
  }catch(error){
    //console.error(error)
    return  common.handleError(error, 'Error retrieving AppointmentPatientApp  record',res,500)   
  
  }  
 
 });


app.post('/api/view-appointment-bydate', [
  check('patientId').not().isEmpty().trim().escape(),
  check('selectedDate').not().isEmpty().trim().escape()
 ], function (req, res) {        
  dlog(" inside get view-appointment-bydate api   ")

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)   
  }
 // ISODate(selectedDate)
 let selectedDate = req.body.selectedDate

 
 var dateString = selectedDate
 var dateParts = dateString.split("-");    
 // month is 0-based, that's why we need dataParts[1] - 1
 var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
 //var newDate = new Date(dateParts[2]+"-"+ dateParts[1] - 1+"-"+ ++dateParts[0]);     
// let  newDate= new Date(appointment.appointmentDate);
 dlog("newDate ="+newDate.toDateString())
 dlog("newDate toISOString="+newDate.toISOString())
 dlog("newDate toString ="+newDate.toString())
 dlog("selectedDate =="+selectedDate);
  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
      
        var db = database.db()     

        dlog("step1.1")
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

        dlog(" Database connected successfully at updateAppointmentPatientDB")
        //const yesterday = new Date(newDate)
        const yesterday = new Date(new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0],0, 0, 0))
        yesterday.setDate(newDate.getDate())
        const tomorrow = new Date(newDate)
        tomorrow.setDate(newDate.getDate() + 1)
        // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
        //let filter = { patientId:req.body.patientId ,appointmentDate : {"$eq": newDate}} 


        let filter = {$and : [  {patientId:req.body.patientId }, { "appointmentDate" : {"$gte":yesterday }} ,{ "appointmentDate" : {"$lt":  tomorrow}} ]} 

        console.log("filter == "+JSON.stringify(filter))

        db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
          
        if (err ) return  common.handleError(err, 'Error, No Appointment record found with the given month',res,500)   
        if (!appointmentArry || (appointmentArry && appointmentArry.length ==0)){
          database.close();              
          return  common.handleError(err, 'No Appointment record found with the given appointment id in Patient DB',res,500)   
        }

        database.close();              
        
        return res.json({
          status: true,
          message: 'Appointments retrieval by date successful.',
          data: appointmentArry
        });
          

        });
  
   });
   

 
  
});



app.post('/api/modify-appointment-field', [
  check('tableName').not().isEmpty().trim().escape()
 ], function (req, res) {        
  dlog(" inside get view-appointment-bydate api   ")

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)   
  }

 var newDate = new Date()//(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     

 dlog("newDate ="+newDate.toDateString())
 dlog("newDate toISOString="+newDate.toISOString())
 dlog("newDate toString ="+newDate.toString())
// dlog("selectedDate =="+selectedDate);
  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
      
        var db = database.db()     

        dlog("step1.1")
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

        dlog(" Database connected successfully at updateAppointment ")

        // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
        let filter = { "appointmentDate" : {"$gte": newDate}} 
        let tableName = req.body.tableName
        
        let fieldchange={$set:{active: true,createdDate:newDate}}

        
        db.collection(tableName).updateMany(filter,fieldchange,{multi: true },function(err, response) {
          
        if (err ) return  common.handleError(err, 'Error, No Appointment record found with the given month',res,500)   
        if (!response){
          database.close();              
          return  common.handleError(err, 'No Appointment record found with the given appointment id in Patient DB',res,500)   
        }
       
        database.close();  
        return res.json({
          status: true,
          message: 'Table update successful.'
          
        });
          

        });
  
   });
    


 
  
});

app.post('/api/view-tokens-upcoming-appointments', [
  check('patientId').not().isEmpty().trim().escape()
 ], function (req, res) {        
  dlog(" inside get view-appointment-bydate api   ")

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)   
  }
 // ISODate(selectedDate)
// let selectedDate = req.body.selectedDate

 
// var dateString = selectedDate
// var dateParts = dateString.split("-");    
 // month is 0-based, that's why we need dataParts[1] - 1
 var newDate = new Date()//(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
 //var newDate = new Date(dateParts[2]+"-"+ dateParts[1] - 1+"-"+ ++dateParts[0]);     
// let  newDate= new Date(appointment.appointmentDate);
 dlog("newDate ="+newDate.toDateString())
 dlog("newDate toISOString="+newDate.toISOString())
 dlog("newDate toString ="+newDate.toString())
// dlog("selectedDate =="+selectedDate);
  MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
      
        var db = database.db()     

        dlog("step1.1")
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

        dlog(" Database connected successfully at updateAppointmentPatientDB")

        // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
        let filter = { patientId:req.body.patientId ,"appointmentDate" : {"$gte": newDate}} 
        db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
          
        if (err ) return  common.handleError(err, 'Error, No Appointment record found with the given month',res,500)   
        if (!appointmentArry || (appointmentArry && appointmentArry.length ==0)){
          database.close();              
          return  common.handleError(err, 'No Appointment record found with the given appointment id in Patient DB',res,500)   
        }
        var tokenList = []        
        for( var i in appointmentArry){  
          let appointment = appointmentArry[i]
          if(!tokenList.includes(appointment['tokenId']) && appointment['tokenId'] != null ){
            tokenList.push(appointment['tokenId'])
          }            
        }
        database.close();  
        return res.json({
          status: true,
          message: 'Token List retrieval by date successful.',
          data: tokenList
        });
          

        });
  
   });
    


 
  
});


//// TILL THIS LINE CAME FROM patient App ON ACCOUNT OF CODE MERGING ON April 28 2020 : END END END 


  app.post('/api/view-appointment', [
    
   check('appointmentId').not().isEmpty().trim().escape()
],function (req, res) {        
      dlog(" inside view-appointment api  ")

      const errors = validationResult(req);
     if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)
     }
     var appointmentId = req.body.appointmentId;
     //dlog("id ="+id)

     let filter = { appointmentId:new ObjectId(appointmentId),active: true};

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
      var db = database.db()     

      dlog("step1.1")
      if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

      dlog(" Database connected successfully at view-appointment-bylocation")

      // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
      //let filter = { patientId:req.body.patientId ,"appointmentDate" : {"$eq": newDate}} 
      
      db.collection('appointments').findOne(filter,function(err, appointment) {
        
      if (err ) return  common.handleError(err, 'Error, No Appointment record found with the given appointmentId',res,500)   
      if (!appointment){
        database.close();              
        return  common.handleError(err, 'No Appointment record found with the given appointmentId in Patient DB',res,500)   
      }

      database.close();              
      
      return res.json({
        status: true,
        message: 'Appointment retrieval by appointmentId successful.',
        data: appointment
      });
        

      });
    });

  
  });

  app.post('/api/view-appointment-bylocation', [
    check('locationId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get view-appointment-bylocation api  by locationId ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    //let filter = { locationId:  req.body.locationId};
    try{       
     
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
  
        dlog("step1.1")
        if (err ) return  common.handleError(err, 'No DB connection could be made to DB',res,500)  
  
        dlog(" Database connected successfully at view-appointment-bylocation")
  
        // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
        //let filter = { patientId:req.body.patientId ,"appointmentDate" : {"$eq": newDate}} 
        let filter = { locationId:  req.body.locationId,active: true};
        db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
          
        if (err ) {
          database.close();      
          return  common.handleError(err, 'Error, No Appointment record found with the given locationId',res,500)   
        }
        if (!appointmentArry || (appointmentArry && appointmentArry.length ==0)){
          database.close();              
          return  common.handleError(err, 'No Appointment record found with the given locationId in Patient DB',res,500)   
        }
  
        database.close();              
        
        return res.json({
          status: true,
          message: 'Appointments retrieval by locationId successful.',
          data: appointmentArry
        });
          
  
        });
      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving AppointmentPatientApp  record',res,500)   
    
    }     
    
  });

  app.post('/api/appointmentList-bystatus', [
    check('status').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get view-appointment-status api  by locationId ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    //let filter = { locationId:  req.body.locationId};
    try{       
     
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
  
        dlog("step1.1")
        if (err ) return  common.handleError(err, 'No DB connection could be made to DB',res,500)  
  
        dlog(" Database connected successfully at view-appointment-bylocation")
  
        // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
        //let filter = { patientId:req.body.patientId ,"appointmentDate" : {"$eq": newDate}} 
        //let filter = { status:  req.body.status,active: true};
        let filter ={$and : [ {status: new RegExp(["^", req.body.status, "$"].join(""), "i")},{active: true}]}  

        db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
          
        if (err ) {
          database.close();      
          return  common.handleError(err, 'Error, No Appointment record found with the given locationId',res,500)   
        }
        if (!appointmentArry || (appointmentArry && appointmentArry.length ==0)){
          database.close();              
          return  common.handleError(err, 'No Appointment record found with the given status in Patient DB',res,500)   
        }
  
        database.close();              
        
        return res.json({
          status: true,
          message: 'Appointments retrieval by status successful.',
          data: appointmentArry
        });
          
  
        });
      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving AppointmentPatientApp  record',res,500)   
    
    }     
    
  });

  app.post('/api/calendar-appointments', [
    check('doctorId').not().isEmpty().trim().escape(),
    check('month').not().isEmpty().trim().escape()
 ],function (req, res) {        
       dlog(" inside calendar-appointments api  ")
 
       const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
      
      dlog("month ="+req.body.month)
 
     // var appointmentId ="Sample-appointment1235"
    
     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
      var db = database.db()     

      dlog("step1.1")
        if (err ) {
          database.close();      
          return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        }
        
      dlog(" Database connected successfully at updateAppointmentPatientDB")
      let filterPracticeLocation = { doctorID:  req.body.doctorId};
          
      PracticeLocation.find(filterPracticeLocation, function (err, practiceLocationArray) {
        if (err || !practiceLocationArray || (practiceLocationArray && practiceLocationArray.length ==0)) return  common.handleError(err, 'No Practice location record found with the given doctor ID',res,500)   
        var locationIdList = []        
        
        for( var i in practiceLocationArray){
          let practiceLocation = practiceLocationArray[i]
          if(!locationIdList.includes(practiceLocation['_id']) && practiceLocation['_id'] !=null){
            locationIdList.push(ObjectId(practiceLocation['_id']).toString())
          }
          
        }   
        //dlog("locationIdList == "+JSON.stringify(locationIdList))
        let filter ={$and : [ { "$expr": { "$eq": [{ "$month": "$appointmentDate" }, parseInt(req.body.month)] }},{"locationId" : { $in : locationIdList} }]}      
        dlog("filter == "+JSON.stringify(filter))

        db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
          
            if (err) {
                database.close();      
                return  common.handleError(err, 'Error, in fetching Appointment',res,500)   
            }
            if (!appointmentArry){
                database.close();
              
                return  common.handleError(err, 'No Appointment   record found with the given appointment id in Patient DB',res,500)   
            }

            database.close();              
            // res.json(appointmentArry)
            return res.json({
              status: true,
              message: 'Appointment retrival success for the given month...',
              data: appointmentArry
            });
                    
        });
     
     
      });

     
    
     });
 
       
   
   });

   
  app.post('/api/create-token', [
    
    check('appointmentId').not().isEmpty().trim().escape()
 ],function (req, res) {        
       dlog(" inside create-token api  ")
 
       const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
      var appointmentId = req.body.appointmentId;
      
      let filter = { appointmentId:appointmentId};

       const token = Str.random(10)  
       dlog("token ID ="+token)

     
      // generateQRCode(appointmentId,token).catch(error => console.error(error.stack));

       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     

          if (err )  return  common.handleError(err, 'No DB connection could be made to doctor DB',res,500)  
          
          dlog("doctor Database connected successfully at updateAppointmentPatientDB")
        
          let filter = { appointmentId:  new ObjectId(req.body.appointmentId)};
        
        
         
          db.collection('appointments').findOne(filter,function(err, appointment) {

            dlog("step1.2")

            if (err )  {
              database.close();      
              return  common.handleError(err, 'No Appointment record found with the given appointment id in doctor DB',res,500)   
            }
         
            if (!appointment){
              database.close();
              dlog("step1.3 inside error")
             return  common.handleError(err, 'No Appointment record found with the given appointment id in doctor DB',res,500)   
            }

            sendMsgToPatient(appointment.patientId, appointment.appointmentId,"Token created ") 

            qrcode.toDataURL(token).then(qrCodeImage => {
              // console.log(url)
               let fileUrLFirstPart
              if(process.env.ENVIRONMENT =="LOCAL"){
                fileUrLFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
              }else{
                fileUrLFirstPart="http://"+process.env.IPADDRESS
              }
              var staticImageDir = process.env.IMAGE_PATH
              let fileName = staticImageDir + appointmentId+"_qrocode"+ "." + process.env.IMAGEFILEEXT 
              var fileURL = fileUrLFirstPart + "/public/images/" + appointmentId+"_qrocode"+ "." + process.env.IMAGEFILEEXT  
              qrCodeImage = qrCodeImage.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
              
              fs.writeFile(fileName, qrCodeImage, 'base64', function(err) {
                if (err) 
                  return common.handleError(err,' qrCOde could not be save to file ...',res,200)
                    dlog("fileName save successfully ");
                  return fileURL
              });
              dlog("Qr Code :== "+res)
              let fieldchange={$set:{tokenId: token,qrCodeURL:fileURL}}
              db.collection('appointments').updateOne(filter,fieldchange ,{returnNewDocument:true}, function(err, appointment) {
                if(err)   common.handleError(err, 'No Appointment   record found with the given appointment id in doctor DB',res,500)   
  
                database.close();
                //res.json({tokenId: token})
                return res.json({
                  status: true,
                  message: 'create-token Success...',
                  data: {tokenId: token,qrCodeURL:fileURL}
                });
  
                });

            })
            .catch(err => {
             common.handleError(err,' qrCOde could not be generated ...',res,200)
                    dlog("fileName could not be saved ");
            })
      
        
           
          
          });
      
       });
 
 
 
       
   
   });
  app.post('/api/update-appointment', [
    check('appointmentId').not().isEmpty().trim().escape()
    //check('status').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get update-appointment api by doctorID ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
   let status  = req.body.status

    let  updateData = { appointmentId :  req.body.appointmentId,  status: status, appointmentDate:  req.body.appointmentDate?common.convertStringTodate(req.body.appointmentDate):'',appointmentTime:  req.body.appointmentTime?req.body.appointmentTime:'',calendar:req.body.calendar?req.body.calendar:false};

    if(req.body.active ==false){
      updateData.active = false
     }
     if(req.body.active ==true){
      updateData.active = true
     } 
     
     
     if(req.body.locationId && req.body.locationId.trim() !=""){
      updateData.locationId =  req.body.locationId
    }

    if(req.body.doctorId && req.body.doctorId.trim() !=""){
      updateData.doctorId =  req.body.doctorId
    }

    if(req.body.appointmentType && req.body.appointmentType.trim() !=""){
      updateData.appointmentType =  req.body.appointmentType
    }
    

    if(req.body.patientId && req.body.patientId.trim() !=""){
      updateData.patientId =  req.body.patientId
    }



    try{       
      runAppointmentUpdate(updateData,res)     
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving AppointmentPatientApp record',res,500)   
    
    }     
    
  });

  app.post('/api/view-appointmentcounts', [
    check('doctorId').not().isEmpty().trim().escape()
 ],function (req, res) {        
       dlog(" inside calendar-appointmentsview-appointmentcounts api  ")
 
       const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
      
      dlog(" Database connected successfully at updateAppointmentPatientDB")
      let filterPracticeLocation = { doctorID:  req.body.doctorId};
          
      PracticeLocation.find(filterPracticeLocation, function (err, practiceLocationArray) {
        if (err || !practiceLocationArray || (practiceLocationArray && practiceLocationArray.length ==0)) return  common.handleError(err, 'No Practice location record found with the given doctor ID',res,500)   
        var locationIdList = []        
        
        for( var i in practiceLocationArray){
          let practiceLocation = practiceLocationArray[i]
          if(!locationIdList.includes(practiceLocation['_id']) && practiceLocation['_id'] !=null){
            locationIdList.push(ObjectId(practiceLocation['_id']).toString())
          }
          
        }   
      
      getAppointmentCount(locationIdList,res)
     
    
     });
 
       
   
   });
   app.post('/api/view-upcoming-appointments', [
    check('patientId').not().isEmpty().trim().escape(),
    check('month').not().isEmpty().trim().escape(),
    check('year').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get view-upcoming-appointments api   ")
    
    dlog("month ="+req.body.month)
   
    dlog("year ="+req.body.year)
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

  // dlog("selectedDate =="+selectedDate);
    MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
          var db = database.db()     
  
          dlog("step1.1")
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
  
          dlog(" Database connected successfully at updateAppointmentPatientDB")
  
          // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
          //let filter = { patientId:req.body.patientId ,"appointmentDate" : {"$gte": newDate}} 

          let filter ={$and : [ { "$expr": { "$eq": [{ "$month": "$appointmentDate" }, parseInt(req.body.month)] }},
          { "$expr": { "$eq": [{ "$year": "$appointmentDate" }, parseInt(req.body.year)] }},
           {patientId:ObjectId(req.body.patientId).toString()}]}      
        dlog("filter == "+JSON.stringify(filter))

          db.collection('appointments').find(filter).toArray(function(err, appointmentArry) {
            
          if (err ) return  common.handleError(err, 'Error, No Appointment record found with the given month',res,500)   
          if (!appointmentArry || (appointmentArry && appointmentArry.length ==0)){
            database.close();              
            return  common.handleError(err, 'No Appointment record found with the given appointment id in Patient DB',res,500)   
          }
         
          database.close();  
          return res.json({
            status: true,
            message: 'Upcoming appointmentArry retrieval by date successful.',
            data: appointmentArry
          });
            
  
          });
    
     });
      
  
  
   
    
  });
  
  
  
  

  
}

const runAppointmentUpdate = async (data,res) => {

  var sessionConPatientDB = await mongoDBInstance.connect(mongoDB.patientDBUrl)
 // var sessionPatientDB = sessionConPatientDB.startSession()
 // sessionPatientDB.startTransaction();
  var sessionConDoctorDB = await mongoDBInstance.connect(mongoDB.doctorDBUrl)
  var sessionDoctorDB = sessionConDoctorDB.startSession()
  sessionDoctorDB.startTransaction();

  try{       
     
    dlog("step1")
   // await updateAppointmentPatientDB(data,res)
    dlog("step2")
    await updateAppointmentDoctorDB(data,res)
    dlog("step3")

    
    await sessionDoctorDB.commitTransaction();
    sessionDoctorDB.endSession();
   // await sessionPatientDB.commitTransaction();
    //sessionPatientDB.endSession();
    
    return res.json({
      status: true,
      message: 'Appointment record at the DBs updated Successfully!'
    });

  }catch(error){    
    if(error){
    
      await sessionDoctorDB.abortTransaction();
      sessionDoctorDB.endSession();
    //  await sessionPatientDB.abortTransaction();
    //  sessionPatientDB.endSession();
/*
      if(error.from == "patient"){
            
       return  common.handleError(error.err, error.msg,res,500)         
      }
*/
      if(error.from == "doctor"){
        
        return  common.handleError(error.err, error.msg,res,500)  
       }
    } 
  
  }     
  
}
/*
const updateAppointmentPatientDB = (data,res) =>
  new Promise((resolve, reject) => {
   
    console.log("^^^^^^mongoDB.patientDBUrl^^^^^^^^^^ =="+mongoDB.patientDBUrl)
      MongoClient.connect(mongoDB.patientDBUrl,{ useNewUrlParser: true }, function(err, database) {
        
        var db = database.db()     

        dlog("step1.1")
          if (err )  reject({error:err,data:appointment,from:"patient",msg:'No DB connection could be made to patient DB'}) //return  common.handleError(err, 'No DB connection could be made to patient DB',res,500)  
          
          dlog("patientDB Database connected successfully at updateAppointmentPatientDB")
        
          let filter = { appointmentId:  new ObjectId(data.appointmentId)};
          let fielchange={}//{$set:{status: data.status}}
        
          if(data.status && data.status.trim() !=""){
            fielchange.status =  data.status
          }

          
         if(data.appointmentDate && data.appointmentDate !=""){
          fielchange.appointmentDate =  data.appointmentDate
        }
        if(data.appointmentTime && data.appointmentTime.trim() !=""){
          fielchange.appointmentTime =  data.appointmentTime
        }
          if(data.active ==false){
            fielchange.active = false
           }
           if(data.active ==true){
            fielchange.active = true
           }                   

          let calendar = data.calendar
          if(data.status == "Reschedule" || calendar){
         
            fielchange.status =  data.status
            fielchange.appointmentDate = data.appointmentDate
            fielchange.appointmentTime = data.appointmentTime
            fielchange.calendar = data.calendar?data.calendar:false

          }

          fielchange.updatedDate = new Date()

          fielchange = {$set:fielchange}    

          
        //  db.collection('appointments').findOneAndUpdate(filter,fieldchange ,{returnNewDocument:true}, function(err, appointment) {
          db.collection('appointments').findOne(filter,function(err, appointment) {

            dlog("step1.2")

            if (err ){
              database.close();      
             reject({error:err,data:appointment,from:"patient",msg:'No Appointment record found with the given appointment id in Patient DB'}) //return  common.handleError(err, 'No Appointment   record found with the given appointment id in Patient DB',res,500)   
            }
            if (!appointment){
              database.close();
              dlog("step1.3 inside error")
           //   return  common.handleError(err, 'No Appointment   record found with the given appointment id in Patient DB',res,500)   

             reject({error:err,data:appointment,from:"patient",msg:'No Appointment   record found with the given appointment id in Patient DB'})

            //  reject({error:err,data:appointment,from:"patient"})
            }

            db.collection('appointments').updateOne(filter,fielchange ,{returnNewDocument:true}, function(err, appointment) {
              if(err)  reject({error:err,data:appointment,from:"patient"})
              database.close();
              resolve(appointment)
              });
           
          
          });
      
       });
})
*/
const updateAppointmentDoctorDB = (data,res) =>
  new Promise((resolve, reject) => {
    
      MongoClient.connect(mongoDB.doctorDBUrl, { useNewUrlParser: true },function(err, database) {
 
        var db = database.db()     

         if (err )  reject({error:err,data:appointment,from:"doctor",msg:'No DB connection could be made to doctor DB'})  //return  common.handleError(err, 'No DB connection could be made to doctor DB',res,500)  

          dlog("Doctor DB Database connected successfully at updateAppointment DOCTORDB")
          
          let filter = { appointmentId: new ObjectId(data.appointmentId)};
          /*let fieldchange={$set:{status: data.status}}
          let calendar = data.calendar
          if(data.status == "Reschedule" || calendar){
           fieldchange={$set:{status: data.status,appointmentDate:data.appointmentDate,appointmentTime:data.appointmentTime,calendar:data.calendar?data.calendar:false}}
          }
          */
         let fielchange={}//{$set:{status: data.status}}
        
         if(data.status && data.status.trim() !=""){
           fielchange.status =  data.status
         }

         if(data.appointmentDate && data.appointmentDate !=""){
          fielchange.appointmentDate =  data.appointmentDate
        }
        if(data.appointmentTime && data.appointmentTime.trim() !=""){
          fielchange.appointmentTime =  data.appointmentTime
        }

        if(data.locationId && data.locationId.trim() !=""){
          fielchange.locationId =  data.locationId
        }

        if(data.patientId && data.patientId.trim() !=""){
          fielchange.patientId =  data.patientId
        }
        if(data.doctorId && data.doctorId.trim() !=""){
          fielchange.doctorId =  data.doctorId
        }
        
        if(data.appointmentType && data.appointmentType.trim() !=""){
          fielchange.appointmentType =  data.appointmentType
        }


         if(data.active ==false){
           fielchange.active = false
          }
          if(data.active ==true){
           fielchange.active = true
          }
         
         

         let calendar = data.calendar
         if(data.status == "Reschedule" || calendar){
           /*  fieldchange={$set:{status: data.status,appointmentDate:data.appointmentDate,appointmentTime:data.appointmentTime,calendar:data.calendar?data.calendar:false}}            */
           fielchange.status =  data.status
           fielchange.appointmentDate = data.appointmentDate
           fielchange.appointmentTime = data.appointmentTime
           fielchange.calendar = data.calendar?data.calendar:false
         }

         fielchange.updatedDate = new Date()

         fielchange = {$set:fielchange}    

                
          //db.collection('appointments').findOneAndUpdate(filter,fieldchange ,{returnNewDocument:true}, function(err, appointment) {
            db.collection('appointments').findOne(filter,function(err, appointment) {
          //  if (err ) return  common.handleError(err, 'No Appointment   record found with the given appointment id in Doctor DB',res,500)   
           if (err ) reject({error:err,data:appointment,from:"patient",msg:'No Appointment   record found with the given appointment id in Doctor DB'}) 
            if (!appointment){
              database.close();
            //  return  common.handleError(err, 'No Appointment   record found with the given appointment id in Doctor DB',res,500)   
            reject({error:null,data:appointment,from:"patient",msg:'No Appointment   record found with the given appointment id in Doctor DB'})

              //reject({error:err,data:appointment,from:"doctor"})
            }
           if(appointment && appointment.patientId){
             sendMsgToPatient(appointment.patientId, appointment.appointmentId,"New Appointment status changed")
           }
           /* else{
              resolve(appointment)
            }  
*/
            db.collection('appointments').updateOne(filter,fielchange ,{returnNewDocument:true}, function(err, appointment) {
              if(err)  reject({error:err,data:appointment,from:"doctor"})
              database.close();
              resolve(appointment)
              });
          });
      
       });
})