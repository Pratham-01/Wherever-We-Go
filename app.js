const express = require("express");
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const app = express();
const path = require('path');
const fs = require("fs");
const multer = require("multer");
const { log } = require("console");

app.set('views', __dirname + '/views');


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
//var url = "mongodb+srv://pushpit:pass@cluster0.m1kld.mongodb.net/wherever_we_go?retryWrites=true&w=majority"
var url = "mongodb://127.0.0.1:27017/";


// Home Route
app.get("/", (req,res,next) => {
    res.sendFile(__dirname + "/views/layout.html", {});
});

app.get('/checksession', (req, res)=>{
    var returnObj = {};
    session = req.session;
    //console.log(session.userid);
    returnObj.sessions = session.userid ? session.userid : null;
    res.json(returnObj);
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
        if (session.userid[0] == "000@wwg.com"){
            mongoclient.connect(url, function(err, db) {
                if (err) throw err;
        
                var dbo = db.db("wherever_we_go");
                dbo.collection("premium_requests").find({status: false}).toArray( (err, result) => {
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
                dbo.collection("premium_requests").find({userid : session.userid[0]}).toArray( (err, result) => {
                    if (err) throw err;
                    if (result.length == 0){
                        res.json("0");
                    }else{
                        if (result[0].status == false){
                            res.json("exists");
                        }
                        else {
                            res.json("rejected");
                        }
                    }
                });
            })
        }
    }else res.json("0");
})



// Login
app.get("/login", (req, res) => {
    res.sendFile(__dirname+'/views/login.html');
});

app.post("/login", (req,res) => {

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var enteredEmail = req.body.email;
        var enteredPass = req.body.password;
        var dbo = db.db("wherever_we_go");
        dbo.collection("users").find({ _id : enteredEmail }).toArray( (err, result) => {
            if (err) throw err;
            
            if (result.length == 0) res.json( "No such user exists");
            else if (result[0].password != enteredPass) res.json( "Incorrect password" );
            else if (result[0].password == enteredPass) {
                session=req.session;

                session.userid=[req.body.email, result[0].premium, result[0].name] ;
                console.log(session.userid);

             res.json("success");
            }
            db.close();
            
        })
        
    });
});


// Register
app.get("/register", (req, res) => {
    res.sendFile(__dirname+'/views/register.html');
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
    res.sendFile(__dirname+'/views/blog.html');
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


app.post("/blog/:id",(req, res) => {

    var id = req.params.id.toString();

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;

        var dbo = db.db("wherever_we_go");
        dbo.collection("blogs").find({_id: ObjectId(id)}).toArray( (err, result) => {
            if (err) throw err;
            res.send(result);
        });
    });
})
// express mongodb cookie-parser express-session multer fs path socket.io

// Insert blog

// https://youtu.be/gQ5ou0G_frw

app.get("/add_blog", (req,res) => {
    res.sendFile(__dirname + "/views/add_blog.html");
});


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

app.put("/rate/blog/:id", (req, res) => {

    var blogid = req.params.id.toString();

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        var myquery = {_id: ObjectId(blogid)};
        var newvalues = { $push: { "rating": {"userid":req.body.email, "rate": req.body.rating}} };
        dbo.collection("blogs").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            db.close();
        });
    });
    res.json("success");
});

app.put("/comment/blog/:id", (req, res) => {

    var blogid = req.params.id.toString();

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        var myquery = { _id: ObjectId(blogid) };
        var newvalues = { $push: { "comments": {"userid":req.body.email,"name": req.session.userid[2], "text": req.body.text, "date": new Date()}} };
        dbo.collection("blogs").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            db.close();
        });
    });
    res.json("success");
});

app.put("/pin/blog/:id", (req, res) => {

    var blogid = req.params.id.toString();

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        console.log("here", req.body.comment);
        var myquery = { $and: [{_id: ObjectId(blogid)}, {"comments.text": req.body.comment}]};
        var newvalues = { $set: {"comments.$.pin": req.body.pin} };
        dbo.collection("blogs").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;

            console.log("1 comment pinned", res);
            db.close();
        });
    });
    res.json("success");
});

app.put("/accDeny", (req, res) => {

    console.log(req.body);

    if(req.body.status){
        mongoclient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("wherever_we_go");
            var myquery = { _id: { $in: req.body.users }};
            var newvalues = {$set: {premium: req.body.status }};
            dbo.collection("users").updateMany(myquery, newvalues, function(err, res) {
                if (err) throw err;
                console.log("document(s) updated");
                db.close();
            });
        });

        mongoclient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("wherever_we_go");

            var myquery = { userid: { $in: req.body.users }};
            dbo.collection("premium_requests").deleteMany(myquery, function(err, res) {
                if (err) throw err;
                console.log("document(s) updated");
                db.close();
            });
        });

    } else {
        mongoclient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("wherever_we_go");
            var myquery = { userid: { $in: req.body.users }};
            var newvalues = {$set: {status: true }};
            dbo.collection("premium_requests").updateMany(myquery, newvalues, function(err, res) {
                if (err) throw err;
                console.log("document(s) updated");
            });
              
        });
    }
    
    res.json("success");
});


// chat
app.get("/chat",  (req,res) => {
    res.sendFile(__dirname + "/views/chat.html");
});


const client = require('socket.io').listen(4000).sockets;
//var mongo = require("mongodb").MongoClient;
// Connect to mongo
mongoclient.connect(url, function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    var dbo = db.db("wherever_we_go");

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = dbo.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({ date : 1 }).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let obj = {
                'name': data.name, 
                'message': data.message, 
                'date': data.date
            }

            // Check for name and message
            if(data.message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert(obj, function(){
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
