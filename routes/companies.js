import validator from 'validator';
import Companies from '../models/Companies.js';
import Customers from '../models/Customers.js';
import Packages from '../models/Packages.js';


/**
 * Get all companies
 * GET /api/companies
 */
export async function getCompanies(req, res) {

  try {

    const companies = await Companies.find().sort({ company_name: 1 });
    res.json(companies);

  } catch (error) {

    console.error('Error getting companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Create a new company
 * POST /api/companies
 */
export async function createCompany(req, res) {

  try {

    const { company_name, company_website } = req.body;

    console.log(req.body);

    // Validate input
    if (!company_name || !validator.isLength(company_name.trim(), { min: 1, max: 200 })) {
      return res.status(400).json({ error: 'Company name is required and must be between 1-200 characters' });
    }

    if (!company_website || !validator.isURL(company_website)) {
      return res.status(400).json({ error: 'Company website is required and must be a valid URL' });
    }

    // Creates a new company in MongoDB
    const company = new Companies({
      company_name: company_name.trim(),
      company_website: company_website.trim()
    });

    await company.save();

    res.status(201).json({
      message: 'Company created successfully',
      company: company
    });

  } catch (error) {

    console.error('Error creating company:', error);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'Company name already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}