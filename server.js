const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const querystring = require("querystring")
const bcrypt = require("bcryptjs")
const crypto = require("crypto-js")
const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')
const mysql = require('mysql2')
const http = require('http')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const QRCode = require('qrcode')

const publicDirectoryPath = path.join(__dirname, '/public')
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ghoneim0061@gmail.com',
    pass: 'ayqa txso anfl bicy'
  }
})

const register = fs.readFileSync("register.html")
const index = fs.readFileSync("index.html")
const get_to_post1 = fs.readFileSync("get_to_post1.html")
const get_to_post2 = fs.readFileSync("get_to_post2.html")
const reset1 = fs.readFileSync("reset1.html")
const help1 = fs.readFileSync("help1.html")
const help = fs.readFileSync("help.html")

var clients = []
var db = []

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())
app.use(express.static(publicDirectoryPath))
app.set('view engine', 'hbs')

function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  next()
}

app.use(['/admin_dashboard.html', 'get_to_post1.html', 'get_to_post2.html'], noCache);

setInterval(function() {
	clients.forEach(function(client) {
	client.write(":ping\n")
			})
}, 20000)

app.get('', (req, res) => {
	if (typeof (req.cookies.auth_jwt) == 'undefined') { 	
	  res.writeHead(200, {"Content-Type": "text/html"})
		res.write(index)
		res.end()
	}
	else{
		res.redirect('https://lit-lowlands-82854-b48a400450f7.herokuapp.com/admin_dashboard.html?lang=ar')
	}	
})

app.get('/index.html', (req, res) => {
	if (typeof (req.cookies.auth_jwt) == 'undefined') {
	res.clearCookie('auth_jwt') 	
	  res.writeHead(200, {"Content-Type": "text/html"})
		res.write(index)
		res.end()
	}
	else{
		res.redirect('https://lit-lowlands-82854-b48a400450f7.herokuapp.com/admin_dashboard.html?lang=ar')
	}	
})

app.get('/register.html', (req, res) => {
	res.writeHead(200, {"Content-Type": "text/html"})
 	res.write(register)
 	res.end()
})

app.get('/check_email_existence', (req, res) => {
	const email = req.query.email
	const con = mysql.createConnection(process.env.JAWSDB_URL)
	con.connect(function(err) {
		if (err){
	  	res.send('{"res":"Error establishing a database connection. Please <a href=\'register.html\'>try again.</a>"}')
		 	return
		} 		  
		const sql = "select id from users where email=?"
		  con.query(sql, [email], function (err, result) {
		    	if (err) {
				 		res.send('{"res":"Error validating email. Please <a href=\'register.html\'>try again.</a>"}')
				 		return
    			} 
    			if(result.length >= 1) {
				 		res.send('{"res":"Email already exists. Please <a href=\'register.html\'>try again.</a>"}')
				 		return				 	
  				}
  				if(result.length == 0) {
  					res.send('{"res":"email does not exist"}')
  				}
		  })
	})
})

app.post('/email1', async (req, res) => {	
	const service_provider = req.body.service_provider
	const email = req.body.email
	const password = req.body.password
	const hashedpassword = await bcrypt.hash(password, 8)
	const key = 'cfd87hgfc0uewcfd32ojnbt569uhbaplr'
	const token = jwt.sign({email: email}, key, { expiresIn: '1h' })
	const urlencoded = 'https://lit-lowlands-82854-b48a400450f7.herokuapp.com/get_to_post1#service_provider='+encodeURIComponent(service_provider)+'&email='+encodeURIComponent(email)+'&hashedpassword='+encodeURIComponent(hashedpassword)+'&token='+encodeURIComponent(token)	
	const mailOptions = {
		from: '"Follow Queue"ghoneim0061@gmail.com',
		to: email,
		subject: 'Complete registeration',
		html: "Please click<a href="+urlencoded+"> here</a> to complete registeration"
	}
	transporter.sendMail(mailOptions, function(error, info){
    if (error) {
		 	res.send("There was a problem sending you a verification link. Please <a href='register.html'>try again.")
		 	return
    } 
    else {
		 	res.send("Please click the verification link we have sent to your email to complete your registeration. If it does not show up in a few minutes, check your spam folder. The verification token expires after one hour.")
  	}
	})
})

app.post('/add_user', (req, res) => {
	const service_provider = decodeURIComponent(req.body.service_provider)
	const email = decodeURIComponent(req.body.email)
	const hashedpassword = decodeURIComponent(req.body.hashedpassword)
	const token = decodeURIComponent(req.body.token)
	const key = 'cfd87hgfc0uewcfd32ojnbt569uhbaplr'
	try {
    const payload = jwt.verify(token, key);
    var con = mysql.createConnection(process.env.JAWSDB_URL)
		con.connect(function(err) {
			if (err){
			  res.send("Error establishing a database connection. Please click the verification link again.")
			 	return
			} 
		  
		  var sql = "INSERT INTO users (service_provider, email, password) VALUES (?,?,?)"
		  con.query(sql, [service_provider,email,hashedpassword], function (err, result) {
			  if (err) {
				 	res.send("Error adding user. Please click the verification link again.")
				 	return
	    	} 
	    	else {
				 	res.send("<h4><span style='color: green; font-size: 85%'>&#10004; </span>Registration completed successfully.</h4>Click <a href = 'index.html'>here</a> to login.")
	  		}
		  })
		})
  } 
  catch (err) {
    res.status(400).send('Invalid or expired verification token. Please <a href="register.html">try again</a>');
  }
})

app.get('/check_login_information', async (req, res) => {
	const email = req.query.email
	const password = req.query.password
	const con = mysql.createConnection(process.env.JAWSDB_URL)
	con.connect(async function(err) {
		if (err){
	  	res.send('{"res":"Error establishing a database connection. Please try again."}')
		 	return
		} 		  
		var sql = "select id,service_provider,password from users where email=?"
		con.query(sql, [email], async function (err, result) {
		  if (err) {
			res.send('{"res":"Error validating login information. Please try again."}')
			return
    	} 
    	if(result.length >= 1) {
    		const db_password = result[0].password
    		const isMatch = await bcrypt.compare(password, db_password)
    		if (isMatch) {
    			const id = result[0].id
    			const service_provider = result[0].service_provider
					const token = jwt.sign({ id: id, service_provider: service_provider }, 'cfd87hgfc0uewcfd32ojnbt569uhbaplr')
					res.cookie('auth_jwt', token, {
	        httpOnly: true,
	        maxAge: 60 * 60 * 1000 * 24 * 100, 
	        path:"/"
	    		})
			    res.send('{"res":"valid credentials"}')
		    }
		    else {
		    	res.send('{"res":"Incorrect login information. Please try again."}')
		    }		     
  		}
  		else {
  			res.send('{"res":"Incorrect login information. Please try again."}')
  		}
		})
	})
})

app.get('/admin_dashboard.html', (req, res) => {
	try {
		const token = req.cookies.auth_jwt
	  const user = jwt.verify(token, 'cfd87hgfc0uewcfd32ojnbt569uhbaplr')
	  const id = user.id
	  const service_provider = user.service_provider
	  const element = db.find((element) => element[0] == ("id" + id))
		if(element){
			var last_called_customer = element[1]
		}
		else{
			var last_called_customer = ""
		}	
	  if(req.query.lang == "ar"){
		 	res.render('admin_dashboard1.hbs', {					 
			service_provider: service_provider,
			last_called_customer: last_called_customer
			})
		}
		else{
			res.render('admin_dashboard.hbs', {					 
			service_provider: service_provider,
			last_called_customer: last_called_customer
			})
		}	  		
	}
	catch(err) {
		console.log(err)
	  	res.redirect('https://lit-lowlands-82854-b48a400450f7.herokuapp.com/index.html')
	  	return
	}	 	
})

app.get('/reset1.html', (req, res) => {
	  res.writeHead(200, {"Content-Type": "text/html"})
		res.write(reset1)
		res.end()	
})

app.post('/reset2.html', (req, res) => {
	const email = req.body.email
	const token = req.body.token
	const key = 'qczdg32620gjxvsewazvcpoqahfhfjdhg355478hf'
	try {
    const payload = jwt.verify(token, key);
    res.render('reset2.hbs', {					 
		email: email,
		token: token
		}) 
  } 
  catch (err) {
    res.status(400).send('Invalid or expired verification token. Please <a href="reset1.html">try again</a>');
  }		
})

app.post('/email2', async (req, res) => {	
	const email = req.body.email
	const key = 'qczdg32620gjxvsewazvcpoqahfhfjdhg355478hf'
	const token = jwt.sign({email: email}, key, { expiresIn: '1h' })
	const urlencoded = 'https://lit-lowlands-82854-b48a400450f7.herokuapp.com/get_to_post2.html#email='+encodeURIComponent(email)+'&token='+encodeURIComponent(token)	
	const mailOptions = {
		from: 'ghoneim0061@gmail.com',
		to: email,
		subject: 'Complete resetting password',
		html: "Please click<a href="+urlencoded+"> here</a> to complete resetting your password"
	}
	transporter.sendMail(mailOptions, function(error, info){
    if (error) {
		 	res.send("There was a problem sending you a verification link. Please <a href='register.html'>try again.")
		 	return
    } 
    else {
		 	res.send("Please click the verification link we have sent to your email to complete resetting your password. If it does not show up in a few minutes, check your spam folder. The verification token expires after one hour.")
  	}
	})
})

app.post('/update_password', async (req, res) => {
	var email = decodeURIComponent(req.body.email)
	var password = req.body.password
	const hashedpassword = await bcrypt.hash(password, 8)
	var token = decodeURIComponent(req.body.token)
	var key = 'qczdg32620gjxvsewazvcpoqahfhfjdhg355478hf'
	try{
		const payload = jwt.verify(token, key);
		const con = mysql.createConnection(process.env.JAWSDB_URL)
		con.connect(function(err) {
			if (err){
			  res.send("Error establishing a database connection. Please click the verification link again.")
			 	return
			} 
			  
			const sql = "UPDATE users SET password = ? WHERE email = ?"
			con.query(sql, [hashedpassword, email], function (err, result) {
			  if (err) {
				 	res.send("Error updating password. Please click the verification link again.")
				 	return
		   	} 
		   	else {
				 	res.send("<h4><span style='color: green; font-size: 85%'>&#10004; </span>Your password has successfully been reset</h4>Click <a href = 'index.html'>here</a> to login.")
		  	}
			 })
		})
	}
	catch (err) {
    res.status(400).send('Invalid or expired verification token. Please <a href="reset1.html">try again</a>');
  }
})

app.get('/link-qr.html', async (req, res) => {
	try{
		const token = req.cookies.auth_jwt
  	const user = jwt.verify(token, 'cfd87hgfc0uewcfd32ojnbt569uhbaplr')    
  	const id = user.id
  	const service_provider = user.service_provider
		var link = "https://lit-lowlands-82854-b48a400450f7.herokuapp.com/customer-dashboard.html?id=" + id + "&service_provider=" + service_provider
		var qr_code = await QRCode.toDataURL(link)
		if (req.query.lang == "ar") {
			link = link + "&lang=ar"
			qr_code = await QRCode.toDataURL(link)
			res.render('link-qr1.hbs', {					 
			link: link,
			qr_code : qr_code,
			})
		}
		else{
			res.render('link-qr.hbs', {					 
			link: link,
			qr_code : qr_code,
			})
		}
	}
	catch(err){
		res.redirect('https://lit-lowlands-82854-b48a400450f7.herokuapp.com/index.html')
	}	 	
})

app.get('/logout', (req, res) => {
	res.clearCookie('auth_jwt')
	res.send("logout")
})

app.get('/update_name', (req, res) => {
	try{
		const token = req.cookies.auth_jwt
  	const user = jwt.verify(token, 'cfd87hgfc0uewcfd32ojnbt569uhbaplr')    
  	const id = user.id
		const new_name = req.query.new_name
		const con = mysql.createConnection(process.env.JAWSDB_URL)
			con.connect(function(err) {
				if (err) {
					 	res.send("error updating name.")
					 	return
				}			  
			  const sql = "UPDATE users SET service_provider = ? WHERE id = ?"
			  con.query(sql, [new_name, id], function (err, result) {
				  if (err) {
					 	res.send("error updating name.")
					 	return
					}
					res.send("done")
	    	})
			})
		}
		catch(err){
  	res.send("error updating name.")
  	return
  	}			  				
})

app.all('/update', (req, res) => {
	if(req.method == "GET") {
		res.set('Content-Type', 'text/event-stream')
		res.set('Cache-Control', 'no-cache')
		var id = req.query.id
		id = "id" + id
		const element = db.find((element) => element[0] == id);
		if(element){
			const last_called_customer = element[1]
			const event = "event: " + id
			const data = "data: " + last_called_customer
			res.write(event + "\n" + data + "\n\n")
			clients.push(res)
			req.connection.on("end", function() {
				clients.splice(clients.indexOf(res), 1)
				res.end()
		 	})
		}	
		else{
			clients.push(res)
			req.connection.on("end", function() {
				clients.splice(clients.indexOf(res), 1)
				res.end()
		 	})
		}
	}
	if(req.method === "POST"){
		const token = req.cookies.auth_jwt
  	const user = jwt.verify(token, 'cfd87hgfc0uewcfd32ojnbt569uhbaplr')
  	var id = user.id
		const last_called_customer = req.body.last_called_customer
		if (last_called_customer === "0") {
			id = "id" + id
			const element = db.find((element) => element[0] == id)
			if (element) {
				db.splice(db.indexOf(element), 1)
			}	
			const event = "event: " + id
			const data = "data: 0"
			clients.forEach(function(client) {client.write(event + "\n" + data + "\n\n")})
			res.writeHead(200)
			res.write("done")
		 	res.end()
			return
		}
		id = "id" + id
		const element = db.find((element) => element[0] == id)
		if (element) {
			const index = db.indexOf(element)
			db[index][1] = last_called_customer
		}
		else{
			db.push([id,last_called_customer])
		}
 		const event = "event: " + id
		const data = "data: " + last_called_customer
		clients.forEach(function(client){
			client.write(event + "\n" + data + "\n\n")
		})
		res.writeHead(200)
		res.write("done")
 		res.end()
	}
})

app.get('/customer-dashboard.html', (req, res) => {
	const id = req.query.id
	const service_provider = req.query.service_provider
  if (req.query.lang == "ar") {
	  res.render('customer-dashboard1.hbs', {					 
			service_provider: service_provider,
			id:id
		})
	}
	else{
		res.render('customer-dashboard.hbs', {					 
			service_provider: service_provider,
			id:id
		})
	}		
	
})

app.get('/help.html',(req, res) => {
	res.writeHead(200, {"Content-Type": "text/html"})
	res.write(help)
	res.end()
})

app.get('/help1.html',(req, res) => {
	res.writeHead(200, {"Content-Type": "text/html"})
	res.write(help1)
	res.end()
})

app.get('/get_to_post1',(req, res) => {
	res.writeHead(200, {"Content-Type": "text/html"})
	res.write(get_to_post1)
	res.end()
})

app.get('/get_to_post2.html',(req, res) => {
	res.writeHead(200, {"Content-Type": "text/html"})
	res.write(get_to_post2)
	res.end()
})

app.get('/download_qr_code', (req, res) => {
	
	const token = req.cookies.auth_jwt
  const user = jwt.verify(token, 'cfd87hgfc0uewcfd32ojnbt569uhbaplr')    
  const id = user.id
	const link = req.query.link
	const file_name = "qr_code" + id + ".png"
	const filePath = __dirname + "/" + file_name
		
	QRCode.toFile(file_name, link, function (err) {
  		if (err) {
  			res.send("Error creating QR code.")
  		}
  		else{
  			res.download(filePath, (err) => {
          if (err) {
            res.send("Error downloading the QR code.")
          }
          else{
          	fs.unlinkSync(filePath)
          }
    		})
  		}
  		
    })	
})
const port = process.env.PORT || 3000
app.listen(port,() => {
    console.log(`Server running on port ${port}`);
});