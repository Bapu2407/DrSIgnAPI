module.exports = {
   
    MongoClient : require('mongodb'),    
     ObjectId : require('mongodb').ObjectID,
     
     doctorDBUrl :  process.env.DB_URL || 'mongodb://localhost:27017/doctorSignetDb',
     patientDBUrl : process.env.PATIENT_DB_URL ||  'mongodb://localhost:27017/patientDb'
};
