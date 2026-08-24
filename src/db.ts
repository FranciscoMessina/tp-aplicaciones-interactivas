import mongoose from "mongoose";

const conectarDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB URI no esta definido");
        }
        await mongoose.connect(mongoUri);
        console.log("MongoDB conectado");
    }catch(error) {
        console.error("error a conectar: "+error);
        process.exit(1);
    }
};
export default conectarDB();