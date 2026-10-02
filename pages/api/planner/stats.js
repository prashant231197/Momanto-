// This API route proxies to the backend Express server
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default async function handler(req, res) {
  try {
    const response = await axios({
      method: req.method,
      url: `${API_URL}/api/planner/stats`,
      headers: {
        ...req.headers,
        host: 'localhost:5000'
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to proxy request' });
    }
  }
}
