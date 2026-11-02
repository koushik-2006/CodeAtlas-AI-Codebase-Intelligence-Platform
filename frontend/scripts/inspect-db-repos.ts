import { db } from "../lib/server/db";

const repos = db.getRepositories("usr_default");
console.log("Repositories for usr_default count:", repos.length);
for (const r of repos) {
  console.log(`- ID: ${r.id}, Name: ${r.name}, Owner: ${r.owner}, Status: ${r.status}`);
}

const all = (db as any).repositories;
console.log("\nAll repositories in memory DB:", all ? Object.keys(all) : "none");

