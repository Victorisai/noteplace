const {
  createNote,
  getFeedNotes,
  getNotesByUsername,
  getProfileByUsername,
  getUserReplies,
  getUserLikedNotes,
  getUserBookmarkedNotes,
  updateNote,
  deleteNote,
  toggleLike,
  toggleBookmark,
  getCommentsByNoteId,
  createComment,
} = require('../services/notes.service');

async function create(req, res) {
  try {
    const { content = '' } = req.body;
    const imageUrls = (req.files || []).map((file) => `/uploads/notes/${file.filename}`);
    const note = await createNote({ content, userId: req.user.id, imageUrls });
    return res.status(201).json({ message: 'Nota creada correctamente', note });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al crear nota' });
  }
}

async function getFeed(req, res) {
  try {
    const { cursor = null, limit = 10, q = '', segment = 'following', sort = 'recent' } = req.query;
    const userId = req.user?.id || null;
    const data = await getFeedNotes({ cursor, limit, query: q, userId, segment, sort });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error al obtener el feed' });
  }
}

async function getByUsername(req, res) {
  try {
    const { username } = req.params;
    const viewerUserId = req.user?.id || null;
    const data = await getNotesByUsername(username, viewerUserId);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(404).json({ message: error.message || 'Error al obtener notas del usuario' });
  }
}

async function getProfile(req, res) {
  try {
    const profile = await getProfileByUsername(req.params.username, req.user?.id || null);
    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(404).json({ message: error.message || 'Error al obtener perfil' });
  }
}

async function getUserRepliesController(req, res) {
  try {
    const replies = await getUserReplies(req.params.username);
    return res.status(200).json({ replies });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener respuestas' });
  }
}

async function getUserLikesController(req, res) {
  try {
    const notes = await getUserLikedNotes(req.params.username, req.user?.id || null);
    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener likes' });
  }
}

async function getUserBookmarksController(req, res) {
  try {
    const notes = await getUserBookmarkedNotes(req.params.username, req.user?.id || null);
    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener guardados' });
  }
}

async function edit(req, res) {
  try {
    const note = await updateNote({ noteId: Number(req.params.id), userId: req.user.id, content: req.body.content });
    return res.status(200).json({ message: 'Nota actualizada correctamente', note });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al editar nota' });
  }
}

async function remove(req, res) {
  try {
    const result = await deleteNote({ noteId: Number(req.params.id), userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al eliminar nota' });
  }
}

async function like(req, res) {
  try {
    const result = await toggleLike({ noteId: Number(req.params.id), userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al procesar like' });
  }
}

async function bookmark(req, res) {
  try {
    const result = await toggleBookmark({ noteId: Number(req.params.id), userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al procesar favorito' });
  }
}

async function getComments(req, res) {
  try {
    const comments = await getCommentsByNoteId(Number(req.params.id));
    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(404).json({ message: error.message || 'Error al obtener comentarios' });
  }
}

async function comment(req, res) {
  try {
    const commentData = await createComment({ noteId: Number(req.params.id), userId: req.user.id, content: req.body.content });
    return res.status(201).json({ message: 'Comentario agregado correctamente', comment: commentData });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al comentar' });
  }
}

module.exports = {
  create,
  getFeed,
  getByUsername,
  getProfile,
  getUserRepliesController,
  getUserLikesController,
  getUserBookmarksController,
  edit,
  remove,
  like,
  bookmark,
  getComments,
  comment,
};
