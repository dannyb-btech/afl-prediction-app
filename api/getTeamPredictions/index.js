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
        { name: "@type", value: "team_match" }
    ];

    // Filtering
    const round = req.query.round;
    const year = req.query.year;
    if (round !== undefined) {
        if (String(round).length === 6) {
            // e.g., 202517 (year+round) matches matchId prefix
            query += " AND STARTSWITH(c.matchId, @round)";
            parameters.push({ name: "@round", value: String(round) });
        } else {
            query += " AND c.round = @round";
            parameters.push({ name: "@round", value: Number(round) });
            if (year !== undefined) {
                query += " AND c.year = @year";
                parameters.push({ name: "@year", value: Number(year) });
            }
        }
    } else if (year !== undefined) {
        query += " AND c.year = @year";
        parameters.push({ name: "@year", value: Number(year) });
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
            body: { error: "Failed to query team predictions from Cosmos DB.", details: err.message }
        };
    }
};
