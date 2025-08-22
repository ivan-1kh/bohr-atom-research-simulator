import axios from 'axios';
import validator from 'validator';
import Companies from '../models/Companies.js';
import Customers from '../models/Customers.js';
import Packages from '../models/Packages.js';

import getCoordinates from '../utils/getCoordinates.js';


/**
 * Search locations using LocationIQ
 * GET /api/search-location?q=query
 */
export async function searchLocation(req, res) {
  try {
    const { q } = req.query;

    // Validates the input
    if (!q || !validator.isLength(q.trim(), { min: 1, max: 200 })) {
      return res.status(400).json({ error: 'Valid query parameter required' });
    }

    //Send API request to receive 5 possible locations
    const response = await axios.get(`https://us1.locationiq.com/v1/search`, {
      params: {
        key: process.env.LOCATIONIQ_API_KEY,
        q: q.trim(),
        format: 'json',
        limit: 5
      }
    });

    res.json(response.data); //returns results to frontend

  } catch (error) {
    console.error('Error searching location:', error);
    res.status(500).json({ error: 'Error searching location' });
  }
}


/**
 * Get route map for package
 * GET /api/getroute?package_id=<ID>
 */
export async function getRoute(req, res) {

  try {

    const { package_id } = req.query;

    // Validate package ID
    if (!validator.isMongoId(package_id)) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    // Fetch package from MongoDB
    const pkg = await Packages.findById(package_id)
      .populate('customer_id', 'customer_address');

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (pkg.path.length === 0) {
      return res.status(400).json({ error: 'No route data available for this package' });
    }

    // Generate map URL using Geoapify
    let mapUrl = 'https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=800&height=600';
    mapUrl += "&marker=";

    // Add markers for each location in path
    pkg.path.forEach((location, index) => {
      mapUrl += `lonlat:${location.lon},${location.lat};type:material;color:%231f63e6;size:large;icon:cloud;icontype:awesome;text:${index + 1};whitecircle:no`;

      if (index < pkg.path.length - 1) {
        mapUrl += '|';
      }
    });

    // Add destination marker for customer home address
    if (pkg.customer_id && pkg.customer_id.customer_address) {

      const homeAddress = await getCoordinates(pkg.customer_id.customer_address);

      mapUrl += `|lonlat:${homeAddress.lon},${homeAddress.lat};type:material;color:%23ff0000;size:large;icon:home;icontype:awesome;whitecircle:no`;
    }

    // Add API Key to the query
    mapUrl += '&apiKey=' + process.env.GEOAPIFY_API_KEY;

    try {

      const response = await axios.get(mapUrl, { responseType: 'arraybuffer' });

      res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.send(Buffer.from(response.data));

    } catch (error) {

      console.error('Error fetching or sending image:', error);
      res.status(500).json({ error: 'Error fetching map image' });
    }

  } catch (error) {
    
    console.error('Error generating route map:', error);
    res.status(500).json({ error: 'Error generating route map' });
  }
}
