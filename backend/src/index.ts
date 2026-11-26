import { app } from './app.js';
import { runtimeEnv } from './config/env.js';

app.listen(runtimeEnv.port, () => {
  // Do not print configuration values, tokens, request bodies, or buyer data.
  console.info(`BarrioGo sandbox backend listening on port ${runtimeEnv.port}`);
});
