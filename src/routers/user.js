const express = require('express')
const passport = require('passport')
const User = require('../models/user')
const Blog = require('../models/blog')
const auth = require('../middleware/auth')
const connectEnsureLogin = require('connect-ensure-login')
const router = new express.Router()

let posts = []

router.get('/home', auth, async (req, res) => {

    try{
        posts = await Blog.find({username: req.session.passport.user})
        await res.render('home', {
            title: 'Blogs',
            name: req.session.passport.user,
            posts: posts
        })
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

router.post('/users/signUp', async (req, res) => {
    const user = new User({
        'name': req.body.name,
        'email': req.body.email,
        'gender': req.body.gender,
        'username': req.body.username,
        'age': req.body.age
    })

    User.register(user, req.body.password, (err, user) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/home')
            })
        }
    })
})

router.post('/users/signIn', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            throw new Error('username or password incorrect')
        }

        req.logIn(user, function(err){
            if (err) {
                return next(err)
            }
            return res.redirect('/home')
        })
    })(req, res, next)
})

router.get('/users/logout', (req, res) => {
    delete req.session['passport']
    console.log(req.session)
    res.redirect('/')
})

module.exports = router
