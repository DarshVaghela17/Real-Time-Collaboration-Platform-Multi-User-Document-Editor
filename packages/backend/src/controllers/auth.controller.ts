import { Request, Response } from 'express';
import authService from '../services/auth.service';
import tokenBlacklistService from '../services/token.service';
import { RegisterDTO, LoginDTO, AuthRequest } from '../types';
import { ValidationError } from '../utils/validation';

export class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterDTO = req.body;

      // Validate required fields
      if (!registerData.name || !registerData.email || !registerData.password) {
        res.status(400).json({
          success: false,
          message: 'Please provide name, email, and password',
        });
        return;
      }

      // Call service
      const result = await authService.register(registerData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
      });
    }
  }

  /**
   * @route   POST /api/auth/login
   * @desc    Login user and return JWT token
   * @access  Public
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginDTO = req.body;

      // Step 1: Validate request body
      if (!loginData.email || !loginData.password) {
        res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
        return;
      }

      // Step 2: Call service to authenticate user
      const result = await authService.login(loginData);

      // Step 3: Log successful login (optional, for monitoring)
      console.log(`✅ User logged in: ${result.user.email}`);

      // Step 4: Return success response with user data and token
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      // Handle validation errors (wrong credentials)
      if (error instanceof ValidationError) {
        console.log(`❌ Login failed: ${error.message}`);
        res.status(401).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Handle unexpected errors
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
      });
    }
  }

  /**
   * @route   GET /api/auth/me
   * @desc    Get current authenticated user
   * @access  Private (requires JWT token)
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      // User is attached by auth middleware
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      // Fetch full user details from database
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  /**
   * @route   POST /api/auth/logout
   * @desc    Logout user and blacklist token
   * @access  Private
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Blacklist the token
        const blacklisted = await tokenBlacklistService.blacklistToken(token);
        
        if (blacklisted) {
          res.status(200).json({
            success: true,
            message: 'Logged out successfully. Token has been revoked.',
          });
          return;
        }
      }
      
      // Even if blacklist failed, still consider logout successful
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during logout',
      });
    }
  }
}

export default new AuthController();