
const {check, validationResult} = require('express-validator');
const Manualprescriptionupload = require('../../models/manual-prescription/manual-prescription-upload');
//const ManualprescriptionStatus = require('../../models/manual-prescription/manual-prescription-status');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var ObjectId = require('mongodb').ObjectID
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
  const main =  async (demographicFileName,inputCollection,whichfiles) => {
      try {
          if(demographicFileName && (whichfiles=="both" || whichfiles == "demographic")){
            dlog("demographicFileName :="+demographicFileName)

            fs.writeFile(demographicFileName, inputCollection.uploadPhotoManualPrescription,'base64', function(err) {
              if (err) 
                return common.handleError(err,'demographicFile could not be created ...',res,200)
                dlog("demographicFile created successfully with Node.js v10 fs/promises!");
        
             });
          }
      
    } catch (error){

       // console.error(error);
       return common.handleError(err,'FIle saving error...',res,500)       
    }
  }

const doFileProcessing =  (inputCollection,whichfiles)=>{
  if(process.env.ENVIRONMENT =="LOCAL"){
    inputCollection.fileFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
   }else{
    inputCollection.fileFirstPart="http://"+process.env.IPADDRESS
   }

   var staticImageDir = process.env.IMAGE_PATH
   
   const photoRandomString = Str.random(8)  
   dlog("photoRandomString ="+photoRandomString)


   let demographicFileNameSuf = "Manual_Prescription_"+photoRandomString
   let demographicFileName = staticImageDir + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT

   inputCollection.uploadPhotoManualPrescriptionURL = inputCollection.fileFirstPart + "/public/images/" + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT


   if(inputCollection.uploadPhotoManualPrescription){
     inputCollection.uploadPhotoManualPrescription = inputCollection.uploadPhotoManualPrescription.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
   }   


   createFiles(staticImageDir,demographicFileName,inputCollection,whichfiles)
   return inputCollection
}


const createFiles =  (staticImageDir,demographicFileName,inputCollection,whichfiles) => {




  fs.stat(staticImageDir, function(err) {
    if (!err) {
        dlog('Directory exists, where the images will go');
         main(demographicFileName,inputCollection,whichfiles)
        
    }
    else if (err.code === 'ENOENT') {
        dlog('Directory does not exist where the images should be saved');
        return common.handleError(err,'DB Insert Fail...',res,500)          
    }
  });
}


module.exports = function (app) {


/*
    *****************************************
    1. Patient Upload-Manual-Prescription
    *****************************************
*/
  app.post('/api/upload-manual-prescription', [ 
    
    check('prescriptionDate').not().isEmpty().trim(),
    check('doctorName').not().isEmpty().trim(),
   check('patientId').not().isEmpty().trim(),

   check('uploadPhotoManualPrescription').not().isEmpty().trim()

],function (req, res) {        
      dlog(" inside upload-Manual-Prescription api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }

      dlog("PatientId ="+req.body.patientId)

      var inputCollection = req.body

      if(inputCollection.prescriptionDate && inputCollection.prescriptionDate.trim() !=""){
        inputCollection.prescriptionDate = common.convertStringTodate(inputCollection.prescriptionDate)
       }

       const photoRandomString = Str.random(8)  
       dlog("photoRandomString ="+photoRandomString)
 
 
       let uploadedFileNameSuf = "Manual_Prescription_"+photoRandomString+"_"
       
    //  inputCollection =  doFileProcessing(inputCollection,"both")
    
    common.doFileProcessing(inputCollection,"Manual_Prescription",uploadedFileNameSuf,"uploadPhotoManualPrescription","uploadPhotoManualPrescriptionURL").then((result) => {
      inputCollection = result

     MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
      //   assert.equal(null, err);
          dlog("patientDBUrl Database connected successfully at post /manual-prescription")
          
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
      
          var db = database.db()             

          
          inputCollection.active = true
          //collection_json.appointmentDate = newDate.toISOString()//newDate
          inputCollection.createdDate = new Date()
          
          db.collection('manual-prescriptions').insertOne(inputCollection , function(error, response) {
        
            let manualPrescription =  response.ops[0]
            
            //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                              
            if (error) {
              return common.handleError(error,'DB Insert Fail...',res,500)           
            }

            if(manualPrescription){
              manualPrescription.uploadPhotoManualPrescription = ''
              manualPrescription.uploadPhotoManualPrescriptionURL = inputCollection.uploadPhotoManualPrescriptionURL              
            }
            
            return res.json({
              status: true,
              message: 'DB Insert Success...',
              data: manualPrescription
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

})

/*
    *****************************************
    1. Patient Manual-Prescription-status-edit
    *****************************************
*/



   app.post('/api/manual-prescription-status-edit', [
    check('manualprescriptionId').not().isEmpty().trim().escape(),
    check('status').not().isEmpty().trim().escape()
   
 ],function (req, res) {        
       dlog(" inside manual-prescription-status-edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
       var inputCollection = req.body
    
    
    
       try{
 
       //  prescription.findById(req.body.prescriptionId, function (err, prescription) {
      
         //  fielchange = result 
 
          const photoRandomString = Str.random(8)  
        dlog("photoRandomString ="+photoRandomString)
  
  
        let uploadedFileNameSuf = "Manual_Prescription_"+photoRandomString+"_"
        
     //  inputCollection =  doFileProcessing(inputCollection,"both")
     
     common.doFileProcessing(inputCollection,"Manual_Prescription",uploadedFileNameSuf,"uploadPhotoManualPrescription","uploadPhotoManualPrescriptionURL").then((result) => {
       inputCollection = result
 
 
         MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
           //   assert.equal(null, err);
                 dlog("prescriptionDB Database connected successfully at post /updateProfile")
              
                             
                 if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()  
                  let fields = {}
 
                  let fielchange={}
                 
                  if(result.uploadPhotoManualPrescriptionURL)
                   fielchange.uploadPhotoManualPrescriptionURL = result.uploadPhotoManualPrescriptionURL
 
                   if(result.uploadPhotoManualPrescription)
                     fielchange.uploadPhotoManualPrescription = result.uploadPhotoManualPrescription 
               
           
                     let filter = {_id : new ObjectId(req.body.manualprescriptionId)}
                    
                     if(req.body.status)
                    fielchange.validated = req.body.status
           
               
 
                  if(req.body.active ==false){
                   fielchange.active = false
                  }
                  if(req.body.active ==true){
                   fielchange.active = true
                  }
                   
                  fielchange.updatedDate = new Date()
                 
                  fielchange = {$set:fielchange}    
                  
                  dlog("fielchange == "+JSON.stringify(fielchange))             
                  db.collection('manual-prescriptions').findOne(filter,function(err, prescriptionRec) {
         
                     if (err ) {
                       database.close();
                      return  common.handleError(err, 'Error, in fetching prescription',res,500)   
                     }
                     
                     if (!prescriptionRec){
                       database.close();              
                       return  common.handleError(err, ' No prescription record found with the given prescription ID',res,500)   
                     }
 
                     db.collection('manual-prescriptions').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                       if (error) {
                         database.close(); 
                         return common.handleError(err, 'prescription password could not be updated',res,500)                    
                       }
                       let prescription = response.value                        
             
                       database.close();
                       return res.json({
                         status: true,
                         message: 'manual-prescriptions record update Success...',
                         data: prescription
                       });
                       
                     });
                  
                 });
                });
               } , (err) => {
                 let errMsg            
                 errMsg = err?err.message:""
                 return res.json({
                   status: false,
                   message: 'DB update fails...',
                   error: errMsg
                 });
               });
 
       }catch(error){
         //console.error(error)
         return  common.handleError(error, 'prescription password could not be updated',res,500)   
       
       }
 
 
 /*
       Manualprescriptionupload.findById(req.body.manualprescriptionId, function (err, manualprescription) {


     //dlog(manualprescriptionStatusRec.status)
         if (err || !manualprescription) return  common.handleError(err, 'No Manual prescription status record found with the given manualprescriptionStatusId',res,500)   
        
        if(req.body.status)
        manualprescription.validated = req.body.status
          
       
        manualprescription.save(function (err) {
          manualprescription.uploadPhotoManualPrescription = ''
            if (err) return common.handleError(err, 'Manual prescription status record could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'manualprescription validated true...',
              data: manualprescription
            });
         
          });
          
        });
  */
   
   });

   
   app.post('/api/fetchUploadedManualPrescriptionList',[
    check('patientId').not().isEmpty().trim().escape()
    ],function (req, res) {        
    dlog(" inside fetchUploadedManualPrescriptionList api  ")
    
    if( ObjectId.isValid(req.body.patientId)){

    let filter = {patientId : ObjectId(req.body.patientId).toString()}
    
    MongoClient.connect(mongoDB.patientDBUrl, function(err, database) {
    
     var db = database.db()     
     if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
       
     dlog(" inside fetchUploadedManualPrescriptionList api  step 2")
     
     db.collection('manual-prescriptions').find(filter).toArray(function(err, prescArry) {
         
         if (err ) return  common.handleError(err, 'Error, Erro fetching patient ',res,500)   
         if (!prescArry || (prescArry && prescArry.length ==0)){
           database.close();                  
           return  common.handleError(err, 'No prescriptions record found for the customer',res,500)   
         }
         dlog(" inside fetch-all-order-prescriptions-for-orders api  step 3")
         let prescArryNew = []
         prescArry.forEach(function(prescriptionObject, index){
    
          prescriptionObject.uploadPhotoManualPrescription = ''
          prescArryNew.push(prescriptionObject)
         })
         dlog(" inside fetchUploadedManualPrescriptionList api  step 4")
         database.close();                  
         return res.json({
           status: true,
           message: 'Prescription array retrieval success...',
           data : prescArryNew
           });              
       
       });
    
    });
    
  
  }else{
    return  common.handleError(err, 'wrong patiendID is being passed',res,500)  
  }
    
});  
}
