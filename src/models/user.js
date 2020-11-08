const mongoose = require('mongoose')
const validator = require('validator')
var bcrypt = require('bcryptjs')
const passport = require('passport')
// const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)){
                throw new Error('Not a valid email ID')
            }
        }
    },
    password: {
        type: String,
        validate(value) {
            if (value.length < 7){
                throw new Error("Password must not be less than 7 characters.")
            }
        }
    },
    penName: {
        type: String,
        trim: true,
        unique: true
    },
    gender: {
        type: String,
        trim: true,
        uppercase: true,
        validate(value) {
            if(value !== 'M' && value !== 'F' && value !== 'O'){
                throw new Error("Invalid input for gender.")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value<0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    google_id: {
        type: String
    }
})

// userSchema.methods.generateAuthToken = async function() {
//     const user = this
//     const token = jwt.sign({ _id: user._id.toString() }, 'myblogwebsite')

//     user.tokens = user.tokens.concat({ token })
//     await user.save()

//     return token
// }

// userSchema.statics.validate = async (email, password) => {
//     const user = await User.findOne({ email: email })

//     if (!user) {
//         return false
//     }

//     const isMatch = await bcrypt.compare(password, user.password)

//     if (!isMatch) {
//         return false
//     }

//     return true
// }

// userSchema.pre('save', async function(next) {
//     const user = this
//     if (user.isModified('password')){
//         user.password = await bcrypt.hash(user.password, 8)
//     }
//     next()
// })

userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password)
}


const User = mongoose.model('User', userSchema)

module.exports = User