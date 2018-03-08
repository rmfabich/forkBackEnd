//app.use(require("connect").bodyParser());
var bodyParser = require('body-parser');
var express = require("express");
var app = express();
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
var path = require('path')
require('dotenv').config();
var port = 5000;

app.use(express.static(path.join(__dirname, "build")));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

var db;

function verifyToken(req, res, next) {
    var token = req.body.token;
    if (token) {
        jwt.verify(token, "Secret", (err, decode) => {
            if (err) {
                res.send("Wrong token")
            } else {
                res.locals.decode = decode
                next();
            }
        })
    } else {
        res.send("No token")
    }
}


MongoClient.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ds259768.mlab.com:59768/fork_demo_app`, (err, client) => {
    if (err) return console.log(err)
    db = client.db("fork_demo_app")// whatever your database name is
    app.listen(process.env.PORT || 5000, () => {
        //console.log(process.env.PORT)
        console.log("listening on" + process.env.PORT || 5000);
    })
})


//Creates a new account
app.post("/createAcct", (req, res) => {
    console.log(req.body);
    if (req.body.userName.length && req.body.password.length) {
        db.collection('users').find({ userName: req.body.userName }).toArray((err, dataMatch) => {
            if (!dataMatch.length) {
                bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                    db.collection('users').save({ userName: req.body.userName, password: hash }, (err, result) => {
                        if (err) {
                            res.json("Failed")
                            return console.log(err);
                        } else {
                            res.json("Account created successfully")
                            console.log('saved to database');
                        }
                    });
                });
            } else {
                res.json("This username already exists")
            }
        })
    } else {
        res.json("Error: username or password cannot be blank")
    }
});
//Logs in existing user
app.post('/logIn', (req, res) => {
    db.collection('users').find({ userName: req.body.userName }).toArray((err, user) => {
        if (!user.length) {
            res.json('Login unsuccessful');
        } else if (err) {
            res.json('Login unsuccessful');
        }
        bcrypt.compare(req.body.password, user[0].password, function (err, resolve) {
            if (resolve === true) {
                var token = jwt.sign(req.body.userName, ('Secret'), {
                });
                res.json({
                    message: 'Login successful',
                    myToken: token
                });
            } else if (resolve === false) {
                res.json({
                    message: 'Login failed',
                })
            }
        })
        })

    })

app.get("/", (req, res) => {
    res.sendfile("index.html")
})