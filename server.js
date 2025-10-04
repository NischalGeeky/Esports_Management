// Import necessary libraries
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

// --- IMPORTANT: Enable Thick Mode for Oracle 11g ---
try {
  oracledb.initOracleClient({ libDir: 'C:\\oracle_instant_client\\instantclient-basic-windows.x64-19.28.0.0.0dbru\\instantclient_19_28' });
} catch (err)  {
  console.error("Error initializing Oracle client:", err);
  process.exit(1);
}

// --- Main Configuration ---
const app = express();
const port = 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// --- Oracle Database Connection Configuration ---
const dbConfig = {
    user: "SYSTEM",
    password: "Virat",
    connectString: "localhost/XE"
};

// =================================================================
// --- PUBLIC API ENDPOINTS ---
// =================================================================
app.post('/register', async (req, res) => {
    const { tournamentId, teamName, players } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const teamSql = `INSERT INTO Team (team_id, team_name) VALUES (team_seq.NEXTVAL, :teamName) RETURNING team_id INTO :newTeamId`;
        const teamBind = { teamName, newTeamId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } };
        const teamResult = await connection.execute(teamSql, teamBind, { autoCommit: false });
        const newTeamId = teamResult.outBinds.newTeamId[0];
        
        const playerSql = `INSERT INTO Player (player_id, player_name, username, country) VALUES (player_seq.NEXTVAL, :playerName, :username, :country) RETURNING player_id INTO :newPlayerId`;
        const playerTeamSql = `INSERT INTO Player_Team (player_id, team_id) VALUES (:playerId, :teamId)`;
        for (const player of players) {
            const playerBind = { playerName: player.name, username: player.username, country: player.country, newPlayerId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } };
            const playerResult = await connection.execute(playerSql, playerBind, { autoCommit: false });
            const newPlayerId = playerResult.outBinds.newPlayerId[0];
            await connection.execute(playerTeamSql, { playerId: newPlayerId, teamId: newTeamId }, { autoCommit: false });
        }
        
        const teamTournamentSql = `INSERT INTO Team_Tournament (team_id, tournament_id) VALUES (:teamId, :tournamentId)`;
        await connection.execute(teamTournamentSql, { teamId: newTeamId, tournamentId }, { autoCommit: false });
        
        await connection.commit();
        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        console.error("Database registration error:", err);
        if (connection) await connection.rollback();
        res.status(500).json({ message: 'An error occurred during registration. Please check the server logs.' });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});

app.get('/api/homepage-data', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const [statsResult, tournamentsResult] = await Promise.all([
            connection.execute(`
                SELECT
                    (SELECT COUNT(*) FROM Team) as team_count,
                    (SELECT COUNT(*) FROM Player) as player_count,
                    (SELECT SUM(prize_pool) FROM Tournament) as total_prize
                FROM dual
            `),
            connection.execute(`
                SELECT * FROM (
                    SELECT tournament_id, tournament_name, prize_pool, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date 
                    FROM Tournament 
                    WHERE end_date >= SYSDATE 
                    ORDER BY start_date ASC
                )
                WHERE ROWNUM <= 6
            `)
        ]);

        const stats = {
            teams: statsResult.rows[0][0],
            players: statsResult.rows[0][1],
            prizes: statsResult.rows[0][2]
        };
        
        const tournaments = tournamentsResult.rows.map(row => ({
            tournament_id: row[0],
            tournament_name: row[1],
            prize_pool: row[2],
            start_date: row[3],
            end_date: row[4]
        }));

        res.json({ stats, tournaments });

    } catch (err) {
        console.error("Error fetching homepage data:", err);
        res.status(500).json({ message: "Failed to fetch homepage data." });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});

app.get('/api/registrations', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`
            SELECT t.team_name, tou.tournament_name 
            FROM Team t 
            JOIN Team_Tournament tt ON t.team_id = tt.team_id 
            JOIN Tournament tou ON tt.tournament_id = tou.tournament_id
            ORDER BY tou.tournament_name, t.team_name
        `);
        res.json(result.rows.map(row => ({ team_name: row[0], tournament_name: row[1] })));
    } catch (err) {
        console.error("Error fetching registrations:", err);
        res.status(500).json({ message: "Failed to fetch registrations." });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});

app.get('/api/teams-public', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT team_id, team_name FROM Team ORDER BY team_name ASC`);
        res.json(result.rows.map(row => ({ team_id: row[0], team_name: row[1] })));
    } catch (err) {
        console.error("Error fetching teams:", err);
        res.status(500).json({ message: "Failed to fetch teams." });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});

app.get('/api/players-public', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT player_id, player_name, username, country FROM Player ORDER BY player_name ASC`);
        res.json(result.rows.map(row => ({ player_id: row[0], player_name: row[1], username: row[2], country: row[3] })));
    } catch (err) {
        console.error("Error fetching players:", err);
        res.status(500).json({ message: "Failed to fetch players." });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});

// NEW ENDPOINT FOR REGISTRATION DROPDOWN
app.get('/api/tournaments-list', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT tournament_id, tournament_name FROM Tournament WHERE end_date >= SYSDATE ORDER BY tournament_name ASC`);
        res.json(result.rows.map(row => ({ tournament_id: row[0], tournament_name: row[1] })));
    } catch (err) {
        console.error("Error fetching tournaments list:", err);
        res.status(500).json({ message: "Failed to fetch tournaments list." });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});


// =================================================================
// --- ADMIN API ENDPOINTS ---
// =================================================================

app.get('/api/dashboard-data', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const [teamsResult, playersResult, tournamentsResult] = await Promise.all([
            connection.execute(`SELECT team_id, team_name FROM Team ORDER BY team_id ASC`),
            connection.execute(`SELECT player_id, player_name, username, country FROM Player ORDER BY player_id ASC`),
            connection.execute(`SELECT tournament_id, tournament_name, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, prize_pool FROM Tournament ORDER BY tournament_id ASC`)
        ]);

        const dashboardData = {
            teams: teamsResult.rows.map(row => ({ team_id: row[0], team_name: row[1] })),
            players: playersResult.rows.map(row => ({ player_id: row[0], player_name: row[1], username: row[2], country: row[3] })),
            tournaments: tournamentsResult.rows.map(row => ({ tournament_id: row[0], tournament_name: row[1], start_date: row[2], end_date: row[3], prize_pool: row[4] }))
        };

        res.json(dashboardData);
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).json({ message: "Failed to fetch dashboard data." });
    } finally {
        if (connection) try { await connection.close(); } catch (e) { console.error(e); }
    }
});

// Team Management
app.post('/api/teams', async (req, res) => {
    const { team_name } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`INSERT INTO Team (team_id, team_name) VALUES (team_seq.NEXTVAL, :team_name)`, { team_name }, { autoCommit: true });
        res.status(201).json({ message: 'Team created.' });
    } catch(err) { res.status(500).send({ message: "Failed to create team." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});
app.put('/api/teams/:id', async (req, res) => {
    const { id } = req.params;
    const { team_name } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`UPDATE Team SET team_name = :team_name WHERE team_id = :id`, { team_name, id }, { autoCommit: true });
        res.json({ message: 'Team updated.' });
    } catch(err) { res.status(500).send({ message: "Failed to update team." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});
app.delete('/api/teams/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`DELETE FROM Player_Team WHERE team_id = :id`, { id }, { autoCommit: false });
        await connection.execute(`DELETE FROM Team_Tournament WHERE team_id = :id`, { id }, { autoCommit: false });
        await connection.execute(`DELETE FROM Team WHERE team_id = :id`, { id }, { autoCommit: false });
        await connection.commit();
        res.json({ message: 'Team deleted.' });
    } catch(err) { if(connection) await connection.rollback(); res.status(500).send({ message: "Failed to delete team." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});

// Player Management
app.post('/api/players', async (req, res) => {
    const { player_name, username, country } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`INSERT INTO Player (player_id, player_name, username, country) VALUES (player_seq.NEXTVAL, :player_name, :username, :country)`, { player_name, username, country }, { autoCommit: true });
        res.status(201).json({ message: 'Player created.' });
    } catch(err) { res.status(500).send({ message: "Failed to create player." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});
app.put('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    const { player_name, username, country } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`UPDATE Player SET player_name = :player_name, username = :username, country = :country WHERE player_id = :id`, { player_name, username, country, id }, { autoCommit: true });
        res.json({ message: 'Player updated.' });
    } catch(err) { res.status(500).send({ message: "Failed to update player." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});
app.delete('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`DELETE FROM Player_Team WHERE player_id = :id`, { id }, { autoCommit: false });
        await connection.execute(`DELETE FROM Player WHERE player_id = :id`, { id }, { autoCommit: false });
        await connection.commit();
        res.json({ message: 'Player deleted.' });
    } catch(err) { if(connection) await connection.rollback(); res.status(500).send({ message: "Failed to delete player." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});

// Tournament Management
app.post('/api/tournaments', async (req, res) => {
    const { tournament_name, start_date, end_date, prize_pool } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`INSERT INTO Tournament (tournament_id, tournament_name, start_date, end_date, prize_pool) VALUES (tournament_seq.NEXTVAL, :tournament_name, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'), :prize_pool)`, { tournament_name, start_date, end_date, prize_pool }, { autoCommit: true });
        res.status(201).json({ message: 'Tournament created.' });
    } catch(err) { res.status(500).send({ message: "Failed to create tournament." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});
app.put('/api/tournaments/:id', async (req, res) => {
    const { id } = req.params;
    const { tournament_name, start_date, end_date, prize_pool } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`UPDATE Tournament SET tournament_name = :tournament_name, start_date = TO_DATE(:start_date, 'YYYY-MM-DD'), end_date = TO_DATE(:end_date, 'YYYY-MM-DD'), prize_pool = :prize_pool WHERE tournament_id = :id`, { tournament_name, start_date, end_date, prize_pool, id }, { autoCommit: true });
        res.json({ message: 'Tournament updated.' });
    } catch(err) { res.status(500).send({ message: "Failed to update tournament." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});
app.delete('/api/tournaments/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(`DELETE FROM Team_Tournament WHERE tournament_id = :id`, { id }, { autoCommit: false });
        await connection.execute(`DELETE FROM Tournament WHERE tournament_id = :id`, { id }, { autoCommit: false });
        await connection.commit();
        res.json({ message: 'Tournament deleted.' });
    } catch(err) { if(connection) await connection.rollback(); res.status(500).send({ message: "Failed to delete tournament." }); } 
    finally { if (connection) try { await connection.close(); } catch(e) { console.error(e); } }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Esports server is running on http://localhost:${port}`);
    console.log("Waiting for requests...");
});

