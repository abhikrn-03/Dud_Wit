const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const express = require("express")
const fetch = require('node-fetch')
const dotenv = require('dotenv')
dotenv.config()
const passport = require('passport')
const bodyParser = require("body-parser")
const ejs = require('ejs')
require('./db/mongoose')
const _ = require("lodash")
const User = require('./models/user')
const userRouter = require('./routers/user')
const blogRouter = require('./routers/blog')
const expressSession = require('express-session')({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
})
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const sgMail = require('@sendgrid/mail')
const { use } = require('passport')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const app = express()
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const avatarPath = path.join(__dirname, '../public/images/defAvatar.png')

app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(express.static(publicDirectoryPath))
app.use(expressSession)
app.use(passport.initialize())
app.use(passport.session())
app.use(userRouter)
app.use(blogRouter)

var img = fs.readFileSync(avatarPath)
var finalImg = {
    contentType: 'image/png',
    image: img
}

passport.use('local-signup', new LocalStrategy({
    usernameField: 'penName',
    passwordField: 'password',
    passReqToCallback: true
},
(req, penName, password, done) => {
    process.nextTick(() => {
        User.findOne({penName: penName}, async (err, user) => {
            if (err){
                return done(err);
            }
            if (user){
                return done (new Error('There already exists an account with this Pen Name.'))
            } 
            const existing = await User.findOne({email: req.body.email})
            if (existing){
                return done (new Error('There already exists an account with this Email ID.'))
            }
            else {
                var newUser = new User();
                newUser.avatar = finalImg
                newUser.email = req.body.email;
                newUser.password = newUser.generateHash(password);
                newUser.age = req.body.age
                newUser.gender = req.body.gender
                newUser.penName = penName
                newUser.name = req.body.name
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser)
                });
            }

        });

    });

}));

passport.use('local-login', new LocalStrategy({
    usernameField : 'penName',
    passwordField : 'password',

},
(penName, password, done) => {
    User.findOne({ penName : penName }, (err, user) => {
        if (err)
            return done(err);
        if (!user)
            return done(null, false, {message: 'Incorrect Pen Name or Password'});
        if (!user.password)
            return done(null, false, {message: 'Incorrect Pen Name or Password'})
        if (!user.validPassword(password))
            return done(null, false, {message: 'Incorrect Pen Name or Password'});
        return done(null, user);
    });
}));

passport.use('google-auth', new GoogleStrategy({
    clientID: '652219290709-kjebgljvnkriiup29d2g5h5lgml6d123.apps.googleusercontent.com',
    clientSecret: 'JtLsRsi9lhjN49PiHxXiufXb',
    callbackURL: "http://blogbower.herokuapp.com/auth/google/BlogBower"
},
(accessToken, refreshToken, profile, done) => {
    User.findOne({
        'google_id': profile.id
    }, async (err, user) => {
        if (err) {
            return done(err)
        }
        if (!user) {
            const existing = await User.findOne({email: profile.emails[0].value})
            if(existing){
                return done(new Error("There already exists an account with this email."))
            }
            const newUser = new User({
                'avatar': finalImg,
                'google_id': profile.id,
                'name': profile.displayName,
                'email': profile.emails[0].value
            })
            newUser.save(function(err){
                if(err){
                    throw err
                }
                return done(null, newUser)
            })
        }
        else{
            return done(null, user)
        }
    })
}))

passport.serializeUser((user, done) => {
    done(null, user.id)
})
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user)
    })
})

let posts = []

app.get('', async (req, res) => {

    try {
        if (req.user){
            await res.render('index', {
            title: 'Your Personal Diary',
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email
            })
        }
        else {
            await res.render('index', {
            title: 'Your Personal Diary',
            name: null,
            penName: null,
            email: null
            })
        }
    } catch (e) {
        res.status(500).send(e)
    }
})

app.get('/about', async (req, res) => {
    
    try {
        await res.render('about', {
        title: 'About',
        name: 'Not Anyone'  
    })
    } catch (e) {
        res.status(500).send(e)
    }
})

app.get('/contact', async (req, res) => {
    
    try {
        await res.render('contact', {
        title: 'Contact',
        name: 'Not Anyone'  
    })
    } catch (e) {
        res.status(500).send(e)
    }
})

app.listen(port, () => {
    console.log('Server running on port ' + port);
})



{/* <script>
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '{your-app-id}',
      cookie     : true,
      xfbml      : true,
      version    : '{api-version}'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
</script> */}


// {
//     status: 'connected',
//     authResponse: {
//         accessToken: '...',
//         expiresIn:'...',
//         signedRequest:'...',
//         userID:'...'
//     }
// }


{/* <fb:login-button 
  scope="public_profile,email"
  onlogin="checkLoginState();">
</fb:login-button> */}


// function checkLoginState() {
//   FB.getLoginStatus(function(response) {
//     statusChangeCallback(response);
//   });
// }