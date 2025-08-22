import { Router, Request, Response } from 'express';
import { portalAuth, requireCompanyType, requireRole, rateLimit, createToken, hashPassword, comparePassword, PortalRequest } from './auth';
import { DatabaseStorage } from '../../server/storage';
import { insertExternalUserSchema, insertExternalCompanySchema } from '../shared/schema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = Router();
const storage = new DatabaseStorage();

// ============= Public Routes (No Auth Required) =============

// Company registration
router.post('/api/portal/register/company', rateLimit(5, 3600000), async (req: Request, res: Response) => {
  try {
    const validation = insertExternalCompanySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const company = await storage.createExternalCompany(validation.data);
    res.json({ 
      message: 'Company registration submitted. Our team will review and activate your account.',
      companyId: company.id 
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User registration (requires company ID)
router.post('/api/portal/register/user', rateLimit(5, 3600000), async (req: Request, res: Response) => {
  try {
    const { companyId, ...userData } = req.body;
    
    // Verify company exists
    const company = await storage.getExternalCompany(companyId);
    if (!company) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    // Validate user data
    const validation = insertExternalUserSchema.safeParse(userData);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    // Create user (storage method handles password hashing)
    const user = await storage.createExternalUser({
      ...validation.data,
      companyId: company.id,
    });

    res.json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id 
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/api/portal/login', rateLimit(10, 60000), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const users = await storage.getExternalUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    // Get company
    const company = await storage.getExternalCompany(user.companyId);
    if (!company || company.status !== 'active') {
      return res.status(403).json({ error: 'Company account is not active' });
    }

    // Create session
    const token = createToken(user.id, company.id);
    const session = await storage.createPortalSession({
      token,
      userId: user.id,
      companyId: company.id,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      expiresAt: new Date(Date.now() + 3600000),
    });

    // Update last login time
    // await storage.updateExternalUserLastLogin(user.id); // TODO: implement this method

    const responseData = {
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: company.id,
        companyName: company.name,
        companyType: company.type,
      },
      company: {
        id: company.id,
        name: company.name,
        type: company.type,
      },
    };

    console.log('=== PORTAL LOGIN SUCCESS RESPONSE ===');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('Company:', company.name, company.type);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============= Authenticated Routes =============

// Get current user profile
router.get('/api/portal/profile', portalAuth, async (req: PortalRequest, res: Response) => {
  res.json({
    user: req.user,
    company: req.company,
  });
});

// ============= Supplier Routes =============

// Get purchase orders for supplier
router.get('/api/portal/supplier/purchase-orders', 
  portalAuth, 
  requireCompanyType('supplier'),
  async (req: PortalRequest, res: Response) => {
    try {
      const orders = await storage.getSupplierPurchaseOrders(req.company!.id);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  }
);

// Update delivery status
router.post('/api/portal/supplier/delivery/:orderId', 
  portalAuth,
  requireCompanyType('supplier'),
  requireRole('admin', 'manager', 'user'),
  async (req: PortalRequest, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, estimatedDelivery, notes } = req.body;

      await storage.updateDeliveryStatus({
        orderId,
        supplierId: req.company!.id,
        status,
        trackingNumber,
        estimatedDelivery,
        notes,
        updatedBy: req.user!.id,
      });

      res.json({ message: 'Delivery status updated successfully' });
    } catch (error) {
      console.error('Error updating delivery:', error);
      res.status(500).json({ error: 'Failed to update delivery status' });
    }
  }
);

// ============= Customer Routes =============

// Get orders for customer
router.get('/api/portal/customer/orders',
  portalAuth,
  requireCompanyType('customer', 'oem'),
  async (req: PortalRequest, res: Response) => {
    try {
      const orders = await storage.getCustomerOrders(req.company!.id);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }
);

// Place new order
router.post('/api/portal/customer/orders',
  portalAuth,
  requireCompanyType('customer', 'oem'),
  requireRole('admin', 'manager', 'user'),
  rateLimit(50, 60000),
  async (req: PortalRequest, res: Response) => {
    try {
      const orderData = req.body;
      
      const order = await storage.createCustomerOrder({
        ...orderData,
        customerId: req.company!.id,
        createdBy: req.user!.id,
      });

      res.json({ 
        message: 'Order placed successfully',
        orderId: order.id 
      });
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ error: 'Failed to place order' });
    }
  }
);

// ============= OEM-Specific Routes =============

// Get production visibility
router.get('/api/portal/oem/production-status',
  portalAuth,
  requireCompanyType('oem'),
  async (req: PortalRequest, res: Response) => {
    try {
      const status = await storage.getProductionStatusForOEM(req.company!.id);
      res.json(status);
    } catch (error) {
      console.error('Error fetching production status:', error);
      res.status(500).json({ error: 'Failed to fetch production status' });
    }
  }
);

// Submit demand forecast
router.post('/api/portal/oem/forecast',
  portalAuth,
  requireCompanyType('oem'),
  requireRole('admin', 'manager'),
  async (req: PortalRequest, res: Response) => {
    try {
      const forecastData = req.body;
      
      await storage.submitDemandForecast({
        ...forecastData,
        oemId: req.company!.id,
        submittedBy: req.user!.id,
      });

      res.json({ message: 'Forecast submitted successfully' });
    } catch (error) {
      console.error('Error submitting forecast:', error);
      res.status(500).json({ error: 'Failed to submit forecast' });
    }
  }
);

// ============= Document Management =============

// Upload document
router.post('/api/portal/documents/upload',
  portalAuth,
  requireRole('admin', 'manager', 'user'),
  async (req: PortalRequest, res: Response) => {
    try {
      const { documentType, relatedId, file } = req.body;
      
      const document = await storage.uploadPortalDocument({
        companyId: req.company!.id,
        userId: req.user!.id,
        documentType,
        relatedId,
        file,
      });

      res.json({ 
        message: 'Document uploaded successfully',
        documentId: document.id 
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// Get documents
router.get('/api/portal/documents',
  portalAuth,
  async (req: PortalRequest, res: Response) => {
    try {
      const documents = await storage.getPortalDocuments(req.company!.id);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
);

// ============= Analytics & Reports =============

// Get dashboard data
router.get('/api/portal/dashboard',
  portalAuth,
  async (req: PortalRequest, res: Response) => {
    try {
      const dashboardData = await storage.getPortalDashboard(
        req.company!.id,
        req.company!.type
      );
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
);

// Get analytics
router.get('/api/portal/analytics',
  portalAuth,
  async (req: PortalRequest, res: Response) => {
    try {
      const { startDate, endDate, metrics } = req.query;
      
      const analytics = await storage.getPortalAnalytics({
        companyId: req.company!.id,
        companyType: req.company!.type,
        startDate: startDate as string,
        endDate: endDate as string,
        metrics: metrics ? (metrics as string).split(',') : undefined,
      });
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

export default router;