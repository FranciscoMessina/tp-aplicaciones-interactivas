import { Request, Response } from 'express';
import Producto from '../models/producto';

export const obtenerProductos =async(req: Request, res: Response) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    }catch (error) {
        res.status(500).json({mensaje: 'error al buscar', erorr: error.message});
    }
}

export const crearProducto =async(req: Request, res: Response) => {
    try{
        const nuevoProducto = new Producto(req.body);
        const producto = await nuevoProducto.save();
        res.status(201).json(producto);
    }catch (error) {
        res.status(400).json({mensaje:  'error al guardar', error: error.message});
    }
}