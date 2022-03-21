const express = require("express");
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const app = express();


// var cors = require('cors');
// app.use(cors());

var cors = require('cors');
// use it before all route definitions
app.use(cors({origin: 'http://localhost:8080'}));

/* 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
   */

var ObjectId = require('mongodb').ObjectId; 

// setting up session middleware
var oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
var session;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(__dirname));
app.use(cookieParser());
app.use(express.static(__dirname+ '/public'));

// MongoDB setup
var mongoclient = require("mongodb").MongoClient;
var url = "mongodb+srv://pushpit:pass@cluster0.m1kld.mongodb.net/wherever_we_go?retryWrites=true&w=majority"


// Home Route
app.get("/", (req,res) => {
    res.sendFile(__dirname + "/layout.html");
});


app.get('/index', (req, res) => {
    var returnObj = {};
    session = req.session;
    console.log(session.userid);
    returnObj.sessions = session.userid ? session.userid : null;

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;

        var dbo = db.db("wherever_we_go");
        dbo.collection("blogs").find({}).toArray( (err, result) => {
            if (err) throw err;
            returnObj.blogs = result;
            res.json(returnObj);
        });    
    })    
});

app.get("/requests", (req, res) =>{
    session = req.session;
    if (session.userid){
        if (session.userid[0] == "000"){
            mongoclient.connect(url, function(err, db) {
                if (err) throw err;
        
                var dbo = db.db("wherever_we_go");
                dbo.collection("premium_requests").find({}).toArray( (err, result) => {
                    if (err) throw err;
                    res.json(result);
                });
            }) 
        }
        else {
            mongoclient.connect(url, function(err, db) {
                if (err) throw err;
                session = req.session;
                var dbo = db.db("wherever_we_go");
                dbo.collection("premium_requests").find({_id : session.userid[0]}).toArray( (err, result) => {
                    if (err) throw err;
                    if (result.length == 0){
                        res.json("0");
                    }else{
                        res.json("exists");
                    }
                });
            })
        }
    }else res.json("0");
})



// Login
app.get("/login", (req, res) => {
    res.sendFile(__dirname+'/login.html');
});

app.post("/login", (req,res) => {

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var enteredEmail = req.body.email;
        var enteredPass = req.body.password;
        var dbo = db.db("wherever_we_go");
        dbo.collection("users").find({ _id : enteredEmail }).toArray( (err, result) => {
           // console.log(result);
            if (err) throw err;
            
            if (result.length == 0) res.json( "No such user exists");
            else if (result[0].password != enteredPass) res.json( "Incorrect password" );
            else if (result[0].password == enteredPass) {
                session=req.session;
                session.userid=[req.body.email, result[0].premium] ;
             //   console.log(session.userid);
            }
            db.close();
            res.json("success");
        })
        
    });
});


// Register
app.get("/register", (req, res) => {
    res.sendFile(__dirname+'/register.html');
});

app.post ("/register", (req, res) => {
    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        var obj = {
            name : req.body.name,
            _id : req.body.email,
            password : req.body.password,
            state : req.body.state
        };
        
        dbo.collection("users").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
        res.json("success");
    });
 
})
    

// Logout functionality
app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get("/blog/:id", (req, res) => {
    var id = req.params.id.toString();
    res.sendFile(__dirname+'/blog.html');
});
// Premium 

app.get("/prem_apply", (req, res) => {

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        session = req.session;
        console.log(session.userid);
        var obj = {
            userid : req.session.userid[0],
            status : false,
        };
                
        dbo.collection("premium_requests").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });

    res.redirect("/");
});

app.post("/accept_req", (req, res) => {
    var ids = req.body.requests;
    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        dbo.collection("premium_requests").deleteMany( { userid : { $in: ids }} , function(err, result) {
            if (err) throw err;
            console.log(result);
            db.close();
        });
        // dbo.collection("users").updateMany({ _id : { $in: ids }},  )
    });
})


app.post("/blog/:id",(req, res) => {

    var id = req.params.id.toString();

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;

        var dbo = db.db("wherever_we_go");
        dbo.collection("blogs").find({_id: ObjectId(id)}).toArray( (err, result) => {
            if (err) throw err;
            console.log(id, result);
            res.send(result);
        });
    });
})
// express mongodb cookie-parser express-session multer fs path socket.io

// Insert blog

// https://youtu.be/gQ5ou0G_frw

app.get("/add_blog", (req,res) => {
    res.sendFile(__dirname + "/add_blog.html");
});

const path = require('path');
const fs = require("fs");
const multer = require("multer");
const { log } = require("console");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname+ "-" + Date.now() )//file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
});
var upload = multer({ storage: storage });


app.post("/add_blog",upload.array("imgs"), (req, res)=>{
   //console.log("bruh : ", req.files); 

    var imgs = [];
    for (var i=0; i<req.files.length; i++){
        let img = fs.readFileSync(req.files[i].path);
        let encode_image = img.toString("base64");
        let finalImg = {
            contentType : req.files[i].mimetype,
            path: req.files[i].path,
            image : new Buffer(encode_image, "base64")
        }
        imgs.push(finalImg);
    }

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        var today = new Date();
        //var todaysdate = today.getDate()+"-"+today.getMonth()+"-"+today.getFullYear();
        var state = req.body.state.slice(7);
        var obj = {
            title : req.body.title,
            content : req.body.content,
            state : state,
            city : req.body.city,
            imgs : imgs,
            date : today,
            rating : [],
            comments : [],
        };
        
        dbo.collection("blogs").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
        res.redirect("/")
    });
})



// chat

app.get("/chat",  (req,res) => {
    res.sendFile(__dirname + "/chat.html");
});

const client = require('socket.io')(4000).sockets;

// Connect to mongo
mongoclient.connect("mongodb+srv://pushpit:pass@cluster0.m1kld.mongodb.net/wherever_we_go?retryWrites=true&w=majority", function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});


app.listen(8080);
