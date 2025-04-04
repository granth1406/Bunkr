const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();


const app = express()
const port = 3000

// Middleware to parse JSON request boy
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("MongoDB Connection Error:", err));

const userSchema =new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: {type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// REgister Route (Sign Up)
app.post('/register', async (req, res) => {
    try {
        const { email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({ message: "All fields are requied" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password 
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ email, password: hashedPassword});
        await newUser.save();

        res.status(201).json({ message: "User registered"});
    } catch(err) {
        console.error("MongoDB Connection Error:", err.message, err); // <-- Full error logging
        console.error("Registration error:" , err) ;
        res.status(500).json( {message: "Errror registering user", error: err });
    }
})

// Login Route
app.post('/login', async (req, res) => {
    try{
        const {email, password} = req.body;
        
        if(!email || !password){
            return res.status(400).json({ message: "All fields are required"});
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT_SECRET is missing in environment variables" });
        }
        

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {expiresIn: '1h' });

        res.status(200).json({ message: "Login successful" , token });
    } catch(err) {
        res.status(500).json({ message: "Error loggin in:", error: err });
    }
});

app.listen(port, function() {
  console.log(`🚀 Server running on port ${port}`)
})