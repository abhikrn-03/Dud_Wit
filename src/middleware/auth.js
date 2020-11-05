const express = require('express')

const auth = (req, res, next) => {
    try {
        if(!req.session.passport){
            return res.redirect('/users/login')
        }
        else{
            next()
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

module.exports = auth