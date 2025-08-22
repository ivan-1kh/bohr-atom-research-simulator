import express from 'express';

import { createPackage, updatePackage, addLocationToPackage, getPackages, getAllPackages } from './packages.js';
import { getCompanies, createCompany } from './companies.js';
import { getCustomers, createCustomer } from './customers.js';
import { searchLocation, getRoute } from './locations.js';


const router = express.Router();

// Basic ping test
router.get('/ping', (req, res) => res.send("Pong"));

// Routing for /packages
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.post('/packages/:id/location', addLocationToPackage);
router.get('/packages', (req, res) => {

    const companyId = req.query.company_id;

    if (companyId) {
        getPackages(req, res);
    } else {
        getAllPackages(req, res);
    }
});

// Routing for /companies
router.get('/companies', getCompanies);
router.post('/companies', createCompany);

// Routing for /customers
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);

// Routing for location utilities
router.get('/search-location', searchLocation);
router.get('/get-route', getRoute);


export default router;
