import {AsyncHandler} from "../utils/AsyncHandler.js";

const registerUser = AsyncHandler(async (req, res) => {
    // const { name, email, password } = req.body;
    // const user = await User.create({ name, email, password });
    res.status(201).json({
        success: true,
        message: "User registered successfully",
       
    });
});

export { registerUser };

