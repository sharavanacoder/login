const express=require('express');
const app=express();
const ejs=require("ejs");
const path=require('path');
const bcrypt=require('bcrypt');
const flash=require('connect-flash');
const session=require('express-session');
const User=require('./models/loginSchema');
const mongoose=require('mongoose')
const ejsMate=require('ejs-mate');
const dbUrl ='mongodb://0.0.0.0:27017/login';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Database Connected')
})

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))
app.use(express.urlencoded({extended:true})) 
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {   
        httpOnly:true,
        expires: Date.now() + 10 * 60 * 60 * 24 * 7,
        maxAge: 10 * 60 * 60 * 24 * 7
    }
}))
app.use(ejsMate())

app.use(flash());
app.use((req, res,next) => {
    res.locals.error=req.flash("error");
    res.locals.success=req.flash('success')
    next();
})
app.get("/", (req, res) => {
    res.render("home")
})
app.get("/login", (req,res) => {
    res.render('login');
})

app.post('/login', async(req, res) => {
    const { email, password }=req.body;
    let found=await User.findOne({email:email});
    if (found) {
        const check=await bcrypt.compare(password, found.password);
        if (check) {
            console.log(found)
            req.flash('success', 'Welcome!!!')
            res.redirect('/secret');
        }
        else {
            req.flash('error', 'Invalid email or password');
            res.redirect("/login");
        }
    }
    else {
        req.flash('error', 'Account not found!!!');
        res.redirect('/login');
    }
})
app.get("/signup", (req, res) => {
    res.render('signup');
})
app.post("/signup", async (req, res) => {
    const { email, password }=req.body;
    if (!email||!password) {
        req.flash('error', 'Please fill the fields')
        res.redirect('/signup');
    } else {
        const hash=await bcrypt.hash(password, 12);
        const user=new User({ email: email, password: hash });
        await user.save();
        req.flash('success', 'Welcome home!!!')
        res.id=user._id;
        console.log(email, password);
        res.redirect('/secret')
    }
});
app.get('/signout', (req, res) => {
    res.redirect('/')
    req.flash('success','Successfully log out!!!')
})
app.get("/secret", (req, res) => {
    console.log(res.id)
    res.render("secured")
})
app.listen(3000, () => {
    console.log("Listening")
});