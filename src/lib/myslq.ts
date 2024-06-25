import 'server-only';
import mysql from 'mysql2/promise';

export const mySQLConnection = () => mysql.createConnection(process.env.MYSQL_CONNECTION_STRING!);
