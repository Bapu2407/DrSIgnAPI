
const {check, validationResult} = require('express-validator');


mongoDBInstance  = require('mongodb');
var mongoDB = require('../../databaseconstant');
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
var ObjectId = require('mongodb').ObjectID

module.exports = function (app) {

  app.post('/api/view-prescription', [    
    check('prescriptionId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-prescription api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
    
     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {        
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  

        dlog(" Database connected successfully at view-prescription")      
        let query = { _id:new ObjectId(req.body.prescriptionId)};
        db.collection('eprescription-opens').findOne(query,function(err, prescription) {
          if (err ) return  common.handleError(err, 'Error, No Invoice record found with the given month',res,500)   
          
          if (!prescription){
            database.close();         
            return  common.handleError(err, 'No prescription record found with the given prescriptionId in Patient DB',res,500)   
          }
          database.close();              
        
         return res.json({
          status: true,
          message: 'Prescription fetch successful',
          data: prescription
        });
         
        
        });
    
     });
 
       
   
   });

   app.post('/api/view-all-prescriptions', [    
    check('patientId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-all-invoices api  ")
 
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
     }
     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-prescriptions")
      
        let  filter = { patientId: ObjectId( req.body.patientId).toString()};
  
        db.collection('eprescription-opens').find(filter).toArray().then(function(prescriptionsArry) {
        //  let promises = [];
          if (err ) return  common.handleError(err, 'Error, No Prescription record found with the given patientId',res,500)   
          
          if (!prescriptionsArry || (prescriptionsArry && prescriptionsArry.length ==0) ){
            database.close();         
            return  common.handleError(err, 'No appointment record found with the given appointment id in Patient DB',res,500)   
          }
          getDoctorList(prescriptionsArry,res)
          /*          
          return res.json({
            status: true,
            message: 'Prescriptions fetch successful',
            data: prescriptionsArry
          });
          */
         })    
     });

   });


   app.post('/api/fetch-eprescription-doctor-details', [
    check('eprescriptionId').not().isEmpty().trim().escape()/*, 
check('doctorId').not().isEmpty().trim().escape(), 
    check('doctorName').not().isEmpty().trim().escape()*/
 ],function (req, res) {        
       dlog(" inside eprescription-doctor details edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       
       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        var db = database.db()     
      let filter  = {eprescriptionId: ObjectId(req.body.eprescriptionId).toString(),active: true}        
        db.collection('eprescription-doctor-details').findOne(filter,function(error, doctor) {

         console.log(" doctor == "+JSON.stringify(doctor))
          if (error ) {
              database.close(); 
          
              //return common.handleError(err, 'Error fetching patient record',res,500)                    
            }
            

          return res.json({
            status: true,
            message: 'eprescription doctor details edit Success...',
            data: doctor
          });
      });
    })
            
         
         
          
      
  
   
   });
  
}
const getDoctorList = async (prescriptionsArry,res) =>{
  prescriptionsArry = await getDoctorDetailsList(prescriptionsArry)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)
  
  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
    // database.close();                          
     return res.json({
       status: true,
       message: 'Prescriptions array retrieval successful.',
       data: prescriptionsArry
     });
  
}

const getDoctorDetailsList = async (prescriptionsArry) =>{
  let promises = []
  
  console.log(" prescriptionsArry == "+JSON.stringify(prescriptionsArry))

  prescriptionsArry.forEach(function(prescription, index){
       
    promises.push( new Promise(resolve => {     

      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          var db = database.db()     
        let filter  = {eprescriptionId: ObjectId(prescription._id).toString(),active: true}        

        console.log(" filter == "+JSON.stringify(filter))
          db.collection('eprescription-doctor-details').findOne(filter,function(error, doctor) {

           console.log(" doctor == "+JSON.stringify(doctor))
            if (error ) {
                database.close(); 
                resolve(prescription)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
            if (doctor && doctor != null ) {
              database.close();     
              prescription['doctorId'] =   doctor.doctorId
              prescription['doctorName'] =   doctor.doctorName
             // resolve(prescription)
            }        

            resolve(prescription)
        });
      })
        
      }));
    
    })
    
  return  Promise.all(promises)

}
