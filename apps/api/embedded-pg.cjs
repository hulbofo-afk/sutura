const EmbeddedPostgres = require("embedded-postgres").default;
const path = require("node:path");

const pg = new EmbeddedPostgres({
  databaseDir: path.join(__dirname, ".pgdata"),
  user: "sutura",
  password: "sutura",
  port: 55432,
  persistent: true,
  // logStdout: true,
});

(async () => {
  try {
    await pg.initialise();
  } catch (e) {
    console.log("[embedded-pg] initialise:", e.message);
  }
  try {
    await pg.start();
  } catch (e) {
    console.log("[embedded-pg] start:", e.message);
    process.exit(1);
  }
  try {
    await pg.createDatabase("sutura");
  } catch (e) {
    console.log("[embedded-pg] createDatabase (maybe exists):", e.message);
  }
  console.log("[embedded-pg] READY on port 55432 user=sutura db=sutura");
  process.stdin.resume();
})();
