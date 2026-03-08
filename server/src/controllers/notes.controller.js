const {
  createNote,
  getFeedNotes,
  getNotesByUsername,
  updateNote,
  deleteNote,
  toggleLike,
  getCommentsByNoteId,
  createComment,
} = require('../services/notes.service');

async function create(req, res) {
  try {
    const { content } = req.body;

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
    const { page = 1, limit = 10, q = '' } = req.query;
    const userId = req.user?.id || null;

    const data = await getFeedNotes({
      page,
      limit,
      query: q,
      userId,
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Error al obtener el feed',
    });
  }
}

async function getByUsername(req, res) {
  try {
    const { username } = req.params;
    const viewerUserId = req.user?.id || null;

    const data = await getNotesByUsername(username, viewerUserId);

    return res.status(200).json(data);
  } catch (error) {
    return res.status(404).json({
      message: error.message || 'Error al obtener notas del usuario',
    });
  }
}

async function edit(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const note = await updateNote({
      noteId: Number(id),
      userId: req.user.id,
      content,
    });

    return res.status(200).json({
      message: 'Nota actualizada correctamente',
      note,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Error al editar nota',
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

async function like(req, res) {
  try {
    const { id } = req.params;

    const result = await toggleLike({
      noteId: Number(id),
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Error al procesar like',
    });
  }
}

async function getComments(req, res) {
  try {
    const { id } = req.params;
    const comments = await getCommentsByNoteId(Number(id));

    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(404).json({
      message: error.message || 'Error al obtener comentarios',
    });
  }
}

async function comment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await createComment({
      noteId: Number(id),
      userId: req.user.id,
      content,
    });

    return res.status(201).json({
      message: 'Comentario agregado correctamente',
      comment,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Error al comentar',
    });
  }
}

module.exports = {
  create,
  getFeed,
  getByUsername,
  edit,
  remove,
  like,
  getComments,
  comment,
};