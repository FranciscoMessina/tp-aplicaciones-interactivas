import {Schema, model, Document} from 'mongoose';
 export interface IProducto extends Document {
     nombre: string;
     descripcion: string;
     cantidad: number;
 }
 const productoSchema = new Schema<IProducto>({
     nombre: {type: string, required: true},
     descripcion: {type: string, required: true},
     cantidad: {type: number, required: true}
 },
     {timestamps: true}
     );

 export default model<IProducto>('Producto', productoSchema);