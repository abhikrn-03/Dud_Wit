const fs = require('fs')
const express = require('express')
const passport = require('passport')
const User = require('../models/user')
const Blog = require('../models/blog')
const connectEnsureLogin = require('connect-ensure-login')
const _ = require('lodash')
const router = new express.Router()
const multer = require('multer')

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

router.get('/profile/:penName', async (req, res) => {
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
            email: null,
            Flag: false,
            blogs
            })
        }
        else if ((req.user)&& (req.user.penName==penName) && (user)){
            await res.render('home', {
            title: 'Blogs',
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email,
            Flag: false,
            blogs
            })
        }
        else if ((req.user)&&(req.user.penName!=penName) && (user)){
            await res.render('profile', {
            title: 'Blogs',
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email,
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
        res.redirect('/profile/'+req.user.penName)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/signIn', passport.authenticate('local-login', {}), (req, res) => {
    res.redirect('/profile/' + req.user.penName)
})

router.get('/users/google', passport.authenticate('google-auth', {
    scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email']
}))

router.get('/auth/google/BlogBower', passport.authenticate('google-auth', {
}), (req, res) => {
    if(req.user.penName){
        return res.redirect('/profile/' + req.user.penName)
    }
    res.redirect('/users/setupProfile')
})

router.get('/users/logout', connectEnsureLogin.ensureLoggedIn('/users/login'), (req, res) => {
    req.logout()
    res.redirect('/')
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
        return res.redirect('/profile/' + req.body.penName)
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

router.get('/:user/editProfile', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
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

router.post('/:user/editProfile', connectEnsureLogin.ensureLoggedIn('/users/login'), upload.single('avatar'), async(req, res) => {
    _id = req.user._id
    reqBody = req.body
    if(req.file){
        try {
            var img = fs.readFileSync(req.file.path)
            var encode_img = img.toString('base64')
            var finalImg = {
                contentType: req.file.mimetype,
                image: Buffer.from(encode_img, 'base64')
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
    return res.redirect('/:user/editProfile')
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

module.exports = router
