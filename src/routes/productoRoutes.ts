import {Router} from 'express';
import {obtenerProductos, crearProducto} from '../controllers/productoController';

const  router = Router();
router.get('/', obtenerProductos);
router.post('/', crearProducto);

export default router;