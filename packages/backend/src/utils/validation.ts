export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { 
  isValid: boolean; 
  message?: string 
} => {
  if (password.length < 6) {
    return { 
      isValid: false, 
      message: 'Password must be at least 6 characters long' 
    };
  }
  
  if (password.length > 128) {
    return { 
      isValid: false, 
      message: 'Password must not exceed 128 characters' 
    };
  }
  
  return { isValid: true };
};

export const validateName = (name: string): { 
  isValid: boolean; 
  message?: string 
} => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { 
      isValid: false, 
      message: 'Name must be at least 2 characters long' 
    };
  }
  
  if (trimmedName.length > 50) {
    return { 
      isValid: false, 
      message: 'Name must not exceed 50 characters' 
    };
  }
  
  return { isValid: true };
};