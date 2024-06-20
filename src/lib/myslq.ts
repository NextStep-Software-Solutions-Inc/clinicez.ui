import 'server-only';
import mysql from 'mysql2/promise';

const config = {
  host: '192.168.30.67',
  user: 'edcs',
  password: 'edcsHr1sDB24!',
  database: 'ustphims',
};

export const mySQLConnection = mysql.createConnection(config);
