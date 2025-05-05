var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Nahla_11",
  database: "fq"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "CREATE TABLE `users` (`id` MEDIUMINT(1) UNSIGNED NOT NULL AUTO_INCREMENT, `service_provider` VARCHAR(40) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, `email` VARCHAR(40) NOT NULL, `password` VARCHAR(255) NOT NULL, PRIMARY KEY (id), UNIQUE (email))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});

