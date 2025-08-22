import axios from 'axios';
import validator from 'validator';
import Companies from '../models/Companies.js';
import Customers from '../models/Customers.js';
import Packages from '../models/Packages.js';

import validatePackageInput from '../utils/validatePackageInput.js';


/**
 * Create a new package
 * POST /api/packages
 * Body: Package details without path
 */
export async function createPackage(req, res) {

  try {
    // creation_date and path setup automatically
    const { sku, package_name, eta, status, company_id, customer_id } = req.body;

    console.log(req.body);

    // Validate input & check if company & customer exist
    const validationErrors = await validatePackageInput(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: validationErrors.toString(),
        details: validationErrors
      });
    }

    // Create package object in MongoDB
    const packageData = new Packages({
      sku: sku,
      package_name: package_name.trim(),
      eta: new Date(eta),
      status: status,
      path: [],
      company_id: company_id,
      customer_id: customer_id
    });

    await packageData.save();

    res.status(201).json({
      message: 'Package created successfully',
      package_id: packageData._id
    });

  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Update package details
 * PUT /api/packages/:id
 * Body: Fields to update (eta, status)
 */
export async function updatePackage(req, res) {

  try {

    const packageId = req.params.id;
    const { eta, status } = req.body;

    // Validate package ID
    if (!validator.isMongoId(packageId)) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    const updateData = {};

    // Validate and add eta if provided
    if (eta !== undefined) {
      if (!validator.isISO8601(eta)) {
        return res.status(400).json({ error: 'Invalid ETA format' });
      }
      updateData.eta = new Date(eta);
    }

    // Validate and add status if provided
    if (status !== undefined) {

      if (!['packed', 'shipped', 'intransit', 'delivered'].includes(status.trim())) {
        return res.status(400).json({ error: 'Package status must be one of the following: [packed, shipped, intransit, delivered]' });
      }

      updateData.status = status;
    }

    const updatedPackage = await Packages.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ message: 'Package updated successfully', package: updatedPackage });

  } catch (error) {

    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Add location to package path
 * POST /api/packages/:id/location
 */
export async function addLocationToPackage(req, res) {

  try {

    const packageId = req.params.id;
    let { lat, lon } = req.body;

    // Validate package ID
    if (!validator.isMongoId(packageId)) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    // Validate coordinates
    if (!lat || !lon || !validator.isFloat(lat.toString(), { min: -90, max: 90 }) ||
      !validator.isFloat(lon.toString(), { min: -180, max: 180 })) {
      return res.status(400).json({ error: 'Valid latitude and longitude required' });
    }

    // Find package in MongoDB
    const pkg = await Packages.findById(packageId);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const newLocation = {
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };

    pkg.path.push(newLocation); //adds the location to the package's path sub-collection
    await pkg.save();

    res.json({ message: 'Location added to package path', path: pkg.path });

  } catch (error) {

    console.error('Error adding location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Get all packages or packages for specific company
 * GET /api/packages?company_id=<ID>
 */
export async function getPackages(req, res) {

  try {
    
    const { company_id } = req.query;

    // Validates companyId
    if (!company_id || !validator.isMongoId(company_id)) {
      return res.status(400).json({ error: 'Invalid company ID provided.' });
    }

    // Checks if the company exists
    const companyExists = await Companies.findById(company_id);
    if (!companyExists) {
      return res.status(404).json({ error: 'Company not found (0 exist in database).' });
    }

    // Query for all packages for company
    const packages = await Packages.find({ company_id: company_id })
      .populate('company_id', 'company_name company_website')
      .populate('customer_id', 'customer_name customer_email customer_address')
      .sort({ creation_date: -1 }); // Newest first

    // Sends response with the packages
    res.json({
      packages
    });

  } catch (error) {
    
    console.error('Error getting packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Get all packages in the system
 * GET /api/packages
 */
export async function getAllPackages(req, res) {

  try {

    // Query for all packages
    const packages = await Packages.find({});

    // Sends response with the packages
    res.json({
      packages
    });

  } catch (error) {
    
    console.error('Error getting packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}