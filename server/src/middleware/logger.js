function logger(req, res, next) {
  const now = new Date().toISOString();
  console.log(`[${req.method}] ${req.url} — ${now}`);
  next();
}

module.exports = logger;
