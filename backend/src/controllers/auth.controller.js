import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).send({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .send({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .send({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ fullName, email, password: hashedPassword });
    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();
      return res.status(201).send({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePicture: newUser.profilePic,
      });
    } else {
      return res.status(400).send({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in user signup: ", error.message);
    res.status(500).send({ message: error.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    // generate jwt token here
    generateToken(user._id, res);
    return res.status(200).send({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePic,
    });
  } catch (error) {
    console.log("Error in user login: ", error.message);
    res.status(500).send({ message: error.message });
  }
};
export const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in user logout: ", error.message);
    res.status(500).send({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).send({ message: "Profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile: ", error.message);
    res.status(500).send({ message: error.message });
  }
};

export const checkAuth = (req, res) => {
  try {
    return res.status(200).send(req.user);
  } catch (error) {
    console.log("Error in checkAuth: ", error.message);
    res.status(500).send({ message: error.message });
  }
};
