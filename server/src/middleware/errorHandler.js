function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || 'Sunucu hatasi',
    fields: err.fields || {},
  });
}

module.exports = errorHandler;
