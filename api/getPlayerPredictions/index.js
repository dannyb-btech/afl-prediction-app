const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request.');

    const connectionString = process.env.CosmosDbConnectionString;
    const client = new CosmosClient(connectionString);
    const database = client.database("afldata");
    const container = database.container("predictions");

    // Build query
    let query = "SELECT * FROM c WHERE c.predictionType = @type";
    const parameters = [
        { name: "@type", value: "player_performance" }
    ];

    // Filtering
    const matchId = req.query.matchId;
    if (matchId !== undefined) {
        query += " AND c.matchId = @matchId";
        parameters.push({ name: "@matchId", value: String(matchId) });
    }

    const querySpec = { query, parameters };

    try {
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        context.res = {
            status: 200,
            body: items
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: { error: "Failed to query player predictions from Cosmos DB.", details: err.message }
        };
    }
}; 