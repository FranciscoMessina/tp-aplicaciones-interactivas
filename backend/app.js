// Importación de módulos necesarios
var express = require('express');              // Framework web para Node.js
var cookieParser = require('cookie-parser');  // Middleware para parsear cookies
var bluebird = require('bluebird');           // Promesas mejoradas para JS

//incorporo cors
var cors = require('cors'); // Middleware para habilitar CORS

// Importación de routers personalizados
var indexRouter = require('./routes/index');  // Rutas base
var apiRouter = require('./routes/api');      // Rutas API específicas del sistema

// Creación de la instancia de la aplicación Express
var app = express();

// Middleware para interpretar JSON y datos de formularios URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Habilita CORS para todas las rutas
app.use(cors());

// Middleware para parsear cookies
app.use(cookieParser());

// Middleware personalizado para configurar cabeceras CORS más específicas
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});


// Definición de rutas
app.use('/api', apiRouter);   // Las rutas que comienzan con /api usarán el router apiRouter
app.use('/', indexRouter);    // Las rutas base usarán el router indexRouter

// Carga la configuración si el entorno es "Development"
if (process.env.NODE_ENV === 'Development') {
  require('./config').config();
}



// Conexión a la base de datos MongoDB usando Mongoose y Bluebird

var mongoose = require('mongoose')
mongoose.Promise = bluebird;
let url = `${process.env.DATABASE1}${process.env.DATABASE2}=${process.env.DATABASE3}=${process.env.DATABASE4}`
console.log("BD",url);
let opts = {
  useNewUrlParser : true, 
  connectTimeoutMS:20000, 
  useUnifiedTopology: true
  };

mongoose.connect(url,opts)
  .then(() => {
    console.log(`Succesfully Connected to theMongodb Database..`)
  })
  .catch((e) => {
    console.log(`Error Connecting to the Mongodb Database...`),
    console.log(e)
  })


// Setup server port
var port = process.env.PORT || 8080;
// Escuchar en el puerto
app.listen(port,()=>{
    console.log('Servidor de ABM Users iniciado en el puerto ',port);
});


module.exports = app;