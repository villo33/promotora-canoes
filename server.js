const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// conexión postgres supabase
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

      `INSERT INTO contratistas
      (nombre,responsable,telefono)
      VALUES($1,$2,$3)`,

      [nombre, responsable, telefono]

    );

    res.send('Contratista guardado');

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

    res.send('Contratista eliminado');

  } catch (err) {

    console.error(err);
    res.status(500).send(err.message);

  }

});

// editar contratista
app.put('/contratistas/:id', async (req,res)=>{

  const {
    nombre,
    responsable,
    telefono
  } = req.body;

  try{

    await db.query(

      `UPDATE contratistas

       SET nombre=$1,
           responsable=$2,
           telefono=$3

       WHERE id=$4`,

      [
        nombre,
        responsable,
        telefono,
        req.params.id
      ]

    );

    res.send("Actualizado");

  }catch(err){

    console.error(err);
    res.status(500).send(err.message);

  }

});



// ===================================================
// TRABAJADORES
// ===================================================

// obtener todos trabajadores
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


// trabajadores por contratista
app.get('/trabajadores/:contratista_id', async (req, res) => {

  try {

    const result = await db.query(

      `SELECT * FROM trabajadores
       WHERE contratista_id = $1
       ORDER BY nombre ASC`,

      [req.params.contratista_id]

    );

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

    res.send('Trabajador guardado');

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

    res.send('Trabajador eliminado');

  } catch (err) {

    console.error(err);
    res.status(500).send(err.message);

  }

});

// editar trabajador
app.put('/trabajadores', async (req, res) => {

  const {
    id,
    nombre,
    cedula,
    telefono,
    cargo,
    contratista_id
  } = req.body;

  try {

    await db.query(

      `UPDATE trabajadores

       SET nombre=$1,
           cedula=$2,
           telefono=$3,
           cargo=$4,
           contratista_id=$5

       WHERE id=$6`,

      [
        nombre,
        cedula,
        telefono,
        cargo,
        contratista_id,
        id
      ]

    );

    res.send("Trabajador actualizado");

  } catch (err) {

    console.error(err);
    res.status(500).send(err.message);

  }

});


// ===================================================
// CONTROL DIARIO / ASISTENCIA
// ===================================================


// guardar planilla diaria
app.post('/control-diario', async (req, res) => {

  const lista = req.body;

  try {

    for (const item of lista) {

      // verificar si ya existe registro mismo día

      const existe = await db.query(

        `SELECT id FROM asistencia
         WHERE trabajador_id=$1
         AND fecha=$2`,

        [
          item.trabajador_id,
          item.fecha
        ]

      );


      // si existe -> actualizar
      if (existe.rows.length > 0) {

        await db.query(

          `UPDATE asistencia

           SET estado=$1,
               observacion=$2

           WHERE trabajador_id=$3
           AND fecha=$4`,

          [
            item.estado,
            item.observacion || null,
            item.trabajador_id,
            item.fecha
          ]

        );

      }


      // si no existe -> insertar
      else {

        await db.query(

          `INSERT INTO asistencia
          (trabajador_id,fecha,estado,observacion)

          VALUES($1,$2,$3,$4)`,

          [
            item.trabajador_id,
            item.fecha,
            item.estado,
            item.observacion || null
          ]

        );

      }

    }

    res.send("Planilla guardada correctamente");

  } catch (err) {

    console.error(err);
    res.status(500).send(err.message);

  }

});


// historial asistencia
app.get('/asistencia', async (req, res) => {

  try {

    const result = await db.query(`

      SELECT

      asistencia.id,

      TO_CHAR(asistencia.fecha, 'DD/MM/YYYY') AS fecha,

      asistencia.estado,
      asistencia.observacion,

      trabajadores.nombre,
      trabajadores.cedula,
      trabajadores.cargo,

      contratistas.nombre AS contratista

      FROM asistencia

      JOIN trabajadores
      ON asistencia.trabajador_id = trabajadores.id

      JOIN contratistas
      ON trabajadores.contratista_id = contratistas.id

      ORDER BY asistencia.fecha DESC,
               asistencia.id DESC

    `);

    res.json(result.rows);

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