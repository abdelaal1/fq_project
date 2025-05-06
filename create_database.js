var mysql = require('mysql2');

var con = mysql.createConnection(process.env.JAWSDB_URL);

con.connect(function(err) {
  if (err) 
    throw err;
  console.log("Connected!");
  con.query("CREATE DATABASE fq", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });
});