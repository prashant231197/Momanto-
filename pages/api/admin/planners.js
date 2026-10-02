import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default async function handler(req, res) {
  try {
    const response = await axios({
      method: req.method,
      url: `${API_URL}/api/admin/planners`,
      headers: {
        authorization: req.headers.authorization || '',
        'content-type': 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message || 'Failed to proxy request' });
    }
  }
}
