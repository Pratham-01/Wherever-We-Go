const express = require("express");
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();

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

app.get("/blogs", (req, res) => {

    /*
    // In index.html
    $http.get("/blogs").success( (response) => {
        $scope.blogs = response;
    })
    
    */
    session=req.session;

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;

        var dbo = db.db("wherever_we_go");
        dbo.collection("blogs").find({}).toArray( (err, result) => {
            if (err) throw err;
            if(session.userid)
                res.json({result : result, session : req.session.userid});
            else res.json({result : result, session : ''});
        })
        db.close();
    });
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
            console.log(result);
            if (err) throw err;
            
            if (result.length == 0) res.json( "No such user exists");
            else if (result[0].password != enteredPass) res.json( "Incorrect password" );
            else if (result[0].password == enteredPass) {
                session=req.session;
                session.userid=req.body.email;
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


app.listen(8080);



// express mongodb cookie-parser express-session multer fs path 

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
   console.log("bruh : ", req.files); 

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
        var obj = {
            title : req.body.title,
            content : req.body.content,
            state : req.body.state,
            city : req.body.city,
            imgs : imgs,
            date : new Date(),
            rating : [],
            comments : [],
        };
        
        dbo.collection("blogs").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
        res.json("success");
    });
})
