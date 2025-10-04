Esports Tournament Management System
This project is a full-stack web application for managing esports tournaments, built for a university DBMS project. It features a public-facing website for viewing information and registering teams, and a private admin dashboard for managing the database content.

The application is built with:

Frontend: HTML, CSS, JavaScript

Backend: Node.js with Express.js

Database: Oracle 11g

Oracle Driver: node-oracledb in Thick Mode with Oracle Instant Client

Project Structure
/
|-- images/
|-- node_modules/
|-- admin.html
|-- index.html
|-- package.json
|-- package-lock.json
|-- players.html
|-- register.html
|-- registrations.html
|-- schema.sql
|-- server.js
|-- teams.html
|-- README.md

Setup Instructions for Teammates
To run this project on your local machine, you will need Node.js and an Oracle 11g Database installed. Follow these steps precisely.

1. Database Setup
You must have an Oracle 11g XE database running locally.

Download and Install Oracle SQL Developer: This is the client you will use to manage the database.

Run the Schema Script:

Open SQL Developer and connect to your local Oracle database (as the SYSTEM user).

Open the schema.sql file from this project in a new worksheet.

Execute the entire file as a script (press F5 or use the "Run Script" button). This will create all the necessary tables, sequences, and sample data.

2. Backend Setup
The backend requires Node.js and several dependencies, including the Oracle Instant Client.

Clone the Repository:

Open a terminal or command prompt and clone the project from GitHub:

git clone <your-github-repository-url>
cd Esports_Management

Download Oracle Instant Client:

The node-oracledb driver needs this to connect to the database.

Download the "Basic Package" (a .zip file) for Windows x64. Version 19c is recommended.

Create a folder on your C: drive named oracle_instant_client.

Extract the contents of the downloaded zip file into this folder. Your path should look like C:\oracle_instant_client\instantclient_19_28.

Verify the Path in server.js:

Open the server.js file.

Confirm that the path in oracledb.initOracleClient() matches the exact location where you extracted the Instant Client files. This must be an exact match.

oracledb.initOracleClient({ libDir: 'C:\\oracle_instant_client\\instantclient_19_28' });

Also, verify that the dbConfig object in server.js matches your local Oracle database credentials.

Install Node Modules:

In your terminal, inside the project folder, run the following command to install all the required libraries listed in package.json:

npm install

3. Running the Application
Once the setup is complete, you can run the project.

Start the Backend Server:

In your terminal (still inside the project folder), run:

node server.js

You should see the message: Esports server is running on http://localhost:3000. Keep this terminal window open.

Access the Frontend:

Open your web browser.

To view the main website, open the index.html file directly in your browser.

You can navigate to all other pages (teams.html, players.html, etc.) from there.

To use the admin dashboard, open the admin.html file.

You should now have the full application running, connected to your local database.
