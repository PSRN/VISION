//using ES6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
// const db = require('./db');
// const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const Promise = require('promise');
// const resource = new SomeResource();

const homeStartingContent = "Vision Blog contains the blogs related to Cloud Computing and AI Deep Learning.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "You can hack it easily.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://mongo:27017/visionDB", {useNewUrlParser: true, useUnifiedTopology: true , 
server: {
  socketOptions: {
    socketTimeoutMS: 0,
    connectionTimeout: 0
  }
}})
.then(() => console.log('MongoDB Connected'));
mongoose.set("useCreateIndex", true);

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: "237831104802-t04ju94thnijjehosjp80fnk5n1ld0mk.apps.googleusercontent.com",
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/bloghome",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({googleId: profile.id}, function(err, user){
      return cb (err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', {scope: ["profile"] })
);

app.get("/auth/google/bloghome",
  passport.authenticate('google', {failureRedirect: "/login"}),
  function(req, res) {
    res.redirect('/bloghome');
  });

app.get("/home", function(req, res){
  res.render("home");
});

app.get("/bloghome", function(req, res){
  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
      res.render("bloghome", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
  } else {
    res.redirect("/login");
  }

});



app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});



app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});


app.get("/signup", function(req, res){
  res.render("signup");
});

app.get("/login", function(req, res){
  res.render("login");
});





app.post("/signup", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err){
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/home");
        });
      }
    });
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

   req.login(user, function(err){
    if(err){
      console.log(err);
    } else {
      passport.authenticate("local");
        res.redirect("/bloghome");
    }
   });

});


// function SomeResource() {
//   // Initially set the loaded status to a rejected promise
//   this.loaded = Promise.reject(new Error('Resource not yet loaded!'));
// }

// process.on('unhandledRejection', (reason, promise) => {
//   console.log('Unhandled Rejection at:', promise, 'reason:', reason);
//   // Application specific logging, throwing an error, or other logic here
// });

// Promise.then((res) => {
//   return reportToUser(JSON.parse(res)); // Note the typo (`pasre`)
// }); // No `.catch()` or `.then()`

app.get("/game",function(req, res){
  res.render("game");
});


app.listen(3000, function() {
  console.log("Server started on port: 3000 !");
});
