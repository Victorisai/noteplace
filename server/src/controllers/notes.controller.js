const {
  createNote,
  getFeedNotes,
  getNotesByUsername,
  deleteNote,
} = require('../services/notes.service');

async function create(req, res) {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        message: 'El contenido es obligatorio',
      });
    }

    const note = await createNote({
      content,
      userId: req.user.id,
    });

    return res.status(201).json({
      message: 'Nota creada correctamente',
      note,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Error al crear nota',
    });
  }
}

async function getFeed(req, res) {
  try {
    const notes = await getFeedNotes();

    return res.status(200).json({
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Error al obtener el feed',
    });
  }
}

async function getByUsername(req, res) {
  try {
    const { username } = req.params;

    const data = await getNotesByUsername(username);

    return res.status(200).json(data);
  } catch (error) {
    return res.status(404).json({
      message: error.message || 'Error al obtener notas del usuario',
    });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    const result = await deleteNote({
      noteId: Number(id),
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Error al eliminar nota',
    });
  }
}

module.exports = {
  create,
  getFeed,
  getByUsername,
  remove,
};