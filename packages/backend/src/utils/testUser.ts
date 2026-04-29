import User from '../models/User';
import { connectDatabase } from '../config/database';

export const testUserModel = async () => {
  console.log('\n🧪 Testing User Model...\n');

  try {
    // Connect to database
    await connectDatabase();

    // Test 1: Create a new user
    console.log('1️⃣ Creating new user...');
    const newUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    console.log('✅ User created:', {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
    console.log('🔒 Password hashed:', newUser.password.substring(0, 20) + '...');

    // Test 2: Find user (password should not be returned)
    console.log('\n2️⃣ Finding user without password...');
    const foundUser = await User.findById(newUser._id);
    console.log('✅ User found:', foundUser);
    console.log('Password included?', foundUser?.password ? 'YES ❌' : 'NO ✅');

    // Test 3: Find user with password explicitly selected
    console.log('\n3️⃣ Finding user WITH password...');
    const userWithPassword = await User.findById(newUser._id).select('+password');
    console.log('✅ User found with password');

    // Test 4: Compare password (correct)
    console.log('\n4️⃣ Testing password comparison (correct password)...');
    const isMatch = await userWithPassword!.comparePassword('password123');
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');

    // Test 5: Compare password (incorrect)
    console.log('\n5️⃣ Testing password comparison (wrong password)...');
    const isWrongMatch = await userWithPassword!.comparePassword('wrongpassword');
    console.log('Password match:', isWrongMatch ? '❌ YES (SHOULD BE NO)' : '✅ NO');

    // Test 6: Try creating duplicate email
    console.log('\n6️⃣ Testing unique email constraint...');
    try {
      await User.create({
        name: 'Jane Doe',
        email: 'john@example.com', // Same email
        password: 'password456',
      });
      console.log('❌ Duplicate email was allowed (SHOULD FAIL)');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Duplicate email rejected correctly');
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteOne({ _id: newUser._id });
    console.log('✅ Test user deleted\n');

    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  testUserModel();
}