import {spawnSync,spawn} from 'node:child_process';
if(process.env.DATABASE_URL){
 const migration=spawnSync(process.execPath,['--import','tsx','scripts/migrate.ts'],{stdio:'inherit',env:process.env});
 if(migration.status!==0){console.error('Database setup failed; refusing to start with an incomplete schema.');process.exit(1)}
}
const server=spawn(process.execPath,['server.js'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.kill(signal));
server.on('exit',code=>process.exit(code??1));
