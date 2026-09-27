const fs = require('fs');

let serverCode = fs.readFileSync('src/server.js', 'utf8');

if (!serverCode.includes('chatRoutes')) {
  serverCode = serverCode.replace(
    "import authRoutes from './routes/auth.routes.js';",
    "import authRoutes from './routes/auth.routes.js';\nimport chatRoutes from './routes/chat.routes.js';"
  );

  serverCode = serverCode.replace(
    "app.use('/api/auth', authRoutes);",
    "app.use('/api/auth', authRoutes);\n  app.use('/api/chat', chatRoutes);"
  );

  fs.writeFileSync('src/server.js', serverCode);
  console.log('server.js patched');
} else {
  console.log('Already patched');
}
