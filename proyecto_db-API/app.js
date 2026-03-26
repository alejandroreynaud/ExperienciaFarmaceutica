var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerSetup = require('./config/swagger');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ventasRoutes = require("./routes/ventas");
var productosRoutes = require("./routes/productos");
var facturasRoutes = require("./routes/facturas");
var inventarioRoutes = require('./routes/inventario');
var clientesRoutes = require('./routes/clientes');
var comprasRoutes = require('./routes/compras');
var proveedoresRoutes = require('./routes/proveedores');
var app = express();
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use("/api", ventasRoutes);
app.use("/api", productosRoutes);
app.use('/api', facturasRoutes);
app.use('/api/inventory', inventarioRoutes);
app.use('/api', clientesRoutes);
app.use('/api', comprasRoutes);
app.use('/api', proveedoresRoutes);


swaggerSetup(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const clientesRoutes = require("./routes/clientes");
app.use("/api", clientesRoutes);

module.exports = app;
