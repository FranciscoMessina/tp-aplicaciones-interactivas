import dotenv from 'dotenv';
dotenv.config();

import express, {Application} from 'express';
import conectarDB from './db';
import productoRoutes from './routes/productoRoutes';

const app: Application = express();

app.use(express.json());
conectarDB();
app.use('/api/productos', productoRoutes);
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`corriendo en el puerto: ${port}`);
});