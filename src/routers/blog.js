const express = require('express')
const Blog = require('../models/blog')
const connectEnsureLogin = require('connect-ensure-login')
const router = new express.Router()
const _ = require('lodash')

let blogs = []

router.get('/compose', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        await res.render('compose', {
            title: 'Blogging',
            blogTitle: null,
            blogBody: null,
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email
        })
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/community', async (req, res) => {
    try {
        blogs = await Blog.find({})
        blogs.reverse()
        if (req.user){
            await res.render('community', {
            title: 'They are something more than just blogs..',
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email,
            Flag: true,
            blogs
        })
        }
        else {
            await res.render('community', {
            title: 'They are something more than just blogs..',
            name: null,
            penName: null,
            email: null,
            Flag: true,
            blogs
        })
        } 
    } catch(e) {
        res.status(500).send(e)
    }
})

router.post('/compose', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    const blog = new Blog({
        'title': req.body.postTitle,
        'body': req.body.postBody,
        'penName': req.user.penName,
    })

    try {
        await blog.save()
        blogs = await Blog.find({})
        res.status(201).redirect('/profile/'+req.user.penName)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/edit/:id', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try {
        _id = req.params.id
        blog = await Blog.findById(_id)
        const blogTitle = blog.title
        const blogBody = blog.body
        await Blog.deleteOne({_id: _id})
        await res.render('compose', {
            title: 'Blogging',
            blogTitle: blogTitle,
            blogBody: blogBody,
            penName: req.user.penName,
            name: req.user.name,
            email: req.user.email
        })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/delete/:id', connectEnsureLogin.ensureLoggedIn('/users/login'), async (req, res) => {
    try{
        _id = req.params.id
        await Blog.deleteOne({_id: _id})
        res.redirect('/profile/'+req.user.penName)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/blogs/:blogName', async (req, res) => {
    let flag = false
    blogs = await Blog.find({})
    const requestedTitle = _.lowerCase(req.params.blogName)

    try {
        blogs.forEach(async (blog) => {
            const storedTitle = _.lowerCase(blog.title)

            try {
                if (storedTitle === requestedTitle) {
                    flag = true
                    if (req.user==undefined){
                        await res.render('post', {
                        title: blog.title,
                        body: blog.body,
                        _id: blog._id,
                        penName: null,
                        name: null,
                        email: null,
                        Flag: false
                        })
                    }
                    else if ((req.user)&&(req.user.penName==blog.penName)){
                        await res.render('post', {
                        title: blog.title,
                        body: blog.body,
                        _id: blog._id,
                        penName: req.user.penName,
                        name: req.user.name,
                        email: req.user.email,
                        Flag: true
                        })
                    }
                    else {
                        await res.render('post', {
                        title: blog.title,
                        body: blog.body,
                        _id: blog._id,
                        penName: req.user.penName,
                        name: req.user.name,
                        email: req.user.email,
                        Flag: false
                        })
                    }
                }
            } catch (e) {
                res.status(500).send(e)
            }
        })
        if (!flag){
            await res.render('404', {
            errorMessage: "Sorry, we could not find the Blog you've requested.",
            name: 'Not Anyone'
            })
        }
    } catch (e) {
        res.status(404).send(e)
    }
})

module.exports = router