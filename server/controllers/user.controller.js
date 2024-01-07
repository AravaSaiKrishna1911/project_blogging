import { getAuth } from "firebase-admin/auth";
import User from "../Schema/User.js";
import ErrorHanlder from "../utils/Errorhandler.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { nanoid } from "nanoid";

const generateUserName = async(email) =>{
    let username = email.split("@")[0];
    let isUserNameUnique = await User.exists({"personal_info.username": username}).then((result) => result)  

    isUserNameUnique ? username += nanoid().substring(0, 5) : "";

    return username

}
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const formatDataToSend = (user) =>{
    const access_token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}
export const register = async(req, res, next) => {
    try {
        const {fullname, email, password} = req.body;
        if(!fullname || fullname.length < 3)
            return next(new ErrorHanlder(403,"Full name must be 3 letters long"))
        if(!email.length)
            return res.status(403).json({"error": "Enter email"})

        if(!emailRegex.test(email)){
            return res.status(403).json({"error": "Email is invalid"})
        }
        if(!passwordRegex.test(password)){
            return res.status(403).json({"error": 'password should be 6 to 20 characters long with a numeric, 1 uppercase and 1 lowercase lettes'})
        }

        bcrypt.hash(password, 10, async(err, hashed_password)=>{
            let username = await generateUserName(email)
            let user = new User({
                personal_info: {
                    fullname, email, password: hashed_password, username 
                }
            })
            user.save().then((u)=>{
                return res.status(200).json(formatDataToSend(u))
            })
            .catch((err)=>{
                if(err.code === 11000){
                    return res.status(500).json({"error": "Email already exists"})
                }
                return res.status(500).json({'error': err.message})
            })
        })
    // return res.status(200).json({'status': "ok"})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export const login = async(req, res) =>{
    try {
        let {email, password} = req.body;
        User.findOne({"personal_info.email": email}).then((user)=>{
            if(!user){
                return res.status(403).json({"error": "Email not found"})
            }
            if(!user.google_auth){
                bcrypt.compare(password, user.personal_info.password, (err, result)=>{
                    if(err)
                        return res.status(403).json({"error": "Error Occur while login please try again"})
        
                    if(!result){
                        return res.status(403).json({"error": "Invalid Credential"})
                    }
                    else{
                        return res.status(200).json(formatDataToSend(user))
                    }
                })

            }
            else{
                return res.status(403).json({"error": "Account was created using google. Try using Google"})
            }
        })
        .catch(err=>{
            console.log(err)
            return res.status(500).json({"error": err.message})
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export const googleLogin = async(req, res) =>{
    try {
        let { access_token} = req.body;
        getAuth().verifyIdToken(access_token).then(async(decodedUser) =>{
            let {email, name, picture} = decodedUser
            picture = picture.replace('s96-c', 's384-c')

            let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u)=>{
                return u || null
            }).catch((err)=>{
                return res.status(505).json({"error": err.message})
            })


            if(user){ // login
                if(!user.google_auth){
                    return res.status(403).json({"error": "This email was signed up without google. Please log in with password to access the account"})
                }
            }
            else{ // sign up
                let username = await generateUserName(email)
                user = new User({
                    personal_info: {fullname: name, email, profile_img: picture, username}, 
                    google_auth: true
                })
                await user.save().then((u)=>{
                    user = u;
                }).catch((err)=>{
                    return res.status(505).json({"error": err.message})
                })
            }

            return res.status(200).json(formatDataToSend(user))

        })
        .catch((err)=>{
            return res.status(500).json({"error": "Failed to authenticate you with goole, Try with others account"})
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}