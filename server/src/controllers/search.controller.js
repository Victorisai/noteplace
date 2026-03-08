const { searchAll } = require('../services/search.service');

async function search(req, res) {
  try {
    const { q = '' } = req.query;

    if (!q.trim()) {
      return res.status(200).json({
        users: [],
        notes: [],
      });
    }

    const result = await searchAll(q);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Error en búsqueda',
    });
  }
}

module.exports = {
  search,
};