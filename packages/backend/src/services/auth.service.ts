import User, { IUser } from '../models/User';
import { RegisterDTO, LoginDTO } from '../types';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  ValidationError 
} from '../utils/validation';
import { generateToken } from '../utils/jwt';

export class AuthService {
  /**
   * Register a new user
   */
  async register(registerData: RegisterDTO) {
    const { name, email, password } = registerData;

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      throw new ValidationError(nameValidation.message!);
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.message!);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create new user (password will be hashed automatically by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Return user info (without password) and token
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Login existing user
   * @throws ValidationError if credentials are invalid
   */
  async login(loginData: LoginDTO) {
    const { email, password } = loginData;

    // Step 1: Validate input presence
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Step 2: Validate email format
    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Step 3: Check if user exists (include password field)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!user) {
      // Security: Don't reveal whether email exists or not
      throw new ValidationError('Invalid email or password');
    }

    // Step 4: Compare password using bcrypt
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Security: Same error message as above
      throw new ValidationError('Invalid email or password');
    }

    // Step 5: Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Step 6: Return user info and token (exclude password)
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Get user by ID (for protected routes)
   */
  async getUserById(userId: string) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Verify if user exists and is valid
   */
  async verifyUser(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return !!user;
  }
}

export default new AuthService();