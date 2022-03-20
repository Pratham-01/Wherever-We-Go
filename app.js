const express = require("express");
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();

// setting up session middleware
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
var mongoClient = require("mongodb").MongoClient;
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
    if (err) throw err;
    mongoclient.connect(url, function(err, db) {
        if (err) throw err;
        var enteredEmail = req.body.email;
        var enteredPass = req.body.password;
        var dbo = db.db("wherever_we_go");
        dbo.collection("user").find({ email : enteredEmail }).toArray( (err, result) => {
            if (err) throw err;
            
            if (result.length == 0) res.json( {error : "No such user exists"} );
            else if (result[0].password != enteredPass) res.json( {error : "Incorrect password"} );
            else if (result[0].password == enteredPass) {
                session=req.session;
                session.userid=req.body.email;
                res.redirect("/");
            }
        })
        db.close();
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
            email : req.body.email,
            password : req.body.password,
            state : req.body.state
        };
        
        dbo.collection("users").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
        res.redirect('/login');
    });
 
})
    

// Logout functionality
app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});


app.listen(8080);
