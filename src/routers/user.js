const fs = require('fs')
const fetch = require('node-fetch')
const RandomOrg = require('random-org')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
var random = new RandomOrg({apiKey: process.env.RANDOM_API_KEY})
const express = require('express')
const passport = require('passport')
const User = require('../models/user')
const Blog = require('../models/blog')
const connectEnsureLogin = require('connect-ensure-login')
const _ = require('lodash')
const router = new express.Router()
const multer = require('multer')
const { EDESTADDRREQ } = require('constants')
const jwt = require('jsonwebtoken')
const { rest } = require('lodash')
const { response } = require('express')
const { getMaxListeners } = require('../models/user')
const { url } = require('inspector')

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        fs.mkdir('uploads', (err) => {
            cb(null, 'uploads')
        })
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 255000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)){
            return cb(new Error('Please upload png, jpg or jpeg file.'))
        }
        cb(undefined, true)
    }
})

let blogs = []

router.get('/users/:penName/profile/', async (req, res) => {
    const penName = req.params.penName
    blogs = await Blog.find({penName: penName})
    blogs.reverse()
    try{
        const user = await User.findOne({penName})
        if (req.user==undefined && (user)){
            await res.render('profile', {
            title: 'Blogs',
            name: null,
            penName: null,
            age: null,
            email: null,
            proPen: user.penName,
            proAvatar: user.avatar,
            proName: user.name,
            proAge: user.age,
            Flag: false,
            blogs
            })
        }
        else if ((req.user)&& (req.user.penName==penName) && (user)){
            await res.render('home', {
            title: 'Blogs',
            penName: req.user.penName,
            avatar: req.user.avatar,
            name: req.user.name,
            age: req.user.age,
            email: req.user.email,
            proPen: user.penName,
            proAvatar: user.avatar,
            proName: user.name,
            proAge: user.age,
            Flag: false,
            blogs
            })
        }
        else if ((req.user)&&(req.user.penName!=penName) && (user)){
            await res.render('profile', {
            title: 'Blogs',
            penName: req.user.penName,
            name: req.user.name,
            avatar: req.user.avatar,
            age: req.user.age,
            email: req.user.email,
            proPen: user.penName,
            proAvatar: user.avatar,
            proName: user.name,
            proAge: user.age,
            Flag: false,
            blogs
            }) 
        }
        else {
            await res.render('404', {
            errorMessage: "Sorry, we could not find the Blogger you've requested",
            name: 'Not Anyone' 
            })
        }
    } catch(e){
        res.status(500).send(e)
    }
})

router.get('/users/login', async (req, res) => {
    try {
        await res.render('login', {
            title: 'About',
            name: 'Not Anyone'
        })
    } catch (e) {
        res.status(500).send(e)
    }
})

router.post('/users/signUp', passport.authenticate('local-signup', {}), async (req, res) => {
    try {
        req.logout()
        res.redirect('/users/verifyEmail/'+req.body.email)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/signIn', passport.authenticate('local-login', {}), (req, res) => {
    if(!req.user.verified){
        const email = req.user.email
        req.logout()
        return res.redirect('/users/verifyEmail/'+email)
    }
    res.redirect('/users/'+req.body.penName+'/profile/')
})

router.get('/users/google', passport.authenticate('google-auth', {
    scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email']
}))

router.get('/auth/google/BlogBower', passport.authenticate('google-auth', {
}), (req, res) => {
    if(req.user.penName){
        return res.redirect('/users/'+req.user.penName+'/profile/')
    }
    res.redirect('/users/setupProfile')
})

router.get('/users/logout', connectEnsureLogin.ensureLoggedIn('/users/login'), (req, res) => {
    req.logout()
    res.redirect('/')
})

router.post('/users/delete/', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        const penName = req.body.penName
        if (penName == req.user.penName) {
            await Blog.deleteMany({penName: penName})
            req.logout()
            await User.deleteOne({penName: penName})
            return res.status(200).send()
        }
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/users/setupProfile', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        await res.render('setupProfile', {
            displayName: req.user.name,
            message: 'A blogger should have a unique Pen Name'
        })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/setupProfile', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { penName: req.body.penName  })
        if(req.body.age){
            await User.findByIdAndUpdate(req.user._id, { age: req.body.age })
        }
        if(req.body.gender){
            await User.findByIdAndUpdate(req.user._id, { gender: req.body.gender })
        }
        return res.redirect('/users/'+req.body.penName+'/profile/')
    } catch(e) {
        if (e.codeName == 'DuplicateKey'){
            await res.render('setupProfile', {
            displayName: req.user.name,
            message: 'This Pen Name already exists, try a different Pen Name'
            })
        }
        res.status(400).send(e)
    }
})

router.get('/users/verifyEmail/:email', async (req, res) => {
    try {
        const recipient = req.params.email
        params = {n: 1, length: 32, characters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'}
        const getVerificationKey = await random.generateStrings(params)
        const verficationKey = getVerificationKey.random.data[0]
        const token = jwt.sign({email: recipient, key: verficationKey}, process.env.SECRET, {expiresIn: '15m'})
        var user = await User.findOne({email:recipient})
        user.verificationToken = verficationKey
        await user.save()
        const url = 'http://'+req.get('host')+'/verify?id='+token
        const msg = {
            to: recipient,
            from: 'blogbower@gmail.com',
            subject: 'Verfiy your BlogBower account.',
            text: url,
            html: '<br> <strong>Open this link to verify your BlogBower account!</strong> <br> <a href='+url+'>'+url+'</a>'
        }
        sgMail.send(msg).then(() => {
            console.log('Mail sent')
        }).catch((error) => {
            console.log('error'+error)
        })
    } catch (e) {
        res.status(400).send("error"+e)
    }
})

router.get('/verify', async (req, res) => {
    try {
        const id = req.query.id
        const decodedId = jwt.verify(id, process.env.SECRET)
        const email = decodedId.email
        var user = await User.findOne({email: email})
        if (decodedId.key == user.verificationToken){
            user.verified = true
            user.verificationToken = null
            await user.save()
            res.redirect('/users/login/')
        }
        else{
            return (new Error("Invalid Link"))
        }
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/users/:user/editProfile', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try{
        const user = await User.findById(req.user._id)
        await res.render('editProfile',{
            name: user.name,
            age: user.age,
            gender: user.gender,
            penName: user.penName
        })
    } catch (e){
        res.status(400).send(e)
    }
})

router.post('/users/:user/editProfile', connectEnsureLogin.ensureLoggedIn('/users/login'), upload.single('avatar'), async(req, res) => {
    _id = req.user._id
    reqBody = req.body
    if(req.file){
        try {
            var img = fs.readFileSync(req.file.path)
            var finalImg = {
                contentType: req.file.mimetype,
                image: img
            }
            await User.findByIdAndUpdate(_id, { avatar: finalImg})
        } catch (e) {
            return res.status(400).send(e)
        }
    }
    if(reqBody.name){
        try{
            await User.findByIdAndUpdate(_id, { name: reqBody.name })
        } catch (e) {
            return res.status(400).send(e)
        }
    }
    if(reqBody.age){
        try{
            await User.findByIdAndUpdate(_id, { age: reqBody.age })
        } catch (e) {
            return res.status(400).send(e)
        }
    }
    if(reqBody.gender){
        try{
            await User.findByIdAndUpdate(_id, { gender: reqBody.gender })
        } catch (e) {
            return res.status(400).send(e)
        }
    }
    return res.redirect('/users/'+req.user.penName+'/editProfile')
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

module.exports = router
