const express = require("express");
var bodyParser = require('body-parser');
const app = express();


var mongoClient = require("mongodb").MongoClient;
// var url = "mongodb://localhost:27017/";
var url = "mongodb+srv://pushpit:pass@cluster0.m1kld.mongodb.net/wherever_we_go?retryWrites=true&w=majority"


// Home Route
app.get("/", (req,res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/blogs", (req, res) => {

    /*
    // In index.html
    $http.get("/blogs").success( (response) => {
        $scope.blogs = response;
    })
    
    */

    mongoclient.connect(url, function(err, db) {
        if (err) throw err;

        var dbo = db.db("wherever_we_go");
        dbo.collection("blogs").find({}).toArray( (err, result) => {
            if (err) throw err;
            res.json(result);
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
        var enteredPass = req.body.pass;
        var dbo = db.db("wherever_we_go");
        dbo.collection("blogs").find({ email : enteredEmail }).toArray( (err, result) => {
            if (err) throw err;
            
            if (result.length == 0) res.json( {error : "No such user exists"} );
            else if (result[0].password != enteredPass) res.json( {error : "Incorrect password"} );
            else if (result[0].password == enteredPass) res.redirect("/");

        })
        db.close();
    });
});


// Register
app.get("/register", (req, res) => {
    res.sendFile(__dirname+'/register.html');
});

app.post ("/register", (req, res) => {
    mongoclient.connect(url, function(err, db) 
    {
        if (err) throw err;
        var dbo = db.db("wherever_we_go");
        var obj = {
            name : req.body.name,
            email : req.body.email,
            password : req.body.password,
        };
        
        dbo.collection("users").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
        res.redirect('/login');
    });
 
})
    
app.listen(8080);
