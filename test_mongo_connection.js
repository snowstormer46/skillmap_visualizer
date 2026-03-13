import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://snowstormer46:aditya2005@cluster0.kr0pysa.mongodb.net/SkillMap?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to server");
    
    const admin = client.db().admin();
    const info = await admin.command({ isMaster: 1 });
    console.log("Replica Set Info:", JSON.stringify(info, null, 2));
    
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
