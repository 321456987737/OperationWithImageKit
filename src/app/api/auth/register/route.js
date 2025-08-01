import {dbConnect} from "@/lib/connectb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
   try{
      const {email,password} = await request.json()
      if(!email || !password){
         return NextResponse.json({ error: "Email and password are required", success: false }, { status: 400 });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return NextResponse.json({ error: "Invalid email format", success: false }, { status: 400 });
      }

      // Validate password length
      if (password.length < 6) {
         return NextResponse.json({ error: "Password must be at least 6 characters long", success: false }, { status: 400 });
      }

      await dbConnect();

      const existinguser = await User.findOne({email});
       if (existinguser) {
         return NextResponse.json({ error: "User already exists please sign in", success: false }, { status: 400 });
       }
       
       // Hash password before saving
       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(password, salt);
       
       const newUser = await User.create({ email, password: hashedPassword });
       return NextResponse.json({ message: "User registered successfully", success: true }, { status: 201 });

   }catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
         return NextResponse.json({ error: "User already exists", success: false }, { status: 400 });
      }
      
      // Handle validation errors
      if (error.name === "ValidationError") {
         const messages = Object.values(error.errors).map(e => e.message);
         return NextResponse.json({ error: messages.join(", "), success: false }, { status: 400 });
      }
      
      return NextResponse.json({ error: "Failed to register. Please try again later." }, { status: 500 });
   }
}
