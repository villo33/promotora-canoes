const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// conexión supabase postgres
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================== RUTA PRINCIPAL ==================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});


// ===================================================
// CONTRATISTAS
// ===================================================

// obtener contratistas
app.get('/contratistas', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM contratistas ORDER BY id DESC'
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// guardar contratista
app.post('/contratistas', async (req, res) => {

  const { nombre, responsable, telefono } = req.body;

  try {

    await db.query(
      `INSERT INTO contratistas(nombre,responsable,telefono)
       VALUES($1,$2,$3)`,
      [nombre, responsable, telefono]
    );

    res.send('Guardado');

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// eliminar contratista
app.delete('/contratistas/:id', async (req, res) => {
  try {

    await db.query(
      'DELETE FROM contratistas WHERE id=$1',
      [req.params.id]
    );

    res.send('Eliminado');

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// ===================================================
// TRABAJADORES
// ===================================================

// obtener trabajadores
app.get('/trabajadores', async (req, res) => {
  try {

    const result = await db.query(`
      SELECT 
      trabajadores.*,
      contratistas.nombre AS contratista

      FROM trabajadores

      JOIN contratistas
      ON trabajadores.contratista_id = contratistas.id

      ORDER BY trabajadores.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// guardar trabajador
app.post('/trabajadores', async (req, res) => {

  const {
    nombre,
    cedula,
    telefono,
    cargo,
    contratista_id
  } = req.body;

  try {

    await db.query(
      `INSERT INTO trabajadores
      (nombre,cedula,telefono,cargo,contratista_id)
      VALUES($1,$2,$3,$4,$5)`,
      [
        nombre,
        cedula,
        telefono,
        cargo,
        contratista_id
      ]
    );

    res.send('Guardado');

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// eliminar trabajador
app.delete('/trabajadores/:id', async (req, res) => {
  try {

    await db.query(
      'DELETE FROM trabajadores WHERE id=$1',
      [req.params.id]
    );

    res.send('Eliminado');

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// ===================================================
// INGRESOS
// ===================================================

// ver ingresos
app.get('/ingresos', async (req, res) => {
  try {

    const result = await db.query(`
      SELECT

      ingresos.*,

      trabajadores.nombre,
      trabajadores.cedula,

      contratistas.nombre AS contratista

      FROM ingresos

      JOIN trabajadores
      ON ingresos.trabajador_id = trabajadores.id

      JOIN contratistas
      ON trabajadores.contratista_id = contratistas.id

      ORDER BY ingresos.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// registrar ingreso
app.post('/ingresos', async (req, res) => {

  const { trabajador_id } = req.body;

  const fecha = new Date().toISOString().split('T')[0];

  const hora = new Date().toLocaleTimeString('es-CO');

  try {

    await db.query(
      `INSERT INTO ingresos
      (trabajador_id,fecha,hora)
      VALUES($1,$2,$3)`,
      [trabajador_id, fecha, hora]
    );

    res.send('Ingreso registrado');

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// eliminar ingreso
app.delete('/ingresos/:id', async (req, res) => {
  try {

    await db.query(
      'DELETE FROM ingresos WHERE id=$1',
      [req.params.id]
    );

    res.send('Eliminado');

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// ================= SERVER ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo puerto ${PORT}`);
});